/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Lexer     = require('./lexer'),
    Optimizer = require('./optimizer'),
    Node      = require('./tree').Node,
    Leaf      = require('./tree').Leaf,
    Utils     = require('./utils'),
    Nicer     = require('./nicer');

function ExpressionTree(expressionString) {
  if(!expressionString) {
    return;
  }
  
  var tokens = new Lexer(expressionString).tokens();
  
  this.privateRoot_ = undefined;
  this.buildBinaryExpressionTree_(tokens);
}

ExpressionTree.prototype.reversePolishNotation_ = function(tokens) {  
  var result  = [],
      stack   = [],
      i;
  
  for(i = 0; i < tokens.length; ++i) {
    if(/complex|constant|literal/.test(tokens[i].type)) {
      result.push(tokens[i]);
    }
    
    else if(tokens[i].type === 'operator') {
      while(stack.length > 0 && Utils.getOperationPriority(tokens[i].value) <= Utils.getOperationPriority(stack[stack.length - 1].value)) {
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

ExpressionTree.prototype.checkReversePolishNotation_ = function(output) {
  var stack = [],
      i, error;
  
  for(i = 0; i < output.length; ++i) {
    if(/literal|constant|complex/.test(output[i].type)) {
       stack.push(output[i]);
    }
    
    else if(output[i].type === 'operator') {
      if(stack.length < 2) {
        error = new SyntaxError('Expression Error: near `' + output[i].value + '` at ' + (output[i].loc.start + 1));
        error.loc = output[i].loc;
        
        throw error;
      }
      
      stack.shift();
      stack[0] = undefined;
    }
    
    else if(output[i].type === 'func') {
      if(stack.length < 1) {
        error = new SyntaxError('Expression Error: near `' + output[i].value + '` at ' + (output[i].loc.start + 1));
        error.loc = output[i].loc;
        
        throw error;
      }
      
      stack[0] = undefined;
    }
  }
  
  if(stack.length !== 1) {
    for(i = 0; i < stack.length; ++i) {
      if(stack[i]) {
        error = new SyntaxError('Expression Error: near `' + stack[i].value + '` at ' + (stack[i].loc.start + 1));
        error.loc = stack[i].loc;
        
        throw error;
      }
    }
  }
};

ExpressionTree.prototype.checkBrackets_ = function(tokens) {
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

ExpressionTree.prototype.buildBinaryExpressionTree_ = function(tokens) {
  if(!this.checkBrackets_(tokens)) {
    throw new SyntaxError('Expression Error: brackets count mismatch!');
  }
  
  var rawExpression = this.reversePolishNotation_(tokens),
      i, node,
      buffer = [],
      op = /func|operator/;
  
  this.checkReversePolishNotation_(rawExpression);
  
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
  
  this.privateRoot_ = buffer[0];
};

ExpressionTree.prototype.reduce = function() {
  if(!this.privateRoot_ || this.reduced) {
    return;
  }
  
  this.privateRoot_.reduce();
  this.reduced = true;
  
  return this;
};

ExpressionTree.prototype.optimize = function() {
  if(!this.privateRoot_ || this.optimized) {
    return this;
  }
  
  if(!this.reduced) {
    this.reduce();
  }
  
  var optimizer = new Optimizer(this.privateRoot_);
  
  optimizer.process();
  this.optimized = true;
  
  return this;
};

ExpressionTree.prototype.nice = function(type) {
  var nicer = new Nicer(this.privateRoot_, type);
  nicer.nice();
  
  this.optimized = false;
  
  return this;
};

ExpressionTree.prototype.getRoot = function() {
  return this.privateRoot_;
};

ExpressionTree.prototype.differentiate = function(base) {
  this.optimize().nice('expanced');
  this.privateRoot_.differentiate(base);
  
  return this;
};

module.exports = ExpressionTree;