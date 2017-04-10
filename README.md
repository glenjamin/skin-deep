# skin-deep

Testing helpers for use with React's shallowRender test utils.

*********

### Warning

> The branch you are viewing is for a currently unreleased version, the currently released version can be found on the `pre-1.0` branch.

*********

[![npm version](https://img.shields.io/npm/v/skin-deep.svg)](https://www.npmjs.com/package/skin-deep) [![Build Status](https://img.shields.io/travis/glenjamin/skin-deep/master.svg)](https://travis-ci.org/glenjamin/skin-deep) [![Coverage Status](https://coveralls.io/repos/glenjamin/skin-deep/badge.svg?branch=master)](https://coveralls.io/r/glenjamin/skin-deep?branch=master) ![MIT Licensed](https://img.shields.io/npm/l/skin-deep.svg)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [Quick Start](#quick-start)
- [Breaking Changes in 1.0](#breaking-changes-in-10)
- [Usage](#usage)
  - [Rendering](#rendering)
  - [Extracting portions of the result](#extracting-portions-of-the-result)
  - [Triggering events](#triggering-events)
  - [Going deeper](#going-deeper)
  - [Use with test frameworks](#use-with-test-frameworks)
- [API Docs](#api-docs)
  - [.shallowRender(element [, context])](#shallowrenderelement--context)
  - [tree](#tree)
    - [tree.type](#treetype)
    - [tree.props](#treeprops)
    - [tree.reRender(props [, context])](#treererenderprops--context)
    - [tree.text()](#treetext)
    - [tree.toString()](#treetostring)
    - [tree.getRenderOutput()](#treegetrenderoutput)
    - [tree.getMountedInstance()](#treegetmountedinstance)
    - [tree.subTree(selector [, matcher])](#treesubtreeselector--matcher)
    - [tree.everySubTree(selector [, matcher])](#treeeverysubtreeselector--matcher)
    - [tree.dive(path)](#treedivepath)
  - [Using Selectors](#using-selectors)
  - [Using Matchers](#using-matchers)
  - [.exact(props)](#exactprops)
  - [.any](#any)
  - [.hasClass(node, className)](#hasclassnode-classname)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

```sh
npm install skin-deep
```

This lib should work on any version of React since 0.14. To allow for greater flexibility by users, no `peerDependencies` are included in the `package.json`. Your dependencies need to be as follows:

For React < 15.5:
 * `react`
 * `react-addons-test-utils`


For React >= 15.5:
 * `react`
 * `react-dom`
 * `react-test-renderer`

## Quick Start

```jsx
var React = require('react');

var MyComponent = React.createClass({
  displayName: 'MyComponent',
  render: function() {
    return (
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/abc">Draw</a></li>
        <li><a href="/def">Away</a></li>
      </ul>
    )
  }
});

var assert = require('assert');
var sd = require('skin-deep');

var tree = sd.shallowRender(<MyComponent />);

var homeLink = tree.subTree('a', { href: '/' });

assert.equal(homeLink.type, 'a');
assert.equal(homeLink.props.href, '/');
assert.equal(homeLink.text(), 'Home');
```

## Breaking Changes in 1.0

 * React 0.13 is no longer supported
 * Rendering a function (which would be called) is no longer supported, this only existed for React 0.13's owner-based context
 * `subTreeLike` has been renamed to `subTree`
 * `everySubTreeLike` has been renamed to `everySubTree`
 * The original `subTree` has been removed, `exact` can be used to get this behaviour back, but I don't recommend you do.
 * The original `subTreeLike` has been removed, `exact` can be used to get this behaviour back, but I don't recommend you do.
 * removed `findNode`, use `subTree` instead
 * removed `textIn`, use `subTree().text()` instead
 * removed `fillField`, use `subTree().props.onChange` instead
 * removed `findComponent`, use `subTree()` instead
 * removed `findComponentLike`, use `subTree()` instead
 * `toString()` uses a completely different approach now. Previously it would use React's string rendering and produce the HTML including expanded children. Now it produces a pretty-printed representation of the result of the render.
 * `reRender()` now takes props instead of a ReactElement.

## Usage

The goal of skin-deep is to provide higher level functionality built on top of the Shallow Rendering test utilities provided by React.

By default, shallow rendering gives you a way to see what a component would render without continuing along into rendering its children. This is a very powerful baseline, but in my opinion it isn't enough to create good UI tests. You either have to assert on the whole rendered component, or manually traverse the tree like this:

```js
assert(rendered.props.children[1].props.children[2].children, 'Click Here');
```

By their nature user interfaces change a lot - sometimes these changes are to behaviour, but sometimes they're simply changes to wording or minor display changes. Ideally, we'd want non-brittle UI tests which can survive these superficial changes, but still check that the application behaves as expected.

### Rendering

Use the `shallowRender` function to get a `tree` you can interact with.

```jsx
var sd = require('skin-deep');

var tree = sd.shallowRender(<MyComponent />);
```

You can now inspect the the tree to see its contents

```js
tree.getRenderOutput();
// -> ReactElement, same as normal shallow rendering

tree.type;
// -> The component type of the root element

tree.props;
// -> The props of the root element
```

The real benefits of skin deep come from the ability to extract small portions of the tree with a jQuery-esque API. You can then assert only on these sub-trees.

### Extracting portions of the result

Extraction methods all take a CSS-esque selector as the first argument. This is commonly a component or tag name, but can also be a class or ID selector. The special value '*' can be used to match anything.

The second (optional) argument is the matcher, this can be an object to match against props, or a predicate function which will be passed each node and can decide whether to include it.

```jsx
tree.subTree('Button');
// -> the first Button component

tree.everySubTree('Button');
// -> all the button components

tree.subTree('.button-primary');
// -> the first component with class of button-primary

tree.subTree('#submit-button');
// -> the first component with id of submit-button

tree.subTree('Button', { type: 'submit' });
// -> the first Button component with type=submit

tree.subTree('*', { type: 'button' });
// -> All components / elements with type=button

tree.subTree('*', function(node) { return node.props.size > 20; });
// -> All components / elements with size prop above 20
```

### Triggering events

There's no DOM involved, so events could be a bit tricky - but as we're just using data, we can call functions directly!

```js
var MyButton = React.createClass({
  clicked: function(e) {
    console.log(e.target.innerHTML);
  },
  render: function() {
    return <button onClick={this.clicked}>Click {this.props.n}</button>;
  }
});
var tree = sd.shallowRender(<MyButton />);
tree.subTree('button').props.onClick({
  target: {
    innerHTML: 'Whatever you want!'
  }
});
```

### Going deeper

Sometimes shallow rendering isn't enough - often you'll want to have some integration tests which can render a few layers of your application. I prefer not to have to use a full browser or jsdom for this sort of thing - so we introduced the `dive` method. This allows you to move down the tree, recursively shallow rendering as needed.

```js
var MyList = React.createClass({
  render: function() {
    return <ul>{[1,2,3].map(function(n) { return <MyItem n={n} />; })}</ul>;
  }
});
var MyItem = React.createClass({
  render: function() {
    return <li><MyButton>{this.props.n}</MyButton></li>;
  }
});
var MyButton = React.createClass({
  render: function() {
    return <button>Click {this.props.n}</button>;
  }
});

var tree = sd.shallowRender(<MyList />);
var buttonElement = tree.dive(['MyItem', 'MyButton']);
assert(buttonElement.text(), 'Click 1');
```

### Use with test frameworks

> TODO: flesh this out a bit more

Skin deep doesn't care which test framework you use, it just gives you the data you need to make assertions.

If you want to take this further, should be pretty simple to extend your favorite assertion library to be skin-deep aware.

As we use tend to use `chai`, there's a `chai` plugin bundled inside this package. You can use it via `chai.use(require('skin-deep/chai'))`.

## API Docs

### .shallowRender(element [, context])

Get a tree instance by shallow-rendering a renderable [ReactElement](http://facebook.github.io/react/docs/glossary.html#react-elements).

* `element {ReactElement}` - element to render
* `context {object}` - _optional_ [context](http://facebook.github.io/react/docs/context.html)

Returns [`tree`](#tree)

### tree

#### tree.type

Access the type of the rendered root element.

Returns [`ReactComponent class`](http://facebook.github.io/react/docs/glossary.html#react-components) or `string`.

#### tree.props

Access the props of the rendered root element.

Returns `object`

#### tree.reRender(props [, context])

Re-render the element with new props into the same tree as the previous render. Useful for testing how a component changes over time in response to new props from its parent.

* `props {object}` - the new props, which will replace the previous ones
* `context {object}` - _optional_ [context](http://facebook.github.io/react/docs/context.html)

Returns `null`

#### tree.text()

Access the textual content of the rendered root element including any text of its children. This method doesn't understand CSS, or really anything about HTML rendering, so might include text which wouldn't be displayed to the user.

If any components are found in the tree, their textual representation will be a stub like `<Widget />`. This is because they could do anything with their props, and thus are not really suitable for text assertions. If you have any suggestions for how to make it easier to do text assertions on custom components, please let me know via issues.

Returns `string`

#### tree.toString()

Produce a friendly JSX-esque representation of the rendered tree.

This is not really suitable for asserting against as it will lead to very brittle tests. Its main purpose is supposed to be for printing out nice debugging information, eg `"no <selector> found in <tree.toString()>"`.

Returns `string`

#### tree.getRenderOutput()

Access the rendered component tree. This is the same result you would get using shallow rendering without skin-deep.

You usually shouldn't need to use this.

Returns [`ReactElement`](http://facebook.github.io/react/docs/glossary.html#react-elements)

#### tree.getMountedInstance()

Access the mounted instance of the component.

Returns `object`

#### tree.subTree(selector [, matcher])

Extract a portion of the rendered component tree. If multiple nodes match the selector, will return the first.

* `selector {`[`Selector`](#using-selectors)`}` - how to find trees
* `matcher {`[`Matcher`](#using-matchers)`}` - _optional_ additional conditions

Returns [`tree`](#tree) or `false`

#### tree.everySubTree(selector [, matcher])

Extract multiple portions of the rendered component tree.

* `selector {`[`Selector`](#using-selectors)`}` - how to find trees
* `matcher {`[`Matcher`](#using-matchers)`}` - _optional_ additional conditions

Returns `array` of [`tree`](#tree)s

#### tree.dive(path)

"Dive" into the rendered component tree, rendering the next level down as it goes. See [Going Deeper](#going-deeper) for an example.

* `path {array of `[`Selector`](#using-selectors)`s}`

Returns `tree`
Throws if the path cannot be found.

### Using Selectors

> TODO

### Using Matchers

> TODO

### .exact(props)

Create a matcher which only accepts nodes that have exactly those `props` passed in - no extra props.

* `props {object}` - to match against

Returns `function`

### .any

A magic value which can be used in a prop matcher that will allow any value to be matched. It will still fail if the key doesn't exist

eg.
```jsx
{ abc: sd.any }

// Will match each of the following
<Component abc="1" />
<Component abc={100} />
<Component abc={function(){}} />

// but not
<Component />
<Component def="1" />
```

### .hasClass(node, className)

Helper function to check if a node has the HTML class specified. Exported in case you want to use this in a custom matcher.
