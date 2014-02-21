/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module, require */
'use strict';

var symath = require('../index.js'),
    Node   = require('../src/tree').Node,
    Leaf   = require('../src/tree').Leaf;

module.exports.integrationTest = function(test) {
  test.ok(symath.Lexer);
  test.ok(symath.Expression);
  
  test.done();
};

module.exports.internalTreeApiTest = function(test) {
  var nodeProps = Object.getOwnPropertyNames(new Node()),
      leafProps = Object.getOwnPropertyNames(new Leaf()),
      nodeProto = Object.getOwnPropertyNames(Node.prototype),
      leafProto = Object.getOwnPropertyNames(Leaf.prototype),
      i;
  
  test.strictEqual(nodeProps.length, leafProps.length);
  for(i = 0; i < nodeProps.length; ++i) {
    test.notStrictEqual(leafProps.indexOf(nodeProps[i]), -1);
  }
  
  test.strictEqual(nodeProto.length, leafProto.length);
  for(i = 0; i < nodeProto.length; ++i) {
    test.notStrictEqual(leafProto.indexOf(nodeProto[i]), -1);
  }
  
  test.done();
};