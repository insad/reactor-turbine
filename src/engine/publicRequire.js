var resources = {
  'extensionCores': {
    get: function(extensionType) {
      return require('./stores/coreRegistry').get(extensionType);
    }
  },
  'Promise': require('./utils/communication/Promise'),
  'poll': require('./utils/communication/globalPoll'),
  'bind': require('./utils/dom/bind'),
  'covertData': require('./utils/covertData'),
  'addEventListener': require('./utils/dom/addEventListener'),
  'assign': require('./utils/object/assign'),
  'encodeObjectToURI': require('./utils/uri/encodeObjectToURI'),
  'isHTTPS': require('./utils/uri/isHTTPS'),
  'clientInfo': require('./utils/clientInfo'),
  'createBeacon': require('./utils/createBeacon'),
  'hideElements': require('./utils/dom/hideElements'),
  'loadScript': require('./utils/loadScript'),
  'textMatch': require('./utils/string/textMatch'),
  'getQueryParam': require('./utils/uri/getQueryParam'),
  'isLinked': function(element) { // For backward compatibility.
    require('./utils/dom/isAnchor')(element, true);
  },
  'readCookie': require('./utils/cookie/readCookie'),
  'getObjectProperty': require('./utils/dataElement/getObjectProperty'),
  'bubbly': require('./utils/bubbly'),
  'addLiveEventListener': require('./utils/communication/addLiveEventListener')
};

module.exports = function(key) {
  if (resources.hasOwnProperty(key)) {
    return resources[key];
  } else {
    throw new Error('Cannot resolve module "' + key + '".');
  }
};
