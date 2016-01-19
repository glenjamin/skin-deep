# skin-deep

Test assertion helpers for use with React's shallowRender test utils.

[![npm version](https://img.shields.io/npm/v/skin-deep.svg)](https://www.npmjs.com/package/skin-deep) [![Build Status](https://img.shields.io/travis/glenjamin/skin-deep/master.svg)](https://travis-ci.org/glenjamin/skin-deep) [![Coverage Status](https://coveralls.io/repos/glenjamin/skin-deep/badge.svg?branch=master)](https://coveralls.io/r/glenjamin/skin-deep?branch=master) ![MIT Licensed](https://img.shields.io/npm/l/skin-deep.svg)

## Install

```sh
npm install skin-deep
```

## Important Changes

### 0.14

Breaking Change: Prior to version 0.14, text() normalisation incorrectly added spaces between children. This was technically a bug, but upgrading will break any tests which relied on the old behaviour.

## Usage

> TODO

For now, see [the tests](test/test.js).

Some people have been helpful enough to write some blog posts about skin deep, which you may find useful.

 * [Unit Testing React components without a DOM](http://simonsmith.io/unit-testing-react-components-without-a-dom/)
 * [React Testing with Shallow Rendering and Skin Deep](http://willcodefor.beer/react-testing-with-shallow-rendering-and-skin-deep/)

You can also consult the [documentation for the upcoming Version 1.0](https://github.com/glenjamin/skin-deep/tree/one-point-oh#readme), which is mostly accurate for the current version.

## Troubleshooting

### Errors when bundling

This lib currently supports both React 0.13 and React 0.14. If you are using a bundling tool for your test suite this will cause problems. You will need to add config to ignore the React internals for the version you are not using:

####

```js
// React 0.14 & Webpack
plugins: [
  new webpack.IgnorePlugin(/ReactContext/),
]

// React 0.13 & Webpack
plugins: [
  new webpack.IgnorePlugin(/react-addons|react-dom/),
]

// React 0.14 & Browserify
bundle.exclude('react/lib/ReactContext');

// React 0.13 & Browserify
bundle.exclude('react-dom/server');
bundle.exclude('react-addons-test-utils');
```

# Docs

> TODO

For now, see [the tests](test/test.js).

You can also consult the [documentation for the upcoming Version 1.0](https://github.com/glenjamin/skin-deep/tree/one-point-oh#readme), which is mostly accurate for the current version.
