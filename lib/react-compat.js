var TestUtils;
var createShallowRenderer;

var Versions = require('./versions');

if (Versions.ReactBefore155) {
  TestUtils = require('react-addons-test-utils');
  createShallowRenderer = TestUtils.createRenderer;
} else {
  TestUtils = require('react-dom/test-utils');
  createShallowRenderer = require('react-test-renderer/shallow').createRenderer;
}

exports.TestUtils = TestUtils;
exports.createShallowRenderer = createShallowRenderer;
