var React = require('react');

exports.collect = function collect(node, predicate, options) {
  options = options || {};
  var blackboxComponents = Boolean(options.blackboxComponents);
  var found = [];

  if (node === false || node == undefined || node === null) {
    return found;
  }

  if (predicate(node)) {
    found.push(node);
  }

  if (node.props && !shouldBlackbox(node, blackboxComponents)) {
    var children = childrenArray(node.props);
    var recursed = children.map(function(child) {
      return collect(child, predicate, options);
    });
    found = [].concat.apply(found, recursed);
  }

  return found;
};

function shouldBlackbox(node, flag) {
  if (!flag) return false;
  return typeof node.type === 'function';
}

function childrenArray(props) {
  var array = [];
  React.Children.forEach(props.children, function(child) {
    array.push(child);
  });
  return array;
}
