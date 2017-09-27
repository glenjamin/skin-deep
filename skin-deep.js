var subset = require('is-subset');

var escapeStringRegexp = require('escape-string-regexp');

var React = require('react');

var ReactElementToString = require('react-element-to-string');

var traversal = require('./lib/traversal');

var Versions = require('./lib/versions');

var ReactCompat = require('./lib/react-compat');

var TestUtils = ReactCompat.TestUtils;
var createShallowRenderer = ReactCompat.createShallowRenderer;

exports.shallowRender = shallowRender;
function shallowRender(element, context) {
  context = context || {};

  var shallowRenderer = createShallowRenderer();
  shallowRenderer.context = context;

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
    Versions.ReactBefore16
      ? shallowRenderer._instance._instance
      : shallowRenderer._instance
    /* eslint-enable no-underscore-dangle */
  );
}

exports.hasClass = hasClass;
function hasClass(node, cls) {
  return Boolean(findNodeByClass(cls)(node));
}

function SkinDeep(getCurrentNode, renderer, instance) {
  var api = {
    reRender: function(props, context) {
      context = context || renderer.context;

      var element = React.createElement(renderer.originalType, props);

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
      paths.forEach(function(path) {
        var rawTree = tree.subTree(path);
        if (!rawTree) throw new Error(path + ' not found in tree');
        var node = rawTree.getRenderOutput();
        tree = shallowRender(node, context);
      });
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
  var regex = new RegExp('(?:^|\\s)' + escapeStringRegexp(cls) + '(?:\\s|$)');

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
  var relevantNodes = traversal.collect(node, textOrComponentNode, {
    blackboxComponents: true
  });

  return normaliseSpaces(relevantNodes.map(nodeToString).join(''));
}

function textOrComponentNode(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return true;
  }
  if (TestUtils.isElement(node) && typeof node.type !== 'string') {
    return true;
  }
  return false;
}

function nodeToString(node) {
  if (TestUtils.isElement(node)) {
    return '<' + (getComponentName(node.type) || 'Unknown') + ' />';
  }
  return String(node);
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
