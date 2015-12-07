var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');

if (React013) {
  console.warn = function(msg) {
    throw new Error(msg);
  }
} else {
  console.error = function(msg) {
    throw new Error(msg);
  }
}

// var createFragment;
// if (React013) {
//   createFragment = require('react/addons').addons.createFragment;
// } else {
//   createFragment = require('react-addons-create-fragment');
// }

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  describe('shallowRender + getRenderOutput()', function() {
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

  describe('reRender', function() {
    var tree;
    var Component = React.createClass({
      render: function() {
        return $(this.props.tag || 'h1', {}, this.props.thing);
      }
    });
    beforeEach(function() {
      tree = sd.shallowRender($(Component, { thing: 'A' }));
    });
    it('should reRender with new type', function() {
      expect(tree.type).to.equal('h1');
      tree.reRender($(Component, { tag: 'h6' }));
      expect(tree.type).to.equal('h6');
    });
    it('should reRender with new props', function() {
      expect(tree.props).to.eql({ children: 'A' });
      tree.reRender($(Component, { thing: 'B' }));
      expect(tree.props).to.eql({ children: 'B' });
    });
    context('entirely different component', function() {
      var Component2 = React.createClass({
        render: function() { return $('h1', {}, 'A'); }
      });
      it('should throw an error', function() {
        expect(function() {
          tree.reRender($(Component2, {}));
        }).to.throw(Error, /different/);
      });
    });
    context('multiple re-renders', function() {
      it('should overwrite multiple times')
      it('should still error if using a different component');
    });
    context('with context', function() {
      var ContextComponent = React.createClass({
        contextTypes: { beep: React.PropTypes.bool },
        render: function() {
          return $('h1', {}, this.props.thing, this.context.beep);
        }
      });
      it('should keep previous context')
      it('should allow replacing context')
    });
  });

});

function isTree(obj) {
  expect(obj).to.contain.all.keys(['reRender', 'type', 'props']);
  return true;
}
