var chai = require('chai');
chai.use(require('../chai'));
var expect = chai.expect;
var assert = chai.assert;

var React = require('react');

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  describe("inRenderedOutput", function() {
    var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));

    it("should work with expect", function() {
      expect(tree).to.have.inRenderedOutput('h1');
      expect(function() {
        expect(tree).to.have.inRenderedOutput('h2');
      }).to.throw(chai.AssertionError);
    });

    it("should work with assert", function() {
      assert.inRenderedOutput(tree, 'h1');
      assert.throws(function() {
        assert.inRenderedOutput(tree, 'h2');
      }, chai.AssertionError);
    });

  });

  describe("notInRenderedOutput", function() {
    var tree = sd.shallowRender($('h2', { title: "blah" }, "Heading!"));

    it("should work with expect", function() {
      expect(tree).to.not.have.inRenderedOutput('h1');
      expect(function() {
        expect(tree).to.not.have.inRenderedOutput('h2');
      }).to.throw(chai.AssertionError);
    });

    it("should work with assert", function() {
      assert.notInRenderedOutput(tree, 'h1');
      assert.throws(function() {
        assert.notInRenderedOutput(tree, 'h2');
      }, chai.AssertionError);
    });

  });

});
