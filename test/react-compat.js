var React = require('react');

var Versions = require('../lib/versions');

var PropTypes;
var createClass;
if (Versions.ReactBefore155) {
  PropTypes = React.PropTypes;
  createClass = React.createClass;
} else {
  PropTypes = require('prop-types');
  createClass = require('create-react-class');
}
exports.PropTypes = PropTypes;
exports.createClass = createClass;
