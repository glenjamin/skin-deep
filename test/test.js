var chai = require('chai');
var expect = chai.expect;

var React = require('react');

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  it("should render a ReactElement", function() {
    var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
    var vdom = tree.getRenderOutput();
    expect(vdom).to.have.property('type', 'h1');
    expect(vdom.props).to.have.property('title', 'blah');
    expect(vdom.props).to.have.property('children', 'Heading!');
  });

  it("should render a React Component", function() {
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

  it("should render function returning a ReactElement tree", function() {
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

  describe("findNode", function() {
    var tree = sd.shallowRender(
      $('div', {},
        $('div', {}, 'objection!'),
        $('div', {id: "def"}, "DEF"),
        $('div', {}, [
          $('div', {}, "objection!"),
          $('object', {}, "objection!"),
          'hello',
          [$('div', {className: "abc"}, "ABC")]
        ])
      )
    );

    it("should find a node in tree by className", function() {
      var abc = tree.findNode(".abc");
      expect(abc).to.have.property('type', 'div');
      expect(abc.props).to.have.property('children', 'ABC');
    });

    it("should find a node in tree by id", function() {
      var abc = tree.findNode("#def");
      expect(abc).to.have.property('type', 'div');
      expect(abc.props).to.have.property('children', 'DEF');
    });

    it("should find a node in tree by tagname", function() {
      var abc = tree.findNode("object");
      expect(abc).to.have.property('type', 'object');
      expect(abc.props).to.have.property('children', 'objection!');
    });

    it("should return false when node not found", function() {
      expect(tree.findNode(".def")).to.eql(false);
      expect(tree.findNode("#abc")).to.eql(false);
    });

    it("should throw on invalid selector", function() {
      expect(function() {
        tree.findNode(";huh?");
      }).to.throw(/invalid/i);
    });
  });

  describe("textIn", function() {
    var tree = sd.shallowRender(
      $('div', {},
        $('div', {className: "abc"}, "ABC"),
        $('div', {id: "def"}, "DEF"),
        $('object', {}, "objection!")
      )
    );
    it("should grab text in selector", function() {
      expect(tree.textIn(".abc")).to.eql("ABC");
      expect(tree.textIn("#def")).to.eql("DEF");
      expect(tree.textIn("object")).to.eql("objection!");
    });
  });

  describe("fillField", function() {
    var tree;
    var Component = React.createClass({
      getInitialState: function() {
        return { "username": "" };
      },
      getNickname: function() {
        return React.findDOMNode(this.refs.nickname).value;
      },
      render: function() {
        return $('form', {},
          $('input', {
            type: "text", id: "username",
            value: this.state.username, onChange: function(event) {
              this.setState({"username": event.target.value});
            }.bind(this)
          }),
          $('input', {
            type: "text", ref: "nickname", className: "nickname"
          })
        );
      }
    });
    beforeEach(function() {
      tree = sd.shallowRender($(Component));
    });

    it("should set value of controlled text field", function() {
      expect(tree.findNode("#username").props)
        .to.have.property("value", "");

      tree.fillField("#username", "glenjamin");

      expect(tree.findNode("#username").props)
        .to.have.property("value", "glenjamin");
    });

    it.skip("should set value of uncontrolled text field", function() {
      // Can this be done?
    });

    it("should throw if field not found", function() {
      expect(function() {
        tree.fillField("#losername", "not-glenjamin");
      }).to.throw(/unknown/i);
    });
  });

  describe("toString", function() {
    it("should give HTML", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      expect('' + tree).to.eql('<h1 title="blah">Heading!</h1>');
    });
  });

  describe("text", function() {
    it("should out a textual representation of the tree", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, [
        "Heading!", $('div', { title: "blah" }, [
          React.createClass({
            displayName: 'Widget',
            render: function() { return 'Should not see'; }
          }),
          'Some text.',
          'More text.'
        ])
      ]));
      expect(tree.text()).to.eql('Heading! <Widget /> Some text. More text.');
    });
  });
});
