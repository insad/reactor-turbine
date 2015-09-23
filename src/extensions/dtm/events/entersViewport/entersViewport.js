'use strict';

var poll = require('poll');
var createDataStash = require('createDataStash');
var bubbly = require('resourceProvider').get('dtm', 'createBubbly')();
var dataStash = createDataStash('entersViewport');
var TIMEOUT_ID = 'timeoutId';
var COMPLETE = 'complete';

var listeners = [];

/**
 * Gets the offset of the element.
 * @param elem
 * @returns {{top: number, left: number}}
 */
var offset = function(elem) {
  var box;

  try {
    box = elem.getBoundingClientRect();
  } catch (e) {
    // ignore
  }

  var doc = document;
  var docElem = doc.documentElement;
  var body = doc.body;
  var win = window;
  var clientTop = docElem.clientTop || body.clientTop || 0;
  var clientLeft = docElem.clientLeft || body.clientLeft || 0;
  var scrollTop = win.pageYOffset || docElem.scrollTop || body.scrollTop;
  var scrollLeft = win.pageXOffset || docElem.scrollLeft || body.scrollLeft;
  var top = box.top + scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;

  return {
    top: top,
    left: left
  };
};

/**
 * Viewport height.
 * @returns {Number}
 */
var getViewportHeight = function() {
  var height = window.innerHeight; // Safari, Opera
  var mode = document.compatMode;

  if (mode) { // IE, Gecko
    height = (mode === 'CSS1Compat') ?
      document.documentElement.clientHeight : // Standards
      document.body.clientHeight; // Quirks
  }

  return height;
};

/**
 * Scroll top.
 * @returns {number}
 */
var getScrollTop = function() {
  return document.documentElement.scrollTop ?
    document.documentElement.scrollTop :
    document.body.scrollTop;
};

/**
 * Whether an element is in the viewport.
 * @param element The element to evaluate.
 * @param viewportHeight The viewport height. Passed in for optimization purposes.
 * @param scrollTop The scroll top. Passed in for optimization purposes.
 * @returns {boolean}
 */
var elementIsInView = function(element, viewportHeight, scrollTop) {
  var top = offset(element).top;
  var height = element.offsetHeight;
  return document.body.contains(element) &&
    !(scrollTop > (top + height) || scrollTop + viewportHeight < top);
};

/**
 * Gets an event type specific to the delay to use in the pseudo event.
 * @param {number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 * @returns {string}
 */
function getPseudoEventType(delay) {
  delay = delay || 0;
  return 'inview(' + delay + ')';
}

/**
 * Notifies that an element as having been in the viewport for the specified delay.
 * @param {HTMLElement} element The element that is in the viewport.
 * @param {Number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 */
function triggerCompleteEvent(element, delay) {
  var event = {
    type: 'inview',
    target: element,
    // If the user did not configure a delay, inviewDelay should be undefined.
    inviewDelay: delay
  };

  bubbly.evaluateEvent(event);
}


/**
 * Gets the timeout ID for a particular element + delay combo.
 * @param {HTMLElement} element
 * @param {Number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 * @returns {number}
 */
function getTimeoutId(element, delay) {
  return dataStash(element, TIMEOUT_ID + delay);
}

/**
 * Stored a timeout ID for ar particular element + delay combo.
 * @param {HTMLElement} element
 * @param {Number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 * @param {number} timeoutId
 */
function storeTimeoutId(element, delay, timeoutId) {
  dataStash(element, TIMEOUT_ID + delay, timeoutId);
}

/**
 * Returns whether the process is complete for detecting when the element has entered the
 * viewport for a particular element + delay combo.
 * @param {HTMLElement} element
 * @param {Number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 * @returns {boolean}
 */
function isComplete(element, delay) {
  return dataStash(element, COMPLETE + delay);
}

/**
 * Stores that the process has been completed for detecting when the element has entered the
 * viewport for a particular element + delay combo.
 * @param {HTMLElement} element
 * @param {Number} delay The amount of time, in milliseconds, the element was required to be in
 * the viewport.
 */
function storeCompletion(element, delay) {
  dataStash(element, COMPLETE + delay, true);
}

/**
 * Delays the checking of whether an element is in the viewport.
 * @param {HTMLElement} element
 * @param {Number} delay The amount of time, in milliseconds, the check should be delayed.
 * @returns {*|number}
 */
function delayInViewportCheck(element, delay) {
  return setTimeout(function() {
    if (elementIsInView(element, getViewportHeight(), getScrollTop())) {
      storeCompletion(element, delay);
      triggerCompleteEvent(element, delay);
    }
  }, delay);
}

/**
 * Checks to see if a rule's target selector matches an element in the viewport. If that element
 * has not been in the viewport prior, either (a) trigger the rule immediately if the user has not
 * elected to delay for a period of time or (b) start the delay period of the user has elected
 * to delay for a period of time. After an element being in the viewport triggers a rule, it
 * can't trigger the same rule again. If another element matching the same selector comes into
 * the viewport, it may trigger the same rule again.
 */
var checkIfElementsInViewport = function() {
  // Cached and re-used for optimization.
  var viewportHeight = getViewportHeight();
  var scrollTop = getScrollTop();
  var timeoutId;

  listeners.forEach(function(listener) {
    var delay = listener.delay;
    var elements = document.querySelectorAll(listener.selector);
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      if (isComplete(element, delay)) {
        continue;
      }

      if (elementIsInView(element, viewportHeight, scrollTop)) {
        if (delay) { // Element is in view, has delay
          if (!getTimeoutId(element, delay)) {
            timeoutId = delayInViewportCheck(element, delay);
            storeTimeoutId(element, delay, timeoutId);
          }
        } else { // Element is in view, has no delay
          storeCompletion(element, delay);
          triggerCompleteEvent(element, delay);
        }
      } else if (delay) { // Element is not in view, has delay
        timeoutId = getTimeoutId(element, delay);
        if (timeoutId) {
          clearTimeout(timeoutId);
          storeTimeoutId(element, delay, null);
        }
      }
    }
  });
};

// TODO: Add debounce to the scroll event handling?
window.addEventListener('scroll', checkIfElementsInViewport);
window.addEventListener('load', checkIfElementsInViewport);
poll('enters viewport event delegate', checkIfElementsInViewport);

/**
 * Enters viewport event. This event occurs when an element has entered the viewport. The rule
 * should only run once per targeted element.
 * @param {Object} config The event config object.
 * @param {string} config.selector The CSS selector for elements the rule is
 * targeting.
 * @param {Object} [config.elementProperties] Property names and values the element must have in
 * order for the rule to fire.
 * @param {Number} [config.delay] The number of milliseconds the element must be
 * within the viewport before declaring that the event has occurred.
 * @param {boolean} [config.bubbleFireIfParent=false] Whether the rule should fire
 * if the event originated from a descendant element.
 * @param {boolean} [config.bubbleFireIfChildFired=false] Whether the rule should
 * fire if the same event has already triggered a rule targeting a descendant element.
 * @param {boolean} [config.bubbleStop=false] Whether the event should not trigger
 * rules on ancestor elements.
 * @param {ruleTrigger} trigger The trigger callback.
 */
module.exports = function(config, trigger) {

  bubbly.addListener(config, function(event, relatedElement) {
    // Bubbling for this event is dependent upon the delay configured for rules.
    // An event can "bubble up" to other rules with the same delay but not to rules with
    // different delays. See the tests for how this plays out.
    if (event.inviewDelay === config.delay) {
      trigger(event, relatedElement);
    } else {
      return false;
    }
  });

  listeners.push(config);
};
