var React = require('react');

var Versions = require('../lib/versions');

var PropTypes;
var createClass;
if (Versions.React155) {
  PropTypes = require('prop-types');
  createClass = require('create-react-class');
} else {
  PropTypes = React.PropTypes;
  createClass = React.createClass;
}
exports.PropTypes = PropTypes;
exports.createClass = createClass;
