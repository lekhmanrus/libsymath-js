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
  },
  
  test3: function(test) {
    var expression = new Expression('f(5 + 2)').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 1);
    test.strictEqual(root.head.type, 'func');
    test.strictEqual(root.head.value, 'f');
    
    root = root.childs[0];
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 7);
    
    test.done();
  },
  
  test4: function(test) {
    var expression = new Expression('5 * a + 2 * a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 7);
    
    test.done();
  },
  
  test5: function(test) {
    var expression = new Expression('(5 * a + 2 * a) / a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 7);
    
    test.done();
  },
  
  test6: function(test) {
    var expression = new Expression('(5 * a - 6 * a) / a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, -1);
    
    test.done();
  },
  
  test7: function(test) {
    var expression = new Expression('(5 * a - 6 * a)').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, -1);
    
    test.done();
  },
  
  test8: function(test) {
    var expression = new Expression('(5 * a - 5 * a) / a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 0);
    
    test.done();
  },
  
  test9: function(test) {
    var expression = new Expression('5 * a - 5 * a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 0);
    
    test.done();
  },
  
  test10: function(test) {
    var expression = new Expression('2 / 5 + 3 / 5').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 1);
    
    test.done();
  },
  
  test11: function(test) {
    var expression = new Expression('1 + 3 / 2').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 5);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
    test.done();
  },
  
  test12: function(test) {
    var expression = new Expression('1 / 3 - 1 / 6').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 1);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 6);
    
    test.done();
  },
  
  test13: function(test) {
    var expression = new Expression('5 / 4 - 5 / 4').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 0);
    
    test.done();
  },
  
  test14: function(test) {
    var expression = new Expression('1/7 + 1/3').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 10);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 21);
    
    test.done();
  },
  
  test15: function(test) {
    var expression = new Expression('3/1 - 7/2').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, -1);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
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

module.exports.division = {
  
  test1: function(test) {
    var expression = new Expression('5 / 2 / a').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 5);
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('a / b / c / d / e').optimize(),
        root = expression.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    root = expression.getRoot().childs[0];
    
    test.strictEqual(root.childs.length, 3);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'c');
    
    test.strictEqual(root.childs[2].childs, undefined);
    test.strictEqual(root.childs[2].head.type, 'literal');
    test.strictEqual(root.childs[2].head.value, 'e');
    
    root = expression.getRoot().childs[1];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'b');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'd');
    
    test.done();
  },
  
  test3: function(test) {
    var expression = new Expression('a / b / a').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'b');
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '^');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
    test.done();
  },
  
  test4: function(test) {
    var expression = new Expression('5 / 5 / 5').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 5);
    
    test.done();
  },
  
  test5: function(test) {
    var expression = new Expression('a / b / b').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'literal');
    test.strictEqual(root.head.value, 'a');
    
    test.done();
  },
  
  test6: function(test) {
    var expression = new Expression('(3 * a - 2 * a) / a').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 1);
    
    test.done();
  },
  
  test7: function(test) {
    var expression = new Expression('a * f(a) / a').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 1);
    test.strictEqual(root.head.type, 'func');
    test.strictEqual(root.head.value, 'f');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.done();
  },
  
  test8: function(test) {
    var expression = new Expression('f(a) / a').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'a');
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 1);
    test.strictEqual(root.head.type, 'func');
    test.strictEqual(root.head.value, 'f');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.done();
  },
  
  test9: function(test) {
    var expression = new Expression('a ^ 2 / a').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'literal');
    test.strictEqual(root.head.value, 'a');
    
    test.done();
  },
  
  test10: function(test) {
    var expression = new Expression('4 / 2').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 2);
    
    test.done();
  },
  
  test11: function(test) {
    var expression = new Expression('4 * a/ 2').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
    test.done();
  },
  
  test12: function(test) {
    var expression = new Expression('2 / 4').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 1);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);
    
    test.done();
  },
  
  test13: function(test) {
    var expression = new Expression('2 / 5').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 2);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 5);
    
    test.done();
  },
  
  test14: function(test) {
    var expression = new Expression('4 / 1').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs, undefined);
    test.strictEqual(root.head.type, 'constant');
    test.strictEqual(root.head.value, 4);
    
    test.done();
  },
  
  test15: function(test) {
    var expression = new Expression('14 / 21').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '/');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 2);
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 3);
    
    test.done();
  },
  
  test16: function(test) {
    var expression = new Expression('(9 * a - 6 * b) / 3').optimize(),
        root = expression.getRoot();
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '-');
    
    root = expression.getRoot().childs[0];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 3);
    
    root = expression.getRoot().childs[1];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'b');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1].head.type, 'constant');
    test.strictEqual(root.childs[1].head.value, 2);    
    
    test.done();
  }
  
};