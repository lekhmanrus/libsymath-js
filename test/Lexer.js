/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module, require */
'use strict';

var Lexer = require('..').Lexer;

module.exports.getNextToken = {
  
  general: function(test) {
    var string = 'aaaa + бб   1(([ 2a',
        instance = new Lexer(string);
    
    var chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'aaaa');
    test.strictEqual(chunk.loc.start, 0);
    test.strictEqual(chunk.loc.end, 4);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '+');
    test.strictEqual(chunk.loc.start, 5);
    test.strictEqual(chunk.loc.end, 6);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'бб');
    test.strictEqual(chunk.loc.start, 7);
    test.strictEqual(chunk.loc.end, 9);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '1');
    test.strictEqual(chunk.loc.start, 12);
    test.strictEqual(chunk.loc.end, 13);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '(');
    test.strictEqual(chunk.loc.start, 13);
    test.strictEqual(chunk.loc.end, 14);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '(');
    test.strictEqual(chunk.loc.start, 14);
    test.strictEqual(chunk.loc.end, 15);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '[');
    test.strictEqual(chunk.loc.start, 15);
    test.strictEqual(chunk.loc.end, 16);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '2a');
    test.strictEqual(chunk.loc.start, 17);
    test.strictEqual(chunk.loc.end, 19);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk, undefined);
    
    test.done();
  },

  numbers: function(test) {
    var string = '123 11 i1 99i 9i9 i9i i 8 i',
        instance = new Lexer(string);
    
    var chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '123');
    test.strictEqual(chunk.loc.start, 0);
    test.strictEqual(chunk.loc.end, 3);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '11');
    test.strictEqual(chunk.loc.start, 4);
    test.strictEqual(chunk.loc.end, 6);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'i1');
    test.strictEqual(chunk.loc.start, 7);
    test.strictEqual(chunk.loc.end, 9);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '99i');
    test.strictEqual(chunk.loc.start, 10);
    test.strictEqual(chunk.loc.end, 13);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '9i9');
    test.strictEqual(chunk.loc.start, 14);
    test.strictEqual(chunk.loc.end, 17);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'i9i');
    test.strictEqual(chunk.loc.start, 18);
    test.strictEqual(chunk.loc.end, 21);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'i');
    test.strictEqual(chunk.loc.start, 22);
    test.strictEqual(chunk.loc.end, 23);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, '8');
    test.strictEqual(chunk.loc.start, 24);
    test.strictEqual(chunk.loc.end, 25);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk.text, 'i');
    test.strictEqual(chunk.loc.start, 26);
    test.strictEqual(chunk.loc.end, 27);
    
    chunk = instance.getNextToken();
    test.strictEqual(chunk, undefined);
    
    test.done();
  }
  
};

module.exports.getTokenType = {
  
  general: function(test) {
    var string = 'aaaa + бб   11 x12 ((] ++ 2a',
        instance = new Lexer(string);
    
    var token = instance.getNextToken(),
        type  = instance.getTokenType(token);
    
    test.strictEqual(type.type, 'literal');
    test.strictEqual(type.value, 'aaaa');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'operator');
    test.strictEqual(type.value, '+');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'literal');
    test.strictEqual(type.value, 'бб');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'constant');
    test.strictEqual(type.value, 11);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'literal');
    test.strictEqual(type.value, 'x12');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'bracket');
    test.strictEqual(type.value, '(');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'bracket');
    test.strictEqual(type.value, '(');
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'bracket');
    test.strictEqual(type.value, ']');
    
    token = instance.getNextToken();
    test.throws(function() {
      instance.getTokenType(token);
    }, SyntaxError);
    
    token = instance.getNextToken();
    test.throws(function() {
      instance.getTokenType(token);
    }, SyntaxError);
    
    test.throws(function() {
      instance.getTokenType();
    }, ReferenceError);
    
    test.done();
  },
  
  numbers: function(test) {
    var string = '11 i3 3i i3i 3i3 1.5i i1.5 i',
        instance = new Lexer(string);
    
    var token = instance.getNextToken(),
        type  = instance.getTokenType(token);
    
    test.strictEqual(type.type, 'constant');
    test.strictEqual(type.value, 11);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'complex');
    test.strictEqual(type.value, 3);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'complex');
    test.strictEqual(type.value, 3);
    
    token = instance.getNextToken();
    test.throws(function() {
      instance.getTokenType(token);
    }, SyntaxError);
    
    token = instance.getNextToken();
    test.throws(function() {
      instance.getTokenType(token);
    }, SyntaxError);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'complex');
    test.strictEqual(type.value, 1.5);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'complex');
    test.strictEqual(type.value, 1.5);
    
    token = instance.getNextToken();
    type  = instance.getTokenType(token);
    test.strictEqual(type.type, 'complex');
    test.strictEqual(type.value, 1);
    
    test.done();
  }
  
};

module.exports.tokens = function(test) {
  var string = '((11 + 22i) / 55) * a + f(x(5 + a))',
      tokens = new Lexer(string).tokens();
  
  test.strictEqual(tokens.length, 19);
  test.strictEqual(tokens[0].type, 'bracket');
  test.strictEqual(tokens[1].type, 'bracket');
  test.strictEqual(tokens[2].type, 'constant');
  test.strictEqual(tokens[3].type, 'operator');
  test.strictEqual(tokens[4].type, 'complex');
  test.strictEqual(tokens[5].type, 'bracket');
  test.strictEqual(tokens[6].type, 'operator');
  test.strictEqual(tokens[7].type, 'constant');
  test.strictEqual(tokens[8].type, 'bracket');
  test.strictEqual(tokens[9].type, 'operator');
  test.strictEqual(tokens[10].type, 'literal');
  test.strictEqual(tokens[11].type, 'operator');
  test.strictEqual(tokens[12].type, 'func');
  test.strictEqual(tokens[13].type, 'func');
  test.strictEqual(tokens[14].type, 'constant');
  test.strictEqual(tokens[15].type, 'operator');
  test.strictEqual(tokens[16].type, 'literal');
  test.strictEqual(tokens[17].type, 'bracket');
  test.strictEqual(tokens[18].type, 'bracket');
  
  test.done();
};