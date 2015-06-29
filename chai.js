module.exports = function(chai, utils) {
  var Assertion = chai.Assertion;
  var flag = utils.flag;

  function inRenderedOutput(query, msg) {
    if (msg) flag(this, 'message', msg);
    var renderer = flag(this, 'object');

    var node = renderer.findNode(query);
    this.assert(node,
      'Expected to find #{exp} in #{act}',
      'Expected not to find #{exp} in #{act}',
      query, renderer
    );
  }

  Assertion.addMethod('inRenderedOutput', inRenderedOutput);

  chai.assert.inRenderedOutput = function(renderer, query, msg) {
    new Assertion(renderer, msg).to.have.inRenderedOutput(query, msg);
  };

  chai.assert.notInRenderedOutput = function(renderer, query, msg) {
    new Assertion(renderer, msg).to.not.have.inRenderedOutput(query, msg);
  };
};
