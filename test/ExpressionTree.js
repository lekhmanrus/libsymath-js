/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module, require */
'use strict';

var ExpressionTree = require('..').Expression,
    Lexer          = require('..').Lexer,
    Node           = require('../src/tree').Node,
    Leaf           = require('../src/tree').Leaf;

module.exports.checkBrackets = function(test) {
  var tree = new ExpressionTree(),
      expr;
  
  expr = '((()(()())))';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), true);
  
  expr = '((()()())';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), false);
  
  expr = '((';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), false);
  
  expr = '))';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), false);
  
  expr = '';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), true);
  
  expr = 'a + b';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), true);
  
  expr = '(a + b)';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), true);
  
  expr = 'f(a + b)';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), true);
  
  expr = '(a + b))';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), false);
  
  expr = 'f(a + b))';
  test.strictEqual(tree.checkBrackets_(new Lexer(expr).tokens()), false);
  
  test.done();
};

module.exports.reversePolishNotation = function(test) {
  var tree = new ExpressionTree(),
      tokens = tree.reversePolishNotation_(new Lexer('a + b * c * d + ( e - f ) * ( g * h + i )').tokens());
      //a b c * d * + e f - g h * i + * +

  test.strictEqual(tokens[0].type, 'literal');
  test.strictEqual(tokens[0].value, 'a');
  test.strictEqual(tokens[1].type, 'literal');
  test.strictEqual(tokens[1].value, 'b');
  test.strictEqual(tokens[2].type, 'literal');
  test.strictEqual(tokens[2].value, 'c');
  test.strictEqual(tokens[3].type, 'operator');
  test.strictEqual(tokens[3].value, '*');
  test.strictEqual(tokens[4].type, 'literal');
  test.strictEqual(tokens[4].value, 'd');
  test.strictEqual(tokens[5].type, 'operator');
  test.strictEqual(tokens[5].value, '*');
  test.strictEqual(tokens[6].type, 'operator');
  test.strictEqual(tokens[6].value, '+');
  test.strictEqual(tokens[7].type, 'literal');
  test.strictEqual(tokens[7].value, 'e');
  test.strictEqual(tokens[8].type, 'literal');
  test.strictEqual(tokens[8].value, 'f');
  test.strictEqual(tokens[9].type, 'operator');
  test.strictEqual(tokens[9].value, '-');
  test.strictEqual(tokens[10].type, 'literal');
  test.strictEqual(tokens[10].value, 'g');
  test.strictEqual(tokens[11].type, 'literal');
  test.strictEqual(tokens[11].value, 'h');
  test.strictEqual(tokens[12].type, 'operator');
  test.strictEqual(tokens[12].value, '*');
  test.strictEqual(tokens[13].type, 'complex');
  test.strictEqual(tokens[13].value, 1);
  test.strictEqual(tokens[14].type, 'operator');
  test.strictEqual(tokens[14].value, '+');
  test.strictEqual(tokens[15].type, 'operator');
  test.strictEqual(tokens[15].value, '*');
  test.strictEqual(tokens[16].type, 'operator');
  test.strictEqual(tokens[16].value, '+');

  tokens = tree.reversePolishNotation_(new Lexer('7 + 4').tokens());
  //7 4 +
  test.strictEqual(tokens[0].type, 'constant');
  test.strictEqual(tokens[0].value, 7);
  test.strictEqual(tokens[1].type, 'constant');
  test.strictEqual(tokens[1].value, 4);
  test.strictEqual(tokens[2].type, 'operator');
  test.strictEqual(tokens[2].value, '+');

  tokens = tree.reversePolishNotation_(new Lexer('a + ( b - c ) * d').tokens());
  //a b c - d * +
  test.strictEqual(tokens[0].type, 'literal');
  test.strictEqual(tokens[0].value, 'a');
  test.strictEqual(tokens[1].type, 'literal');
  test.strictEqual(tokens[1].value, 'b');
  test.strictEqual(tokens[2].type, 'literal');
  test.strictEqual(tokens[2].value, 'c');
  test.strictEqual(tokens[3].type, 'operator');
  test.strictEqual(tokens[3].value, '-');
  test.strictEqual(tokens[4].type, 'literal');
  test.strictEqual(tokens[4].value, 'd');
  test.strictEqual(tokens[5].type, 'operator');
  test.strictEqual(tokens[5].value, '*');
  test.strictEqual(tokens[6].type, 'operator');
  test.strictEqual(tokens[6].value, '+');
  
  tokens = tree.reversePolishNotation_(new Lexer('k(x + f(x(a + b)) + 5)').tokens());
  //x a b + x() f() + 5 + k()
  test.strictEqual(tokens[0].type, 'literal');
  test.strictEqual(tokens[0].value, 'x');
  test.strictEqual(tokens[1].type, 'literal');
  test.strictEqual(tokens[1].value, 'a');
  test.strictEqual(tokens[2].type, 'literal');
  test.strictEqual(tokens[2].value, 'b');
  test.strictEqual(tokens[3].type, 'operator');
  test.strictEqual(tokens[3].value, '+');
  test.strictEqual(tokens[4].type, 'func');
  test.strictEqual(tokens[4].value, 'x');
  test.strictEqual(tokens[5].type, 'func');
  test.strictEqual(tokens[5].value, 'f');
  test.strictEqual(tokens[6].type, 'operator');
  test.strictEqual(tokens[6].value, '+');
  test.strictEqual(tokens[7].type, 'constant');
  test.strictEqual(tokens[7].value, 5);
  test.strictEqual(tokens[8].type, 'operator');
  test.strictEqual(tokens[8].value, '+');
  test.strictEqual(tokens[9].type, 'func');
  test.strictEqual(tokens[9].value, 'k');
  
  tokens = tree.reversePolishNotation_(new Lexer('x + z^2 * a^b').tokens());
  //x z 2 ^ a b ^ * +
  test.strictEqual(tokens[0].type, 'literal');
  test.strictEqual(tokens[0].value, 'x');
  test.strictEqual(tokens[1].type, 'literal');
  test.strictEqual(tokens[1].value, 'z');
  test.strictEqual(tokens[2].type, 'constant');
  test.strictEqual(tokens[2].value, 2);
  test.strictEqual(tokens[3].type, 'operator');
  test.strictEqual(tokens[3].value, '^');
  test.strictEqual(tokens[4].type, 'literal');
  test.strictEqual(tokens[4].value, 'a');
  test.strictEqual(tokens[5].type, 'literal');
  test.strictEqual(tokens[5].value, 'b');
  test.strictEqual(tokens[6].type, 'operator');
  test.strictEqual(tokens[6].value, '^');
  test.strictEqual(tokens[7].type, 'operator');
  test.strictEqual(tokens[7].value, '*');
  test.strictEqual(tokens[8].type, 'operator');
  test.strictEqual(tokens[8].value, '+');

  test.done();
};

module.exports.binaryTree = {
  
  invalid: function(test) {
    test.throws(function() {
      var tree = new ExpressionTree('a + b * (c + d))');
    }, SyntaxError);
    
    test.throws(function() {
      var tree = new ExpressionTree('a + b c d e');
    }, SyntaxError);
    
    test.throws(function() {
      var tree = new ExpressionTree('a + +');
    }, SyntaxError);
    
    test.throws(function() {
      var tree = new ExpressionTree('f()');
    }, SyntaxError);
    
    test.done();
  },
  
  general: function(test) {
    var tree = new ExpressionTree('a + b * (c + d)'),
        root = tree.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '+');
  
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    root = root.childs[1];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'b');
    
    root = root.childs[1];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '+');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'c');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1] instanceof Node, false);
    test.strictEqual(root.childs[1] instanceof Leaf, true);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'd');
    
    test.done();
  },
  
  func: function(test) {
    var tree = new ExpressionTree('sin(2 + b * c) * 5i'),
        root = tree.getRoot();
        
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1] instanceof Node, false);
    test.strictEqual(root.childs[1] instanceof Leaf, true);
    test.strictEqual(root.childs[1].head.type, 'complex');
    test.strictEqual(root.childs[1].head.value, 5);
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 1);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'func');
    test.strictEqual(root.head.value, 'sin');
    
    root = root.childs[0];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '+');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'constant');
    test.strictEqual(root.childs[0].head.value, 2);
    
    root = root.childs[1];
    
    test.strictEqual(root.childs.length, 2);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '*');
    
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'b');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1] instanceof Node, false);
    test.strictEqual(root.childs[1] instanceof Leaf, true);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'c');
    
    test.done();
  }
  
};

module.exports.reducedTree = {
  
  general: function(test){
    var tree = new ExpressionTree('a + b + c + d').reduce(),
        root = tree.getRoot();
    
    test.notStrictEqual(root, undefined);
    
    test.strictEqual(root.childs.length, 4);
    test.strictEqual(root instanceof Node, true);
    test.strictEqual(root instanceof Leaf, false);
    test.strictEqual(root.head.type, 'operator');
    test.strictEqual(root.head.value, '+');
  
    test.strictEqual(root.childs[0].childs, undefined);
    test.strictEqual(root.childs[0] instanceof Node, false);
    test.strictEqual(root.childs[0] instanceof Leaf, true);
    test.strictEqual(root.childs[0].head.type, 'literal');
    test.strictEqual(root.childs[0].head.value, 'a');
    
    test.strictEqual(root.childs[1].childs, undefined);
    test.strictEqual(root.childs[1] instanceof Node, false);
    test.strictEqual(root.childs[1] instanceof Leaf, true);
    test.strictEqual(root.childs[1].head.type, 'literal');
    test.strictEqual(root.childs[1].head.value, 'b');
    
    test.strictEqual(root.childs[2].childs, undefined);
    test.strictEqual(root.childs[2] instanceof Node, false);
    test.strictEqual(root.childs[2] instanceof Leaf, true);
    test.strictEqual(root.childs[2].head.type, 'literal');
    test.strictEqual(root.childs[2].head.value, 'c');
    
    test.strictEqual(root.childs[3].childs, undefined);
    test.strictEqual(root.childs[3] instanceof Node, false);
    test.strictEqual(root.childs[3] instanceof Leaf, true);
    test.strictEqual(root.childs[3].head.type, 'literal');
    test.strictEqual(root.childs[3].head.value, 'd');
    
    test.done();
  }
  
};