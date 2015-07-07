/*global FB*/
'use strict';

var connect = require('extensionCores').getOne('facebookConnect');

module.exports = function(settings, trigger) {
  connect.then(function() {
    FB.Event.subscribe('edge.remove', function(url, element) {
      trigger({url: url, element: element});
    });
  });
};
