var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var ReactContext = require('react/lib/ReactContext');

exports.shallowRender = shallowRender;
function shallowRender(makeComponent, context) {
  context = context || {};
  global.document = global.document || { body: {} };
  ReactContext.current = context;
  var shallowRenderer = TestUtils.createRenderer();
  shallowRenderer.render(makeComponent(), context);
  ReactContext.current = {};
  return {
    findNode: findNodeIn.bind(0, shallowRenderer),
    textIn: function(query) {
      var node = findNodeIn(shallowRenderer, query);
      return node && node.props && String(node.props.children);
    },
    fillField: function(query, value) {
      var node = findNodeIn(shallowRenderer, query);
      if (!node || !node.props) throw new Error('Unknown field ' + query);
      node.props.onChange({ target: {value: value} });
    },
    getRenderOutput: function() {
      return shallowRenderer.getRenderOutput();
    }
  };
}

function findNodeIn(shallowRenderer, query) {
  var node = shallowRenderer.getRenderOutput();
  if (query.match(/\.[\w\-]+/)) {
    return findNodeByClass(node, query.substring(1));
  }
  if (query.match(/\#[\w\-]+/)) {
    return findNodeById(node, query.substring(1));
  }
  throw new Error('Invalid node query ' + query);
}

function findNodeByClass(node, cls) {
  var regex = new RegExp('\\b' + cls + '\\b');

  return findNode(node, function(n) {
    return n.props && String(n.props.className).match(regex);
  });
}

function findNodeById(node, id) {
  return findNode(node, function(n) {
    return n.props && String(n.props.id) == id;
  });
}

function findNode(node, fn) {
  if (fn(node)) {
    return node;
  }
  if (!node.props || !node.props.children) {
    return false;
  }
  if (typeof node.props.children.some === 'function') {
    var matched = false;
    node.props.children.some(function(n) {
      matched = findNode(n, fn);
      return matched;
    });
    return matched;
  }
  if (typeof node.props.children === 'object') {
    return findNode(node.props.children, fn);
  }
  return false;
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
