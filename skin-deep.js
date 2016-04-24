var subset = require('is-subset');

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');

var TestUtils;
if (React013) {
  TestUtils = require('react/addons').addons.TestUtils;
} else {
  TestUtils = require('react-addons-test-utils');
}

function renderToStaticMarkup(element) {
  if (React013) {
    return React.renderToStaticMarkup(element);
  }

  return require("react-dom/server").renderToStaticMarkup(element);
}

function withContext(context, fn) {
  if (!React013) return fn();

  var ReactContext = require('react/lib/ReactContext');
  ReactContext.current = context;
  var result = fn();
  ReactContext.current = {};
  return result;
}

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
      var node = findNode(getCurrentNode(), createFinder(query, predicate));
      return node && skinDeepNode(node);
    },
    subTreeLike: function(query, predicate) {
      var node = findNode(
        getCurrentNode(), createFinder(query, predicate, 'isLike')
      );
      return node && skinDeepNode(node);
    },
    everySubTree: function(query, predicate) {
      var finder = createFinder(query, predicate);
      return findNodes(getCurrentNode(), finder).map(skinDeepNode);
    },
    everySubTreeLike: function(query, predicate) {
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
    findNode: function(query) {
      return findNode(getCurrentNode(), createNodePredicate(query));
    },
    textIn: function(query) {
      var node = findNode(getCurrentNode(), createNodePredicate(query));
      return getTextFromNode(node);
    },
    text: function() {
      return getTextFromNode(getCurrentNode());
    },
    findComponent: function(type, props) {
      if (arguments.length == 1) {
        // eslint-disable-next-line no-console
        console.warn(
          "Using a component in findComponent is deprecated. " +
          "Pass name and props as separate arguments instead"
        );
        var search = type;
        type = getComponentName(search.type) || search.type;
        props = search.props;
      }
      return findNode(getCurrentNode(), createFinder(type, props));
    },
    findComponentLike: function(type, props) {
      if (arguments.length == 1) {
        // eslint-disable-next-line no-console
        console.warn(
          "Using a component in findComponent is deprecated. " +
          "Pass name and props as separate arguments instead"
        );
        var search = type;
        type = getComponentName(search.type) || search.type;
        props = search.props;
      }
      props = props || {};
      return findNode(getCurrentNode(), function(node) {
        return matchComponentType(type, node) &&
          subset(node.props, props);
      });
    },
    getRenderOutput: function() {
      return getCurrentNode();
    },
    toString: function() {
      return renderToStaticMarkup(getCurrentNode());
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

function matchComponentType(type, node) {
  if (!type || !node) return false;
  if (!node.type) return false;
  if (typeof node.type === 'string') return node.type == type;
  return getComponentName(node.type) == type;
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

function createFinder(selector, predicate, isLike) {
  var nodeMatcher = createNodePredicate(selector);
  var otherMatcher = alwaysTrue;
  if (typeof predicate === 'object') {
    // predicate is a props object to match
    otherMatcher = function(node) {
      return isLike
        ? subset(node.props, predicate)
        : subset(node.props, predicate) && subset(predicate, node.props);
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
  var all = findNodes(node, predicate, 'one');
  return all.length >= 1 && all[0];
}

function findNodes(node, predicate, findOne) {
  // Falsy stuff can't match or have children
  if (!node) return [];

  // Array nodes all get checked
  if (typeof node.filter === 'function') {
    return mapcat(node, function(n) {
      return findNodes(n, predicate, findOne);
    });
  }

  // normal nodes might match
  var found = [];
  if (predicate(node)) {
    found.push(node);
    if (findOne) return found;
  }

  // matching node might have matching children
  if (node.props && node.props.children) {
    var children = childrenArray(node.props.children);
    return found.concat(findNodes(children, predicate, findOne));
  }

  return found;
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
    return '<' + getComponentName(node.type) + ' />';
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

function mapcat(array, fn) {
  var result = [];
  array.forEach(function(x, i) {
    result.push.apply(result, fn(x, i));
  });
  return result;
}

function constantly(x) {
  return function() {
    return x;
  };
}

function alwaysTrue() {
  return true;
}
