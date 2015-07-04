var subset = require('is-subset');

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
    findComponent: function(search) {
      return findNode(getCurrentNode(), function(node) {
        return node.type == search.type &&
          subset(node.props, search.props) &&
          subset(search.props, node.props);
      });
    },
    findComponentLike: function(search) {
      return findNode(getCurrentNode(), function(node) {
        return node.type == search.type &&
          subset(node.props, search.props);
      });
    },
    getRenderOutput: function() {
      return getCurrentNode();
    },
    toString: function() {
      return React.renderToStaticMarkup(getCurrentNode());
    }
  };
}

function skinDeepNode(node) {
  return new SkinDeep(function() { return node; });
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
    return function(n) { return n.type && n.type.displayName == query; };
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

function findNodes(node, fn, findOne) {
  // Falsy stuff can't match or have children
  if (!node) return [];

  // Array nodes all get checked
  if (typeof node.filter === 'function') {
    return mapcat(node, function(n) {
      return findNodes(n, fn, findOne);
    });
  }

  // normal nodes might match
  var found = [];
  if (fn(node)) {
    found.push(node);
    if (findOne) return found;
  }

  // matching node might have matching children
  if (node.props && node.props.children) {
    return found.concat(findNodes(node.props.children, fn, findOne));
  }

  return found;
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

function mapcat(array, fn) {
  var result = [];
  array.forEach(function(x, i) {
    result.push.apply(result, fn(x, i));
  });
  return result;
}
