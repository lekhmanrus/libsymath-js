/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Expression = require('..').Expression;

module.exports.Simple = {
  
  test1: function(test) {
    var result = new Expression('2*x + 3')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '2');
    test.done();
  },
  
  test2: function(test) {
    var result = new Expression('2*x + 3')
        .optimize()
        .differentiate('x')
        .nice('factorized')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '2');
    test.done();
  },
  
  test3: function(test) {
    var result = new Expression('2*x*x + 3')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '{4} {x}');
    test.done();
  },
  
  test4: function(test) {
    var result = new Expression('2*x*x + 3*x')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '{{4} {x}}+{3}');
    test.done();
  },
  
  test5: function(test) {
    var result = new Expression('23')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '0');
    test.done();
  },
  
  test6: function(test) {
    var result = new Expression('2*x + 3*y')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '2');
    test.done();
  },
  
  test7: function(test) {
    var result = new Expression('2*x + 3*y')
        .optimize()
        .differentiate('y')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '3');
    test.done();
  },

  test8: function(test) {
    var result = new Expression('(y*x)^2')
        .optimize()
        .differentiate('y')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '{2} {y} {{x}^{2}}');
    test.done();
  },

  test9: function(test) {
    var result = new Expression('(y*x)^2')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '{2} {x} {{y}^{2}}');
    test.done();
  },

  test10: function(test) {
    var result = new Expression('y^x')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '{{y}^{x}} {ln(y)}');
    test.done();
  },

  test11: function(test) {
    var result = new Expression('(3*x)/y')
        .optimize()
        .differentiate('x')
        .nice('expanced')
        .getRoot()
          .serializeTeX();
    
    test.strictEqual(result, '\\frac{3}{y}');
    test.done();
  },
  
};