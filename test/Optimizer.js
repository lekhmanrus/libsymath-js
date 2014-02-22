/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Expression = require('..').Expression,
    Optimizer  = require('../src/optimizer');

module.exports.optimizeTwice = function(test) {
  var expression = new Expression('2 + 3 * 3').optimize(),
      root = expression.getRoot();
  
  test.notStrictEqual(root, undefined);
  
  test.strictEqual(root.childs, undefined);
  test.strictEqual(root.head.type, 'constant');
  test.strictEqual(root.head.value, 11);
  
  expression.optimize();
  root = expression.getRoot();
  
  test.strictEqual(root.childs, undefined);
  test.strictEqual(root.head.type, 'constant');
  test.strictEqual(root.head.value, 11);
  
  test.done();
};

module.exports.optimizeInvalid = function(test) {
  var expression = new Expression();
  test.strictEqual(expression.getRoot(), undefined);
  
  expression.optimize();
  test.strictEqual(expression.getRoot(), undefined);
  
  test.throws(function() {
    var optimizer = new Optimizer();
  }, ReferenceError);
  
  test.done();
};

module.exports.addition = {
  
  test1: function(test) {
    var expression = new Expression('2 + 3 + 5').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 10);
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('(5 + 2) + (2 + (6 + 6))').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 21);
    
    test.done();
  }
  
};

module.exports.multiplication = {
  
  test1: function(test) {
    var expression = new Expression('b * b * b * a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'a');
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '^');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'b');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 3);
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('2 * 1').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 2);
    test.done();
  },
  
  test3: function(test) {
    var expression = new Expression('(2 + 3) * 5').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 25);
    
    test.done();
  },
  
  test4: function(test) {
    var expression = new Expression('2 * 0').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 0);
    test.done();
  },
  
  test5: function(test) {
    var expression = new Expression('sin(5 * cos(x)^x) * 0').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 0);
    test.done();
  },
  
  test6: function(test) {
    var expression = new Expression('2 + 3 * 0').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 2);
    test.done();
  },
  
  test7: function(test) {    
    var expression = new Expression('2 + 3 * 3').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 11);
    test.done();
  }
  
};