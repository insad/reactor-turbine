'use strict';

var bubbly = require('resourceProvider').get('dtm', 'createBubbly')();

document.addEventListener('loadeddata', bubbly.evaluateEvent, true);

/**
 * The loadeddata event. This event occurs when the first frame of the media has finished loading.
 * @param {Object} config The event config object.
 * @param {string} config.selector The CSS selector for elements the rule is targeting.
 * @param {boolean} [config.bubbleFireIfParent=false] Whether the rule should fire if
 * the event originated from a descendant element.
 * @param {boolean} [config.bubbleFireIfChildFired=false] Whether the rule should fire
 * if the same event has already triggered a rule targeting a descendant element.
 * @param {boolean} [config.bubbleStop=false] Whether the event should not trigger
 * rules on ancestor elements.
 * @param {ruleTrigger} trigger The trigger callback.
 */
module.exports = function(config, trigger) {
  bubbly.addListener(config, trigger);
};
