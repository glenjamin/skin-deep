var React = require('react');

exports.collect = function collect(node, predicate) {
  var found = [];

  if (node === false || node == undefined || node === null) {
    return found;
  }

  if (predicate(node)) {
    found.push(node);
  }

  if (node.props) {
    var children = childrenArray(node.props);
    var recursed = children.map(function(child) {
      return collect(child, predicate);
    });
    found = [].concat.apply(found, recursed);
  }

  return found;
};

function childrenArray(props) {
  var array = [];
  React.Children.forEach(props.children, function(child) {
    array.push(child);
  });
  return array;
}
