var TestUtils;
var createShallowRenderer;

var Versions = require('./versions');

if (Versions.React155) {
  TestUtils = require('react-dom/test-utils');
  createShallowRenderer = require('react-test-renderer/shallow').createRenderer;
} else {
  TestUtils = require('react-addons-test-utils');
  createShallowRenderer = TestUtils.createRenderer;
}

exports.TestUtils = TestUtils;
exports.createShallowRenderer = createShallowRenderer;
