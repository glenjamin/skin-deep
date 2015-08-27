var chai = require('chai');
var expect = chai.expect;

var React = require('react/addons');

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  describe("getRenderOutput", function() {

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
  });

  describe("getMountedInstance", function() {

    it("should provide the React Component instance", function() {
      var Component = React.createClass({
        render: function() {
          return $('h1', { title: "blah" }, "Heading!");
        },
        aMethod: function() {}
      });
      var tree = sd.shallowRender($(Component));
      var instance = tree.getMountedInstance();

      expect(instance.aMethod).to.be.a('function');
    });

  });

  describe("findNode", function() {
    var Widget = React.createClass({
      displayName: 'Widget',
      render: function() { return 'widget'; }
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('div', {}, 'objection!'),
        $('div', {id: "def"}, "DEF"),
        $('div', {},
          $('div', {}, "objection!"),
          $('object', {}, "objection!"),
          'hello',
          [$('div', {className: "abc", key: "1"}, "ABC")],
          $(Widget, {})
        )
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

    it("should find a node in tree by component displayName", function() {
      var abc = tree.findNode("Widget");
      expect(abc).to.have.property('type', Widget);
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

    describe("conditionals", function() {
      before(function() {
        tree = sd.shallowRender(
          $('div', {},
            true && $('a', {}, 'A'),
            false && $('b', {}, 'B'),
            0 && $('c', {}, 'C'),
            "" && $('d', {}, 'D'),
            undefined && $('e', {}, 'E'),
            null && $('f', {}, 'F'),
            1 && $('g', {}, 'G'),
            "abc" && $('h', {}, 'H')
          )
        );
      });

      it("should find true && item", function() {
        expect(tree.findNode('a')).to.have.property('type', 'a');
      });
      it("should not find false && item", function() {
        expect(tree.findNode('b')).to.eql(false);
      });
      it("should not find 0 && item", function() {
        expect(tree.findNode('c')).to.eql(false);
      });
      it("should not find '' && item", function() {
        expect(tree.findNode('d')).to.eql(false);
      });
      it("should not find undefined && item", function() {
        expect(tree.findNode('e')).to.eql(false);
      });
      it("should not find null && item", function() {
        expect(tree.findNode('f')).to.eql(false);
      });
      it("should find 1 && item", function() {
        expect(tree.findNode('g')).to.have.property('type', 'g');
      });
      it("should find 'abc' && item", function() {
        expect(tree.findNode('h')).to.have.property('type', 'h');
      });
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

    it("should no-op on field without change handler", function() {
      var before = tree.findNode(".nickname");

      tree.fillField(".nickname", "glenjamin");

      expect(tree.findNode(".nickname")).to.eql(before);
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
    var Widget = React.createClass({
      displayName: 'Widget',
      render: function() { return 'Should not see'; }
    });
    it("should give a textual representation of the tree", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" },
        "Heading!",
        $('div', { title: "blah" },
          123, $('hr'),
          'Some text.',
          'More text.',
          [ React.createElement(Widget, { key: 1 }),
            React.createElement(Widget, { key: 2 }) ])
      ));
      expect(tree.text())
        .to.eql('Heading! 123 Some text. More text. <Widget /> <Widget />');
    });
    it("Should render a single zero child correctly", function() {
      var tree = sd.shallowRender($('h1', {}, 0));
      expect(tree.text()).to.eql('0');
    });
  });

  describe("subTree", function() {
    var tree = sd.shallowRender(
      $('div', {},
        $('div', {id: "def", className: "abc"},
          "DEF", $('hr')),
        $('div', {id: "abc"},
          $('div', {}, "objection!"),
          $('object', {}, "objection!"),
          'hello',
          [$('div', {id: "abc2", className: "abc", key: "1"}, "ABC")]
        )
      )
    );
    it("should grab a subtree by id selector", function() {
      var abc = tree.subTree("#abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("id", "abc");
    });
    it("should grab a subtree by class selector", function() {
      var abc = tree.subTree(".abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("className", "abc");
    });
    it("should grab a subtree by tag selector", function() {
      var abc = tree.subTree("object");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props)
        .to.have.property("children", "objection!");
    });
    describe("methods", function() {
      var subTree;
      beforeEach(function() {
        subTree = tree.subTree('#abc');
      });
      it("should have same methods as main tree", function() {
        expect(Object.keys(tree)).to.eql(Object.keys(subTree));
      });
      it("should provide scoped findNode()", function() {
        expect(subTree.findNode(".abc")).to.eql(tree.findNode("#abc2"));
      });
      it("should provide scoped textIn()", function() {
        expect(subTree.textIn(".abc")).to.eql("ABC");
      });
      it("should provide scoped text()", function() {
        expect(subTree.text()).to.eql("objection! objection! hello ABC");
      });
    });
  });

  describe("everySubTree", function() {
    var tree, trees;
    before(function() {
      tree = sd.shallowRender(
        $('ul', {},
          $('li', {className: "abc"}, $('span', {}, 1)),
          $('li', {className: "abc"}, $('span', {}, 2)),
          $('li', {className: "abc"}, $('span', {}, 3)),
          $('li', {className: "abc"}, $('span', {}, 4)),
          $('li', {className: "abc"}, $('span', {}, 5))
        )
      );
    });
    describe("using class selector", function() {
      beforeEach(function() {
        trees = tree.everySubTree(".abc");
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(5);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(["1", "2", "3", "4", "5"]);
      });
    });
    describe("using tag selector", function() {
      beforeEach(function() {
        trees = tree.everySubTree("li");
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(5);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(["1", "2", "3", "4", "5"]);
      });
    });
    describe("nested matches", function() {
      before(function() {
        tree = sd.shallowRender(
          $('div', {},
            $('div', {},
              $('div', {},
                $('div', {}, "deep")))
          )
        );
        trees = tree.everySubTree("div");
      });
      it("should find nodes deeply", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(4);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(['deep', 'deep', 'deep', 'deep']);
      });
    });
  });

  describe("findComponent", function() {
    var Widget = React.createClass({
      displayName: 'Widget',
      render: function() {}
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('span', {}, "stuff", "and", "nonsense"),
        $('b', { className: "go"}, "away"),
        $(Widget, {}),
        $(Widget, { some: "value", num: 123 }),
        $(Widget, {}, "kids")
      )
    );
    it("should find a DOM component", function() {
      var c = tree.findComponent($('span', {}, "stuff", "and", "nonsense"));
      expect(c).to.have.property('type', 'span');
      expect(c.props.children).to.eql(["stuff", "and", "nonsense"]);
    });
    it("should find a DOM component with props", function() {
      var c = tree.findComponent($('b', { className: "go" }, "away"));
      expect(c).to.have.property('type', 'b');
      expect(c.props).to.eql({ className: "go", children: "away" });
    });
    it("should find a component", function() {
      var c = tree.findComponent($(Widget, {}));
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({});
    });
    it("should find a component with props", function() {
      var c = tree.findComponent($(Widget, { some: "value", num: 123 }));
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ some: "value", num: 123 });
    });
    it("should find a component with children", function() {
      var c = tree.findComponent($(Widget, {}, "kids"));
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ children: "kids" });
    });
    it("should fail to find a DOM component", function() {
      expect(tree.findComponent($('span', {}, "real", "stuff")))
        .to.eql(false);
    });
    it("should fail to find a component", function() {
      expect(tree.findComponent($(Widget, { "other": "value"})))
        .to.eql(false);
    });
    it("should fail to find a component with children", function() {
      expect(tree.findComponent($(Widget, {}, "adults")))
        .to.eql(false);
    });
  });

  describe("findComponentLike", function() {
    var Widget = React.createClass({
      displayName: 'Widget',
      render: function() {}
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('span', {}, "stuff", "and", "nonsense"),
        $('b', { className: "go"}, "away"),
        $(Widget, {}),
        $(Widget, { some: "value", num: 123 }),
        $(Widget, {}, "kids")
      )
    );
    it("should find a DOM component", function() {
      var c = tree.findComponentLike($('span', {}, "stuff", "and", "nonsense"));
      expect(c).to.have.property('type', 'span');
      expect(c.props).to.eql({ children: ["stuff", "and", "nonsense"]});
    });
    it("should find a DOM component via partial match", function() {
      var c = tree.findComponentLike($('b', { className: "go" }));
      expect(c).to.have.property('type', 'b');
      expect(c.props).to.have.eql({ className: "go", children: "away" });
    });
    it("should find a component", function() {
      var c = tree.findComponentLike($(Widget, {}));
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({});
    });
    it("should find a component with partial props", function() {
      var c = tree.findComponentLike($(Widget, { num: 123 }));
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ some: "value", num: 123 });
    });
    it("should fail to find a DOM component", function() {
      expect(tree.findComponentLike($('span', {}, "real", "stuff")))
        .to.eql(false);
    });
    it("should fail to find a DOM component if doesn't match", function() {
      expect(tree.findComponentLike($('b', { className: "go", id: "away" })))
        .to.eql(false);
    });
    it("should fail to find a component if doesn't match", function() {
      expect(tree.findComponentLike($(Widget, { abc: 123 })))
        .to.eql(false);
    });
    it("should fail to find a component if doesn't match", function() {
      expect(tree.findComponentLike($(Widget, { num: 123, x: "y" })))
        .to.eql(false);
    });
  });

  describe("React.Children & Fragments", function() {
    var WithKids = React.createClass({
      displayName: 'WithKids',
      render: function() {
        return $('ul', {},
          React.Children.map(
            this.props.children,
            function(x) { return x; }
          )
        );
      }
    });
    var tree1 = sd.shallowRender(
      $(WithKids, {},
        $('li', { id: 'a' }, 'a'),
        null,
        false,
        undefined,
        $('li', { id: 'b' }, 'b')
      )
    );
    var tree2 = sd.shallowRender(
      $('div', {},
        React.addons.createFragment({
          left: $('span', { id: 'left' }, 'left'),
          right: $('span', { id: 'right' }, 'right')
        })
      )
    );
    describe('findNode', function() {
      it('should work within Children', function() {
        expect(tree1.findNode('#a')).to.not.eql(false);
        expect(tree1.findNode('#b')).to.not.eql(false);
      });
      it('should work within fragments', function() {
        expect(tree2.findNode('#left')).to.not.eql(false);
        expect(tree2.findNode('#right')).to.not.eql(false);
      });
    });
    describe('text', function() {
      it('should work within Children', function() {
        expect(tree1.text()).to.contain('a b');
      });
      it('should work within fragments', function() {
        expect(tree2.text()).to.contain("left right");
      });
    });
    describe('everySubTree', function() {
      it('should work within Children', function() {
        expect(tree1.everySubTree('li')).to.have.length(2);
      });
      it('should work within fragments', function() {
        expect(tree2.everySubTree('span')).to.have.length(2);
      });
    });
  });
});
