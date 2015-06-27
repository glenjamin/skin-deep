var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var ReactContext = require('react/lib/ReactContext');

exports.shallowRender = shallowRender;
function shallowRender(elementOrFunction, context) {
  context = context || {};
  global.document = global.document || { body: {} };
  ReactContext.current = context;

  var shallowRenderer = TestUtils.createRenderer();
  var element = TestUtils.isElement(elementOrFunction) ?
    elementOrFunction : elementOrFunction();
  shallowRenderer.render(element, context);
  ReactContext.current = {};
  return {
    findNode: findNodeIn.bind(0, shallowRenderer),
    textIn: function(query) {
      var node = findNodeIn(shallowRenderer, query);
      return node && node.props && String(node.props.children);
    },
    text: function() {
      return getTextFromNode(shallowRenderer.getRenderOutput());
    },
    fillField: function(query, value) {
      var node = findNodeIn(shallowRenderer, query);
      if (!node || !node.props) throw new Error('Unknown field ' + query);
      if (node.props.onChange) {
        node.props.onChange({ target: { value: value } });
      }
    },
    getRenderOutput: function() {
      return shallowRenderer.getRenderOutput();
    },
    toString: function() {
      return React.renderToStaticMarkup(shallowRenderer.getRenderOutput());
    }
  };
}

function findNodeIn(shallowRenderer, query) {
  var node = shallowRenderer.getRenderOutput();
  var finder = null;
  if (query.match(/^\.[\w\-]+$/)) {
    finder = findNodeByClass(query.substring(1));
  }
  if (query.match(/^\#[\w\-]+$/)) {
    finder = findNodeById(query.substring(1));
  }
  if (query.match(/^[\w\-]+$/)) {
    finder = function(n) { return n.type == query; };
  }
  if (!finder) {
    throw new Error('Invalid node query ' + query);
  }
  return findNode(node, finder);
}

function findNodeByClass(cls) {
  var regex = new RegExp('\\b' + cls + '\\b');

  return function(n) {
    return n.props && String(n.props.className).match(regex);
  };
}

function findNodeById(id) {
  return function(n) {
    return n.props && String(n.props.id) == id;
  };
}

function findNode(node, fn) {
  if (fn(node)) {
    return node;
  }
  if (node.some) {
    var matched = false;
    node.some(function(n) {
      matched = findNode(n, fn);
      return matched;
    });
    return matched;
  }
  if (!node.props || !node.props.children) {
    return false;
  }
  return findNode(node.props.children, fn);
}

function getTextFromNode(node) {
  // strings and numbers are just text
  if (typeof node === 'string' || typeof node === 'number') {
    return '' + node;
  }
  // Iterables get combined with spaces
  if (typeof node.map === 'function') {
    return node.map(getTextFromNode).join(' ');
  }
  // Non-dom components are a black box
  if (TestUtils.isElement(node) && typeof node.type !== 'string') {
    return '<' + node.type.displayName + ' />';
  }

  // Recurse down through children if present
  var children = node.props && node.props.children;
  if (children) return getTextFromNode(children);

  // Otherwise, stop
  return '';
}

exports.chaiShallowRender = function(chai, utils) {
  var Assertion = chai.Assertion;
  var flag = utils.flag;

  function inRenderedOutput(query, msg) {
    if (msg) flag(this, 'message', msg);
    var renderer = flag(this, 'object');

    var node = renderer.findNode(query);
    this.assert(node,
      'Expected to find #{exp} in #{act}',
      'Expected not to find #{exp} in #{act}',
      query, React.renderToString(renderer.getRenderOutput())
    );
  }

  Assertion.addMethod('inRenderedOutput', inRenderedOutput);

  chai.assert.inRenderedOutput = function(renderer, query, msg) {
    new Assertion(renderer, msg).to.have.inRenderedOutput(query, msg);
  };

  chai.assert.notInRenderedOutput = function(renderer, query, msg) {
    new Assertion(renderer, msg).to.not.have.inRenderedOutput(query, msg);
  };
};
