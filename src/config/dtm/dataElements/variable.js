'use strict';

var getObjectProperty = require('getObjectProperty');

module.exports = function(settings) {
  return getObjectProperty(window, settings.dataElementSettings.path);
};
