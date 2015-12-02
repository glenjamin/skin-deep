var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');

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

});

function isTree(obj) {
  expect(obj).to.contain.all.keys(['reRender', 'type', 'props']);
  return true;
}
