var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var ReactContext = require('react/lib/ReactContext');

exports.shallowRender = shallowRender;
function shallowRender(elementOrFunction, context) {
  context = context || {};

  var shallowRenderer = TestUtils.createRenderer();

  ReactContext.current = context;
  var element = TestUtils.isElement(elementOrFunction) ?
    elementOrFunction : elementOrFunction();
  ReactContext.current = {};

  shallowRenderer.render(element, context);

  return new SkinDeep(function() {
    return shallowRenderer.getRenderOutput();
  });
}

function SkinDeep(getCurrentNode) {
  return {
    findNode: function(query) {
      return findNodeIn(getCurrentNode(), query);
    },
    textIn: function(query) {
      var node = findNodeIn(getCurrentNode(), query);
      return getTextFromNode(node);
    },
    text: function() {
      return getTextFromNode(getCurrentNode());
    },
    fillField: function(query, value) {
      var node = findNodeIn(getCurrentNode(), query);
      if (!node || !node.props) throw new Error('Unknown field ' + query);

      if (node.props.onChange) {

        // workaround for https://github.com/facebook/react/issues/4019
        global.document = global.document || { body: {} };

        node.props.onChange({ target: { value: value } });
      }
    },
    getRenderOutput: function() {
      return getCurrentNode();
    },
    toString: function() {
      return React.renderToStaticMarkup(getCurrentNode());
    }
  };
}

function findNodeIn(node, query) {
  var finder = null;
  if (query.match(/^\.[\w\-]+$/)) {
    finder = findNodeByClass(query.substring(1));
  }
  if (query.match(/^\#[\w\-]+$/)) {
    finder = findNodeById(query.substring(1));
  }
  if (query.match(/^[a-z][\w\-]+$/)) { // tagname
    finder = function(n) { return n.type == query; };
  }
  if (query.match(/^[A-Z][\w\-]+$/)) { // component displayName
    finder = function(n) { return n.type && n.type.displayName == query; };
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
    return node.map(getTextFromNode).join(' ').replace(/\s+/, ' ');
  }
  // Non-dom components are a black box
  if (TestUtils.isElement(node) && typeof node.type !== 'string') {
    return '<' + node.type.displayName + ' />';
  }

  // Recurse down through children if present
  if (node.props && 'children' in node.props) {
    return getTextFromNode(node.props.children);
  }

  // Otherwise, stop
  return '';
}
