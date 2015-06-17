var forEach = require('./utils/array/forEach');
var preprocessSettings = require('./utils/preprocessSettings');

// TODO: Add a bunch of checks with error reporting.

module.exports = function(rules, integrationRegistry, eventDelegates, conditionDelegates) {
  function initEventDelegate(rule){
    if (rule.events){

      function trigger(event, relatedElement) {
        checkConditions(rule, event, relatedElement);
      }

      forEach(rule.events, function(event) {
        event.settings = event.settings || {};

        var delegate = eventDelegates.get(event.type);
        delegate(trigger, event.settings);
      });
    }
  }

  function checkConditions(rule, event, relatedElement) {
    if (rule.conditions) {
      for (var i = 0; i < rule.conditions.length; i++) {
        var condition = rule.conditions[i];
        condition.settings = condition.settings || {};

        var delegate = conditionDelegates.get(condition.type);
        if (!delegate(condition.settings, event, relatedElement)) {
          return;
        }
      }
    }

    runActions(rule, event, relatedElement);
  }

  function runActions(rule, event, relatedElement){
    forEach(rule.actions, function(action) {
      action.settings = action.settings || {};
      forEach(action.integrationIds, function(integrationId) {
        // TODO: Pass related element? Pass forceLowerCase?
        var preprocessedSettings = preprocessSettings(action.settings, relatedElement, event, false);
        integrationRegistry
          .getById(integrationId)
          .then(function(instance) {
            instance[action.method](preprocessedSettings);
          });
      });
    });
  }

  forEach(rules, function(rule){
    initEventDelegate(rule);
  });
};
