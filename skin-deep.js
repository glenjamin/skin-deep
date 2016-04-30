var subset = require('is-subset');

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');

var ReactElementToString = require('react-element-to-string');

var TestUtils;
if (React013) {
  TestUtils = require('react/addons').addons.TestUtils;
} else {
  TestUtils = require('react-addons-test-utils');
}

function withContext(context, fn) {
  if (!React013) return fn();

  var ReactContext = require('react/lib/ReactContext');
  ReactContext.current = context;
  var result = fn();
  ReactContext.current = {};
  return result;
}

var traversal = require('./lib/traversal');

exports.shallowRender = shallowRender;
function shallowRender(elementOrFunction, context) {
  context = context || {};

  var shallowRenderer = TestUtils.createRenderer();
  shallowRenderer.context = context;

  var element = withContext(context, function() {
    return TestUtils.isElement(elementOrFunction) ?
      elementOrFunction : elementOrFunction();
  });
  shallowRenderer.originalType = element.type;

  if (typeof element.type == 'string') {
    return new SkinDeep(
      function() { return element; },
      shallowRenderer
    );
  }

  shallowRenderer.render(element, context);

  return new SkinDeep(
    function() {
      return shallowRenderer.getRenderOutput();
    },
    shallowRenderer,
    /* eslint-disable no-underscore-dangle */
    shallowRenderer._instance._instance
    /* eslint-enable no-underscore-dangle */
  );
}

function SkinDeep(getCurrentNode, renderer, instance) {
  var api = {
    reRender: function(props, context) {
      context = context || renderer.context;

      var element = withContext(context, function() {
        return React.createElement(renderer.originalType, props);
      });

      return renderer.render(element, context);
    },
    getMountedInstance: function() {
      if (instance) return instance;
      throw new Error('This tree has no mounted instance');
    },
    subTree: function(query, predicate) {
      var node = findNode(
        getCurrentNode(), createFinder(query, predicate, 'isLike')
      );
      return node && skinDeepNode(node);
    },
    everySubTree: function(query, predicate) {
      var finder = createFinder(query, predicate, 'isLike');
      return findNodes(getCurrentNode(), finder).map(skinDeepNode);
    },
    dive: function(paths, context) {
      var tree = api;
      while (paths.length) {
        var path = paths.shift();
        var rawTree = tree.subTree(path);
        if (!rawTree) throw new Error(path + ' not found in tree');
        var node = rawTree.getRenderOutput();
        tree = shallowRender(reContext(node), context);
      }
      return tree;
    },
    text: function() {
      return getTextFromNode(getCurrentNode());
    },
    getRenderOutput: function() {
      return getCurrentNode();
    },
    toString: function() {
      return ReactElementToString(getCurrentNode());
    }
  };
  Object.defineProperty(api, 'props', {
    enumerable: true,
    get: function() { return getCurrentNode().props; }
  });
  Object.defineProperty(api, 'type', {
    enumerable: true,
    get: function() { return getCurrentNode().type; }
  });
  return api;
}

function skinDeepNode(node) {
  return new SkinDeep(constantly(node));
}

/**
 * Re-create node as a new react element wrapped in a function
 *
 * This is to ensure context is reapplied in React 0.13
 */
function reContext(node) {
  return function() {
    return React.createElement(node.type, node.props);
  };
}

function getComponentName(type) {
  return type.displayName || type.name;
}

function createNodePredicate(query) {
  if (query == '*') {
    return alwaysTrue;
  }
  // React Component itself or tag name
  if (typeof query !== 'string' || query.match(/^[a-z][\w\-]*$/)) {
    return findNodeByType(query);
  }
  if (query.match(/^\.[\S]+$/)) {
    return findNodeByClass(query.substring(1));
  }
  if (query.match(/^#[\S]+$/)) {
    return findNodeById(query.substring(1));
  }
  // component displayName
  return function(n) { return n.type && getComponentName(n.type) == query; };
}

function createFinder(selector, predicate) {
  var nodeMatcher = createNodePredicate(selector);
  var otherMatcher = alwaysTrue;
  if (typeof predicate === 'object') {
    // predicate is a props object to match
    otherMatcher = function(node) {
      return subset(node.props, predicate);
    };
  } else if (typeof predicate === 'function') {
    otherMatcher = predicate;
  }
  return function(node) {
    return nodeMatcher(node) && otherMatcher(node);
  };
}

function findNodeByType(type) {
  return function(n) {
    return n.type == type;
  };
}

function findNodeByClass(cls) {
  var regex = new RegExp('(?:^|\\s)' + cls + '(?:\\s|$)');

  return function(n) {
    return n.props && String(n.props.className).match(regex);
  };
}

function findNodeById(id) {
  return function(n) {
    return n.props && String(n.props.id) == id;
  };
}

function findNode(node, predicate) {
  var all = traversal.collect(node, predicate);
  return all.length >= 1 && all[0];
}

function findNodes(node, predicate) {
  return traversal.collect(node, predicate);
}

function getTextFromNode(node) {
  // Ignore null/undefined children
  if (node === null || node === undefined) {
    return '';
  }
  // strings and numbers are just text
  if (typeof node === 'string' || typeof node === 'number') {
    return normaliseSpaces(String(node));
  }
  // Iterables get combined with spaces
  if (typeof node.map === 'function') {
    return normaliseSpaces(node.map(getTextFromNode).join(''));
  }
  // Non-dom components are a black box
  if (TestUtils.isElement(node) && typeof node.type !== 'string') {
    var name = getComponentName(node.type) || 'Unknown';
    return '<' + name + ' />';
  }

  // Recurse down through children if present
  if (node.props && 'children' in node.props) {
    return getTextFromNode(childrenArray(node.props.children));
  }

  // Otherwise, stop
  return '';
}

function childrenArray(children) {
  var array = [];
  React.Children.forEach(children, function(child) {
    array.push(child);
  });
  return array;
}

function normaliseSpaces(str) {
  return str.replace(/\s+/g, ' ');
}

function constantly(x) {
  return function() {
    return x;
  };
}

function alwaysTrue() {
  return true;
}
