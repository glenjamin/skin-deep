var chai = require('chai');
var expect = chai.expect;

var React = require('react');

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {
  it("should render ReactElements", function() {
    var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });
  it("should render React Component", function() {
    var Component = React.createClass({
      render: function() {
        return $('h1', { title: "blah" }, "Heading!");
      }
    });
    var tree = sd.shallowRender($(Component));
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });
  it("should render function returning ReactElements", function() {
    var tree = sd.shallowRender(function() {
      return $('h1', { title: "blah" }, "Heading!");
    });
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });
  it("should render function building a component", function() {
    var Component = React.createClass({
      render: function() {
        return $('h1', { title: "blah" }, "Heading!");
      }
    });
    var tree = sd.shallowRender(function() {
      return $(Component);
    });
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });
  it("should render components with context using function", function() {
    var Component = React.createClass({
      contextTypes: { title: React.PropTypes.string },
      render: function() {
        return $('h1', { title: "blah" }, this.context.title);
      }
    });
    var tree = sd.shallowRender(function() {
      return $(Component);
    }, { title: "Heading!" });
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });
});
