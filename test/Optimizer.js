/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Expression = require('..').Expression;

module.exports.addition = {
  
  test1: function(test) {
    var expression = new Expression('2 + 3 + 5').reduce().optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 10);
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('(5 + 2) + (2 + (6 + 6))').reduce().optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 21);
    
    test.done();
  }
  
};