/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Lexer = require('./lexer'),
    Node  = require('./tree').Node,
    Leaf  = require('./tree').Leaf;

function ExpressionTree(expressionString) {
  if(!expressionString) {
    return;
  }
  
  var tokens = new Lexer(expressionString).tokens();
  
  this.privateRoot_ = undefined;
  this.buildBinaryExpressionTree(tokens);
}

ExpressionTree.prototype.polishNotation = function(tokens) {
  function getOperationPriority(value) {
    if(value === '+' || value === '-') {
      return 1;
    }
    
    if(value === '*' || value === '/') {
      return 2;
    }
    
    if(value === '^') {
      return 3;
    }
    
    return -1;
  }
  
  var result  = [],
      stack   = [],
      i;
  
  for(i = 0; i < tokens.length; ++i) {
    if(['complex', 'constant', 'literal'].indexOf(tokens[i].type) !== -1) {
      result.push(tokens[i]);
    }
    
    else if(tokens[i].type === 'operator') {
      while(stack.length > 0 && getOperationPriority(tokens[i].value) <= getOperationPriority(stack[stack.length - 1].value)) {
        result.push(stack.pop());
      }
      
      stack.push(tokens[i]);
    }
    
    else if(tokens[i].type === 'func') {
      stack.push(tokens[i]);
    }
    
    else if(tokens[i].type === 'bracket') {
      if(tokens[i].value === '(') {
        stack.push(tokens[i]);
      }
      
      else if(tokens[i].value === ')') {
        while(!/bracket|func/.test(stack[stack.length - 1].type) && stack[stack.length - 1].value !== ')') {
          result.push(stack.pop());
        }
        
        if(stack[stack.length - 1].type === 'func') {
          result.push(stack.pop());
        }
        else {
          stack.pop();
        }
      }
    }
  }
  
  while(stack.length > 0) {
    result.push(stack.pop());
  }
  
  return result;
};

ExpressionTree.prototype.checkBrackets = function(tokens) {
  var depth = 0,
      i;
  
  for(i = 0; i < tokens.length; ++i) {
    if(tokens[i].type === 'func') {
      ++depth;
    }
    
    else if(tokens[i].type === 'bracket') {
      if(tokens[i].value === '[' || tokens[i].value === '(') {
        ++depth;
        tokens[i].value = '(';
      }
      else
      if(tokens[i].value === ']' || tokens[i].value === ')') {
        --depth;
        tokens[i].value = ')';
      }
    }
  }
  
  return depth === 0;
};

ExpressionTree.prototype.buildBinaryExpressionTree = function(tokens) {
  if(!this.checkBrackets(tokens)) {
    throw new SyntaxError('expression error: brackets count mismatch!');
  }
  
  var rawExpression = this.polishNotation(tokens),
      i, node,
      buffer = [],
      op = /func|operator/;
  
  for(i = 0; i < rawExpression.length; ++i) {
    if(!op.test(rawExpression[i].type)) {      
      buffer.push(new Leaf(rawExpression[i]));
    }
    
    else {
      if(rawExpression[i].type === 'func') {
        node = new Node(rawExpression[i], buffer.slice(buffer.length - 1));
        buffer.pop();
        buffer.push(node);
      }
      
      else {
        node = new Node(rawExpression[i], buffer.slice(buffer.length - 2));
        buffer.pop();
        buffer.pop();
        buffer.push(node);
      }
    }
  }
  
  if(buffer.length !== 1) {
    throw new Error('SYNTAX_ERROR');
  }
  
  this.privateRoot_ = buffer[0];
};

ExpressionTree.prototype.getRoot = function() {
  return this.privateRoot_;
};

module.exports = ExpressionTree;