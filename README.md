# skin-deep

Test assertion helpers for use with React's shallowRender test utils.

[![npm version](https://img.shields.io/npm/v/skin-deep.svg)](https://www.npmjs.com/package/skin-deep) [![Build Status](https://img.shields.io/travis/glenjamin/skin-deep/master.svg)](https://travis-ci.org/glenjamin/skin-deep) [![Coverage Status](https://coveralls.io/repos/glenjamin/skin-deep/badge.svg?branch=master)](https://coveralls.io/r/glenjamin/skin-deep?branch=master) ![MIT Licensed](https://img.shields.io/npm/l/skin-deep.svg)

## Install

```sh
npm install skin-deep
```

## Usage

> TODO

For now, see [the tests](test/test.js).

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

See https://github.com/glenjamin/skin-deep/issues/9 for a dicussion of what the new API will be consolidated to.

The short version is that you should prefer the methods with `subTree` in the name.
