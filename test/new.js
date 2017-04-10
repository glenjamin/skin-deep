var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var ReactCompat = require('./react-compat');
var PropTypes = ReactCompat.PropTypes;
var createClass = ReactCompat.createClass;

/* eslint-disable no-console */
var consoleError = console.error;
function throwError(msg) {
  throw new Error(msg);
}
function hardFailConsole() {
  console.error = throwError;
}
function resetConsole() {
  console.error = consoleError;
}
/* eslint-enable no-console */


var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  beforeEach(hardFailConsole);
  afterEach(resetConsole);

  describe('rendering', function() {
    var Component = createClass({
      render: function() {
        return $('h1', { title: "blah" }, "Heading!");
      }
    });

    context('primitive ReactElement', function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      var output = tree.getRenderOutput();

      it('should return a tree', function() {
        expect(tree).to.satisfy(isTree);
      });
      it('should have type in rendered output', function() {
        expect(output).to.have.property('type', 'h1');
      });
      it('should have props in rendered output', function() {
        expect(output).to.have.property('props');
        expect(output.props).to.eql({ title: "blah", children: "Heading!" });
      });
    });

    context('component ReactElement', function() {
      var tree = sd.shallowRender($(Component));
      var output = tree.getRenderOutput();

      it('should return a tree', function() {
        expect(tree).to.satisfy(isTree);
      });
      it('should have type in rendered output', function() {
        expect(output).to.have.property('type', 'h1');
      });
      it('should have props in rendered output', function() {
        expect(output).to.have.property('props');
        expect(output.props).to.eql({ title: "blah", children: "Heading!" });
      });
    });

    context('stateless component function ReactElement', function() {
      function PureComponent(props) {
        return $('h1', { title: 'blah' }, props.thing);
      }
      var tree = sd.shallowRender($(PureComponent, { thing: 'Heading!' }));
      var output = tree.getRenderOutput();

      it('should return a tree', function() {
        expect(tree).to.satisfy(isTree);
      });
      it('should have type in rendered output', function() {
        expect(output).to.have.property('type', 'h1');
      });
      it('should have props in rendered output', function() {
        expect(output).to.have.property('props');
        expect(output.props).to.eql({ title: "blah", children: "Heading!" });
      });
    });

    context('with context', function() {

      var ContextComponent = createClass({
        contextTypes: { title: PropTypes.string },
        render: function() {
          return $('h1', { title: "blah" }, this.context.title);
        }
      });
      var tree = sd.shallowRender($(ContextComponent), { title: "Heading!" });
      var output = tree.getRenderOutput();

      it('should return a tree', function() {
        expect(tree).to.satisfy(isTree);
      });
      it('should have type in rendered output', function() {
        expect(output).to.have.property('type', 'h1');
      });
      it('should have props in rendered output', function() {
        expect(output).to.have.property('props');
        expect(output.props).to.eql({ title: "blah", children: "Heading!" });
      });

    });
  });


  describe('.type', function() {
    var Component = createClass({
      render: function() {
        return $('h1', {}, "Hello");
      }
    });
    it('should access type for primitive ReactElement', function() {
      var tree = sd.shallowRender($('h1', {}));
      expect(tree.type).to.equal('h1');
    });
    it('should access type for another primitive ReactElement', function() {
      var tree = sd.shallowRender($('div', {}));
      expect(tree.type).to.equal('div');
    });
    it('should access type for Component ReactElement', function() {
      var tree = sd.shallowRender($(Component, {}));
      expect(tree.type).to.equal('h1');
    });
  });

  describe('.props', function() {
    var Component = createClass({
      render: function() {
        return $('h1', { tabIndex: 1234, title: this.props.woo }, "Hello");
      }
    });
    context('on primitive ReactElement', function() {
      it('should access props', function() {
        var tree = sd.shallowRender($('h1', { a: 'b', c: 12 }));
        expect(tree.props).to.eql({ a: 'b', c: 12 });
      });
      it('should access other props', function() {
        var tree = sd.shallowRender($('h1', { a: 'b', d: 78 }));
        expect(tree.props).to.eql({ a: 'b', d: 78 });
      });
    });
    context('on rendered Component ReactElement', function() {
      it('should access props', function() {
        var tree = sd.shallowRender($(Component, { woo: 'hoo' }));
        expect(tree.props).to.eql({
          tabIndex: 1234, title: 'hoo', children: "Hello"
        });
      });
      it('should access more props', function() {
        var tree = sd.shallowRender($(Component, { woo: 'girl' }));
        expect(tree.props).to.eql({
          tabIndex: 1234, title: 'girl', children: "Hello"
        });
      });
    });
  });

  describe('reRender()', function() {
    var tree;
    var Component = createClass({
      render: function() {
        return $(this.props.tag || 'h1', {}, this.props.thing);
      }
    });
    beforeEach(function() {
      tree = sd.shallowRender($(Component, { thing: 'A' }));
    });
    it('should reRender with new props', function() {
      expect(tree.props).to.eql({ children: 'A' });
      tree.reRender({ thing: 'B' });
      expect(tree.props).to.eql({ children: 'B' });
    });
    it('should reRender with new and different props', function() {
      expect(tree.type).to.equal('h1');
      expect(tree.props).to.eql({ children: 'A' });
      tree.reRender({ tag: 'h6', thing: 'B' });
      expect(tree.type).to.equal('h6');
      expect(tree.props).to.eql({ children: 'B' });
    });

    context('multiple re-renders', function() {
      it('should overwrite multiple times', function() {
        expect(tree.props).to.eql({ children: 'A' });
        tree.reRender({ thing: 'X' });
        expect(tree.props).to.eql({ children: 'X' });
        tree.reRender({ thing: 123 });
        expect(tree.props).to.eql({ children: 123 });
        tree.reRender({ thing: false });
        expect(tree.props).to.eql({ children: false });
      });
    });
    context('with context', function() {
      var ContextComponent = createClass({
        contextTypes: { beep: PropTypes.bool },
        render: function() {
          return $('h1', {}, this.props.thing, this.context.beep);
        }
      });
      beforeEach(function() {
        tree = sd.shallowRender(
          $(ContextComponent, { thing: 'A' }),
          { beep: false }
        );
      });
      it('should keep previous context', function() {
        expect(tree.props).to.eql({ children: ['A', false] });
        tree.reRender({ thing: 'X' });
        expect(tree.props).to.eql({ children: ['X', false] });
      });
      it('should allow replacing context', function() {
        expect(tree.props).to.eql({ children: ['A', false] });
        tree.reRender({ thing: 'X' }, { beep: true });
        expect(tree.props).to.eql({ children: ['X', true] });
      });
    });
  });

  describe('text()', function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() {
        return $('hr', {});
      }
    });
    it('should read primitive ReactElement', function() {
      var tree = sd.shallowRender($('h1', { not: 'this' }, 'Textually'));
      expect(tree.text()).to.eql('Textually');
    });
    it('should read ReactElement and children', function() {
      var tree = sd.shallowRender(
        $('ul', { not: 'this' },
          $('li', { nor: 'this' }, 'One'), ' ',
          $('li', { nor: 'this' }, 'Two'), ' ',
          $('li', { nor: 'this either' }, 'Three')
        )
      );
      expect(tree.text()).to.eql('One Two Three');
    });
    it('should collapse multiple spaces', function() {
      var tree = sd.shallowRender(
        $('div', {},
          $('p', {}, 'A  B  C'),
          '\n',
          '  ',
          $('p', {}, '  blah'))
      );
      expect(tree.text()).to.eql('A B C blah');
    });
    it('should not traverse inside children ReactElements', function() {
      var tree = sd.shallowRender(
        $('p', { attr: 'not this' },
          $('strong', {}, 'include this bit'),
          $(Widget, {}),
          $(Widget, {}, 'but not this'))
      );
      expect(tree.text()).to.eql('include this bit<Widget /><Widget />');
    });
  });

  describe("toString", function() {
    var Child = createClass({
      displayName: 'Child',
      render: function() {
        return $('p', {}, this.props.children);
      }
    });
    var Component = createClass({
      render: function() {
        return $('h1', { title: "blah" }, $(Child, { x: "y" }));
      }
    });
    it("should give HTML-like output", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      expect(String(tree)).to.eql('<h1 title="blah">\n  Heading!\n</h1>');
    });
    it("should not expand child components", function() {
      var tree = sd.shallowRender($(Component));
      expect(String(tree))
        .to.eql('<h1 title="blah">\n  <Child x="y" />\n</h1>');
    });
  });

  describe("hasClass", function() {
    it("should match whole class", function() {
      expect(sd.hasClass($('div', { className: "abc" }), "abc"))
        .to.eql(true);
    });
    it("should identify wrong whole class", function() {
      expect(sd.hasClass($('div', { className: "abc" }), "def"))
        .to.eql(false);
    });
    it("should match classes with dashes", function() {
      expect(sd.hasClass($('div', { className: "abc-123" }), "abc-123"))
        .to.eql(true);
    });
    it("should identify wrong class with dashes", function() {
      expect(sd.hasClass($('div', { className: "abc-23" }), "abc-234"))
        .to.eql(false);
    });
    it("should match one of multiple classes", function() {
      var node = $('div', { className: "space-after abc-123 space-before" });
      expect(sd.hasClass(node, "space-before")).to.eql(true);
      expect(sd.hasClass(node, "abc-123")).to.eql(true);
      expect(sd.hasClass(node, "space-after")).to.eql(true);
    });
    it("should match wrong in multiple classes", function() {
      var node = $('div', { className: "space-after abc-123 space-before" });
      expect(sd.hasClass(node, "space")).to.eql(false);
      expect(sd.hasClass(node, "abc")).to.eql(false);
      expect(sd.hasClass(node, "after")).to.eql(false);
      expect(sd.hasClass(node, "before")).to.eql(false);
    });
    it("should match classes with non-regex-safe characters", function() {
      expect(sd.hasClass($('div', { className: "???" }), "???"))
        .to.eql(true);
    });
  });

});

function isTree(obj) {
  expect(obj).to.contain.all.keys(['reRender', 'type', 'props', 'text']);
  expect(obj.props).to.be.an('object');
  return true;
}
