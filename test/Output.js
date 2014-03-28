/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Expression = require('..').Expression;

module.exports.Nicer = {
  
  test1: function(test) {
    var expression = new Expression('a * c * b + c * b').optimize().nice('factorized');
    test.strictEqual(expression.getRoot().serializeTeX(), '{b} {c} {({a}+{1})}');
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('a * c * b + c * b + c * d + e * g * c').optimize().nice('factorized');
    test.strictEqual(expression.getRoot().serializeTeX(), '{c} {({{a} {b}}+{{e} {g}}+{b}+{d})}');
    
    test.done();
  },
  
  test3: function(test) {
    var expression = new Expression('(a + b)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{a} {c}}+{{b} {c}}');
    
    test.done();
  },
  
  test4: function(test) {
    var expression = new Expression('(a + b + d)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{a} {c}}+{{b} {c}}+{{c} {d}}');
    
    test.done();
  },
  
  test5: function(test) {
    var expression = new Expression('(a - b - d)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{a} {c}}-{{b} {c}}-{{c} {d}}');
    
    test.done();
  },
  
  test6: function(test) {
    var expression = new Expression('(a - b + d)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{{a} {c}}-{{b} {c}}}+{{c} {d}}');
    
    test.done();
  },
  
  test7: function(test) {
    var expression = new Expression('(a + b - d)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{{a} {c}}+{{b} {c}}}-{{c} {d}}');
    
    test.done();
  },
  
  test8: function(test) {
    var expression = new Expression('(a + b - d + e)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{{{a} {c}}+{{b} {c}}}-{{c} {d}}}+{{c} {e}}');
    
    test.done();
  },
  
  test9: function(test) {
    var expression = new Expression('(a + b - d*e)* c').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{{a} {c}}+{{b} {c}}}-{{c} {d} {e}}');
    
    test.done();
  },
  
  test10: function(test) {
    var expression = new Expression('a + b - d*e').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{a}+{b}}-{{d} {e}}');
    
    test.done();
  },
  
  test11: function(test) {
    var expression = new Expression('(a + b) / e').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{\\frac{a}{e}}+{\\frac{b}{e}}');
    
    test.done();
  },
  
  test12: function(test) {
    var expression = new Expression('(a - b + e) / e').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{\\frac{a}{e}}-{\\frac{b}{e}}}+{1}');
    
    test.done();
  },
  
  test13: function(test) {
    var expression = new Expression('x*y*z + x*y + x*z + x*y*z').optimize().nice('expanced');
    test.strictEqual(expression.getRoot().serializeTeX(), '{{2} {x} {y} {z}}+{{x} {y}}+{{x} {z}}');

    test.done();
  },
  
  test14: function(test) {
    var expression = new Expression('x*y*z + x*y + x*z + x*y*z').optimize().nice('factorized');
    test.strictEqual(expression.getRoot().serializeTeX(), '{x} {({{2} {y} {z}}+{y}+{z})}');

    test.done();
  }
  
};

module.exports.TeX = {
  
  test1: function(test) {
    var expression = new Expression('30 * b * c * c').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '{b} {{c}^{2}} {30}');
    
    test.done();
  },
  
  test2: function(test) {
    var expression = new Expression('b * b * b / b').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '{b}^{2}');
    
    test.done();
  },
  
  test3: function(test) {
    var expression = new Expression('b ^ (1/2) / b').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '{b}^{-\\frac{1}{2}}');
    
    test.done();
  },
  
  test4: function(test) {
    var expression = new Expression('a + a + b').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '{{a} {2}}+{b}');
    
    test.done();
  },
  
  test5: function(test) {
    var expression = new Expression('2 - 2').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '0');
    
    test.done();
  },
  
  test6: function(test) {
    var expression = new Expression('2 - 4').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '-2');
    
    test.done();
  },
  
  test7: function(test) {
    var expression = new Expression('a - a').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '0');
    
    test.done();
  },

  test8: function(test) {
    var expression = new Expression('a - 1').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '{a}-{1}');
    
    test.done();
  }
  
};

module.exports.ComplexExpressions = {
  
  test1: function(test) {
    var expression = new Expression('((7 - 6)/6 + 9)/(1/36+1/25 - 31/16)/(169/24)').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '-\\frac{792000}{1137539}');
    
    test.done();
  },
      
  test2: function(test) {
    var expression = new Expression('((4/10) + (49/55) + (3/11))/(3/2 + 1/4)').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '\\frac{344}{385}');
    
    test.done();
  },
  
  test3: function(test) {
    var expression = new Expression('(((1/2) / (5/4) + (7/5) / (11/7) - (3/11))*3)/((3/2 + 1/4)/ (55/3))').optimize();
    
    test.notStrictEqual(expression.getRoot(), undefined);
    test.strictEqual(expression.getRoot().serializeTeX(), '32');
    
    test.done();
  }
    
};