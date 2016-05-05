var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var React013 = (React.version.substring(0, 4) == '0.13');

var createFragment;
if (React013) {
  createFragment = require('react/addons').addons.createFragment;
} else {
  createFragment = require('react-addons-create-fragment');
}

var $ = React.createElement;

var traversal = require('../lib/traversal');

function constantly(x) {
  return function() {
    return x;
  };
}
function typeMatches(type) {
  return function(node) {
    return node && node.type == type;
  };
}

describe('traversal', function() {
  describe('simple tree', function() {

    var tree = $('div', {},
      $('ul', { id: "123" },
        $('li', {}, 'One'),
        $('li', null, 'Two'),
        '  ',
        $('li', {}, 'Three'),
        $('li', {},
          $('p', {}, 'A', $('b', null, 'c'))
        )
      )
    );
    var treeSize = 14;

    it('should collect nodes passing the predicate', function() {
      var nodes = traversal.collect(tree, typeMatches('li'));

      expect(nodes).to.be.an('array');
      expect(nodes).to.have.length(4);
      nodes.forEach(function(node) {
        expect(node).to.have.property('type', 'li');
      });
      expect(nodes[0]).to.equal(tree.props.children.props.children[0]);
      expect(nodes[1]).to.equal(tree.props.children.props.children[1]);
      expect(nodes[2]).to.equal(tree.props.children.props.children[3]);
      expect(nodes[3]).to.equal(tree.props.children.props.children[4]);
    });
    it('gives empty array with no match', function() {
      var nodes = traversal.collect(tree, constantly(false));

      expect(nodes).to.be.an('array');
      expect(nodes).to.have.length(0);
    });
    it('traverses everything via depth-first', function() {
      var nodes = traversal.collect(tree, constantly(true));

      expect(nodes).to.have.length(treeSize);

      var ul, lastLi, p;
      expect(nodes).to.eql([
        tree,
        (ul = tree.props.children),
        ul.props.children[0],
        ul.props.children[0].props.children,
        ul.props.children[1],
        ul.props.children[1].props.children,
        ul.props.children[2],
        ul.props.children[3],
        ul.props.children[3].props.children,
        (lastLi = ul.props.children[4]),
        (p = lastLi.props.children),
        p.props.children[0],
        p.props.children[1],
        p.props.children[1].props.children
      ]);
    });
  });
  describe('tree with arrays in it', function() {

    var tree = $('div', {},
      $('ul', { id: "123" }, [
        $('li', { key: '1' }, 'One'),
        $('li', { key: '2' }, 'Two'),
      ]),
      $('ul', { id: "123" },
        $('li', { key: '3' }, 'Three'),
        [
          $('li', { key: '4' }, 'Four'),
          $('li', { key: '5' }, 'Five')
        ],
        $('li', { key: '6' }, 'Six')
      )
    );
    var liCount = 6;
    var treeSize = 15;

    it('should collect nodes passing the predicate', function() {
      var nodes = traversal.collect(tree, typeMatches('li'));
      expect(nodes).to.have.length(liCount);
    });
    it('traverses everything depth-first', function() {
      var nodes = traversal.collect(tree, constantly(true));

      expect(nodes).to.have.length(treeSize);

      var ul1, ul2;
      expect(nodes).to.eql([
        tree,
        (ul1 = tree.props.children[0]),
        ul1.props.children[0],
        ul1.props.children[0].props.children,
        ul1.props.children[1],
        ul1.props.children[1].props.children,
        (ul2 = tree.props.children[1]),
        ul2.props.children[0],
        ul2.props.children[0].props.children,
        ul2.props.children[1][0],
        ul2.props.children[1][0].props.children,
        ul2.props.children[1][1],
        ul2.props.children[1][1].props.children,
        ul2.props.children[2],
        ul2.props.children[2].props.children,
      ]);
    });
  });
  describe('tree with conditionals in it', function() {

    var tree = $('div', {},
      true,
      false,
      0,
      "",
      undefined,
      null,
      1,
      "abc"
    );

    it('should skip true', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.not.include(true);
    });
    it('should skip false', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.not.include(false);
    });
    it('should include 0', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.include(0);
    });
    it('should include ""', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.include("");
    });
    it('should skip undefined', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.not.include(undefined);
    });
    it('should skip null', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.not.include(null);
    });
    it('should include 1', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.include(1);
    });
    it('should include "abc"', function() {
      expect(traversal.collect(tree, constantly(true)))
        .to.include("abc");
    });
  });
  describe('tree with fragments', function() {
    var tree = $('div', {},
      'abc',
      createFragment({
        left: $('span', { id: 'left' }, 'left'),
        right: $('span', { id: 'right' }, 'right')
      })
    );
    var treeSize = 6;

    it('should collect nodes passing the predicate', function() {
      var nodes = traversal.collect(tree, typeMatches('span'));
      expect(nodes).to.have.length(2);
    });
    it('traverses everything depth-first', function() {
      var nodes = traversal.collect(tree, constantly(true));

      expect(nodes).to.have.length(treeSize);
      expect(nodes).to.eql([
        tree,
        'abc',
        tree.props.children[1][0],
        'left',
        tree.props.children[1][1],
        'right'
      ]);
    });
  });
  describe('tree with components', function() {
    function Component(props) {
      return $('p', {}, props.thing);
    }
    var tree = $('div', {},
      $('ul', { id: "123" },
        $('li', {}, 'One'),
        $('li', null, 'Two'),
        '  ',
        $('li', {}, 'Three'),
        $(Component, {},
          $('p', {}, 'A', $('b', null, 'c'))
        )
      )
    );

    it('can treat components as black boxes', function() {
      var nodes = traversal.collect(tree, constantly(true), {
        blackboxComponents: true
      });

      var nodesOutsideBlackbox = 10;
      expect(nodes).to.have.length(nodesOutsideBlackbox);

      var ul;
      expect(nodes).to.eql([
        tree,
        (ul = tree.props.children),
        ul.props.children[0],
        ul.props.children[0].props.children,
        ul.props.children[1],
        ul.props.children[1].props.children,
        ul.props.children[2],
        ul.props.children[3],
        ul.props.children[3].props.children,
        ul.props.children[4]
      ]);
      expect(ul.props.children[4]).to.have.property('type', Component);
    });

  });
});
