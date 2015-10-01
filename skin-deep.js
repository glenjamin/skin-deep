var subset = require('is-subset');

var React = require('react');
var versionNumber = Number(React.version.substring(0, 4));
var TestUtils;
if (versionNumber >= 0.13) {
 TestUtils = require('react/addons').addons.TestUtils;
} else {
 TestUtils = require('react-addons-test-utils');
}

function renderToStaticMarkup(element) {
  if (versionNumber >= 0.13) {
    return React.renderToStaticMarkup(element);
  }

  return require("react-dom/server").renderToStaticMarkup(element);
}

function withContext(context, fn) {
  if (versionNumber < 0.13) return fn();

  var ReactContext;
  if (versionNumber === 0.13) {
    ReactContext = require('react/lib/ReactContext');
  } else {
    ReactContext = require('react');
  }
  ReactContext.current = context;
  var result = fn();
  ReactContext.current = {};
  return result;
}

exports.shallowRender = shallowRender;
function shallowRender(elementOrFunction, context) {
  context = context || {};

  var shallowRenderer = TestUtils.createRenderer();

  var element = withContext(context, function() {
    return TestUtils.isElement(elementOrFunction) ?
      elementOrFunction : elementOrFunction();
  });

  if (typeof element.type == 'string') {
    return new SkinDeep(function() { return element; });
  }

  shallowRenderer.render(element, context);

  return new SkinDeep(
    function() {
      return shallowRenderer.getRenderOutput();
    },
    /*eslint-disable no-underscore-dangle */
    shallowRenderer._instance._instance
    /*eslint-enable no-underscore-dangle */
  );
}

function SkinDeep(getCurrentNode, instance) {
  return {
    getMountedInstance: function() {
      if (instance) return instance;
      throw new Error('This tree has no mounted instance');
    },
    subTree: function(query) {
      var node = findNodeIn(getCurrentNode(), query);
      return skinDeepNode(node);
    },
    everySubTree: function(query) {
      var predicate = createNodePredicate(query);
      return findNodes(getCurrentNode(), predicate).map(skinDeepNode);
    },
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
    findComponent: function(type, props) {
      if (arguments.length === 1) {
        console.warn(
          "Using a component in findComponent is deprecated. " +
          "Pass name and props as separate arguments instead"
        );
        var search = type;
        type = getComponentName(search.type) || search.type;
        props = search.props;
      }
      return findNode(getCurrentNode(), function(node) {
        return matchComponentType(type, node) &&
          subset(node.props, props) &&
          subset(props, node.props);
      });
    },
    findComponentLike: function(type, props) {
      if (arguments.length === 1) {
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
    findComponentWithoutChildren: function(type, props) {
      if (arguments.length === 1) {
        console.warn(
          "Using a component in findComponent is deprecated. " +
          "Pass name and props as separate arguments instead"
        );
        var search = type;
        type = getComponentName(search.type) || search.type;
        props = search.props;
      }
      return this.findComponentsWithoutChildren(type,props)[0] || false;
    },

    findComponentsWithoutChildren: function(type, props) {
      if (arguments.length === 1) {
        console.warn(
          "Using a component in findComponent is deprecated. " +
          "Pass name and props as separate arguments instead"
        );
        var search = type;
        type = getComponentName(search.type) || search.type;
        props = search.props;
      }
      return findNodes(getCurrentNode(), function(node) {
        if (node && node.props && props) {

          var props1 = clone(node.props);
          var props2 = clone(props);
          delete props1['children'];
          delete props2['children'];

          return matchComponentType(type, node) &&
            subset(props1, props2) &&
            subset(props2, props1);
        } else{
          return matchComponentType(type, node) &&
            subset(node.props, props) &&
            subset(props, node.props);
        }
      }, false);
    },
    getRenderOutput: function() {
      return getCurrentNode();
    },
    toString: function() {
      return renderToStaticMarkup(getCurrentNode());
    }
  };
}

function skinDeepNode(node) {
  return new SkinDeep(function() { return node; });
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
  if (query.match(/^\.[\w\-]+$/)) {
    return findNodeByClass(query.substring(1));
  }
  if (query.match(/^\#[\w\-]+$/)) {
    return findNodeById(query.substring(1));
  }
  if (query.match(/^[a-z][\w\-]*$/)) { // tagname
    return function(n) { return n.type == query; };
  }
  if (query.match(/^[A-Z][\w\-]*$/)) { // component displayName
    return function(n) { return n.type && getComponentName(n.type) == query; };
  }
  throw new Error('Invalid node query ' + query);
}

function findNodeIn(node, query) {
  return findNode(node, createNodePredicate(query));
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
    return '' + node;
  }
  // Iterables get combined with spaces
  if (typeof node.map === 'function') {
    return node.map(getTextFromNode).join(' ').replace(/\s+/, ' ');
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

function mapcat(array, fn) {
  var result = [];
  array.forEach(function(x, i) {
    result.push.apply(result, fn(x, i));
  });
  return result;
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}
