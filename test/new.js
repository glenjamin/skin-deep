var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');


/* eslint-disable no-console */
var consoleWarn = console.warn, consoleError = console.error;
function throwError(msg) {
  throw new Error(msg);
}
function hardFailConsole() {
  console[React013 ? 'warn' : 'error'] = throwError;
}
function resetConsole() {
  console.warn = consoleWarn;
  console.error = consoleError;
}
/* eslint-enable no-console */


// var createFragment;
// if (React013) {
//   createFragment = require('react/addons').addons.createFragment;
// } else {
//   createFragment = require('react-addons-create-fragment');
// }

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  beforeEach(hardFailConsole);
  beforeEach(resetConsole);

  describe('rendering', function() {
    var Component = React.createClass({
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
      if (React013) {
        it("doesn't apply");
        return;
      }

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

    context('function returning primitive ReactElement', function() {
      var tree = sd.shallowRender(
        function() { return $('h1', { title: "blah" }, "Heading!"); }
      );
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

    context('function returning component ReactElement', function() {
      var tree = sd.shallowRender(
        function() { return $(Component); }
      );
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

      var ContextComponent = React.createClass({
        contextTypes: { title: React.PropTypes.string },
        render: function() {
          return $('h1', { title: "blah" }, this.context.title);
        }
      });

      context('wrapped in function (for 0.13)', function() {
        var tree = sd.shallowRender(
          function() { return $(ContextComponent); },
          { title: "Heading!" }
        );
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

      context('with parent context (0.14+ only)', function() {
        if (React013) {
          it("doesn't apply");
          return;
        }

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
  });


  describe('.type', function() {
    var Component = React.createClass({
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
    var Component = React.createClass({
      render: function() {
        return $('h1', { blah: 1234, and: this.props.woo }, "Hello");
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
          blah: 1234, and: 'hoo', children: "Hello"
        });
      });
      it('should access more props', function() {
        var tree = sd.shallowRender($(Component, { woo: 'girl' }));
        expect(tree.props).to.eql({
          blah: 1234, and: 'girl', children: "Hello"
        });
      });
    });
  });

  describe('reRender()', function() {
    var tree;
    var Component = React.createClass({
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
      var ContextComponent = React.createClass({
        contextTypes: { beep: React.PropTypes.bool },
        render: function() {
          return $('h1', {}, this.props.thing, this.context.beep);
        }
      });
      beforeEach(function() {
        tree = sd.shallowRender(
          function() { return $(ContextComponent, { thing: 'A' }); },
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
    var Widget = React.createClass({
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
    var Child = React.createClass({
      displayName: 'Child',
      render: function() {
        return $('p', {}, this.props.children);
      }
    });
    var Component = React.createClass({
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

});

function isTree(obj) {
  expect(obj).to.contain.all.keys(['reRender', 'type', 'props', 'text']);
  expect(obj.props).to.be.an('object');
  return true;
}
