(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true */
/*global module */
'use strict';

var Lexer     = require('./lexer'),
    Optimizer = require('./optimizer'),
    Node      = require('./tree').Node,
    Leaf      = require('./tree').Leaf,
    Utils     = require('./utils');

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
    return;
  }
  
  if(!this.reduced) {
    this.reduce();
  }
  
  var optimizer = new Optimizer(this.privateRoot_);
  
  optimizer.process();
  this.optimized = true;
  
  return this;
};

ExpressionTree.prototype.getRoot = function() {
  return this.privateRoot_;
};

module.exports = ExpressionTree;
},{"./lexer":2,"./optimizer":3,"./tree":4,"./utils":5}],2:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

function Lexer(buffer) {  
  this.buffer = buffer;
  this.offset = 0;
}

var WHITESPACE  = /\s/,
    S_DIGIT     = /[\d\.]/,
    S_COMPLEX_DIGIT = /[\d\.i]/,
    COMPLEX     = /^(i[\d\.]+|[\d\.]+i)$/,
    NUMBER      = /^(\d*\.\d+|\d+)$/,
    S_LETTER    = /[a-zа-я]/,
    LITERAL     = /^[a-zа-я]+\d*$/,
    OPERATOR    = /^(\+|\-|\*|\/|\^)$/,
    S_BRACKET   = /(\(|\[|\]|\))/,
    BRACKET     = /^(\(|\[|\]|\))$/;

Lexer.prototype.getNextToken = function() {
  var length = this.buffer.length;
  
  while(this.offset < length && WHITESPACE.test(this.buffer[this.offset])) {
    ++this.offset;
  }
  
  if(this.offset === length) {
    return;
  }
  
  var start = this.offset;
  
  if(OPERATOR.test(this.buffer[this.offset]) && !OPERATOR.test(this.buffer[this.offset + 1])) {
    ++this.offset;
  }
  else
  if(S_DIGIT.test(this.buffer[this.offset])) {
    while(this.offset < length && (S_COMPLEX_DIGIT.test(this.buffer[this.offset]) || S_LETTER.test(this.buffer[this.offset]))) {
      ++this.offset;
    }
  }
  else
  if(this.offset < length - 1 && S_COMPLEX_DIGIT.test(this.buffer[this.offset]) && S_DIGIT.test(this.buffer[this.offset + 1])) {
    while(this.offset < length && S_COMPLEX_DIGIT.test(this.buffer[this.offset])) {
      ++this.offset;
    }
  }
  else
  if(S_LETTER.test(this.buffer[this.offset])) {
    while(this.offset < length && S_LETTER.test(this.buffer[this.offset])) {
      ++this.offset;
    }
  }
  else
  if(S_BRACKET.test(this.buffer[this.offset])) {
    ++this.offset;
  }
  else {
    while(this.offset < length && !WHITESPACE.test(this.buffer[this.offset])) {
      ++this.offset;
    }
  }
  
  return {
    text: this.buffer.substr(start, this.offset - start),
    loc: {
      start: start,
      end: this.offset
    }
  };
};

Lexer.prototype.getTokenType = function(token) {
  if(!token || !token.text || token.loc.start === undefined || token.loc.end === undefined) {
    throw new ReferenceError('getTokenType() failed: wrong input');
  }
  
  if(token.text === 'i') {
    return {
      type: 'complex',
      value: 1,
      loc: token.loc
    };
  }
  
  if(COMPLEX.test(token.text)) {
    return {
      type: 'complex',
      value: parseFloat(token.text.replace('i', '')),
      loc: token.loc
    };
  }
  
  if(NUMBER.test(token.text)) {
    return {
      type: 'constant',
      value: parseFloat(token.text),
      loc: token.loc
    };
  }
  
  if(LITERAL.test(token.text)) {
    return {
      type: 'literal',
      value: token.text,
      loc: token.loc
    };
  }
  
  if(OPERATOR.test(token.text)) {
    return {
      type: 'operator',
      value: token.text,
      loc: token.loc
    };
  }
  
  if(BRACKET.test(token.text)) {
    return {
      type: 'bracket',
      value: token.text,
      loc: token.loc
    };
  }
  
  var error = new SyntaxError('Expression error: invalid token: `' + token.text + '`');
  error.loc = token.loc;
  
  throw error;
};

Lexer.prototype.tokens = function() {
  var result = [], token = this.getNextToken(),
      currentType, previousType, i, j;
  
  while(token) {
    currentType = this.getTokenType(token);
    
    if(currentType.type === 'bracket' && previousType && previousType.type === 'literal' && ['(', '['].indexOf(currentType.value) !== -1) {
      result[result.length - 1].type = 'func';
    }
    else {
      result.push(currentType);
    }

    previousType = currentType;
    token = this.getNextToken();
  }
  
  
  if(result.length > 1) {
    // unary `-` workaround
    
    if(result[0].type === 'operator' && result[0].value === '-' && ['constant', 'complex'].indexOf(result[1].type !== -1)) {
      result[1].value *= -1;
      result.shift();
    } 
    
    else if(result[0].type === 'operator' && result[0].value === '-') {
      result[1].unaryNegative = true;
      result.shift();
    }
    
    for(i = 1; i < result.length; ++i) {
      if(result[i - 1].value === '(' && result[i].value === '-') {
        if(['constant', 'complex'].indexOf(result[i + 1].type) !== -1) {
          result.splice(i, 1);
          result[i].value *= -1;
        }
        
        else {
          result.splice(i, 1);
          result[i].unaryNegative = true;
        }
      }
    }
  }
  
  return result;
};

module.exports = Lexer;
},{}],3:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true, sub: true, bitwise: true */
/*global module */
'use strict';

var Node  = require('./tree').Node,
    Leaf  = require('./tree').Leaf,
    Utils = require('./utils');

function Optimizer(root) {
  if(!root) {
    throw new ReferenceError('root is not defined!');
  }
  
  this.root_ = root;
}

module.exports = Optimizer;

var rules = [];
Optimizer.prototype.process = function() {
  var i, modified;
  
  do {
    modified = false;
    
    for(i = 0; i < rules.length; ++i) {
      modified = rules[i](this.root_) || modified;
    }
  } while(modified);
};

function applyToChilds(root, callback) {
  var i, modified = false;
  
  if(root.childs) {
    for(i = 0; i < root.childs.length; ++i) {
      modified = callback(root.childs[i]) || modified;
    }
  }
  
  return modified;
}
function uniqueTokens(tokens) {
  var tmp = [], i, j;
  
  for(i = 0; i < tokens.length; ++i) {
    var found = false;
    
    for(j = 0; !found && j < tmp.length; ++j) {
      found = tmp[j].type === tokens[i].type && tmp[j].value === tokens[i].value;
    }
    
    if(!found) {
      tmp.push(tokens[i]);
    }
  }
  
  return tmp;
}

// RULES:

// (2 + 3) * a  -> 5 * a
// 1 + 2        -> 3
rules.push(function constantsAddition(root) {
  var modified = applyToChilds(root, constantsAddition);
  
  if(root.head.type === 'operator' && root.head.value === '+') {
    var i, result = 0, ops = 0;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        result += root.childs[i].head.value;
        root.childs.splice(i, 1);
        ++ops;
        --i;
      }
    }
    
    modified = modified || (ops > 1);
    
    if(ops > 0 || root.childs.length === 0) {
      root.childs.push(new Leaf({ type: 'constant', value: result }));
    }
  }
  
  return modified;
});


// 1 - 2 -> -1
// 2 - 1 -> 1
rules.push(function constantsSubtraction(root) {
  var modified = applyToChilds(root, constantsSubtraction);
  
  if(root.head.type === 'operator' && root.head.value === '-') {
    var i, result = 0, ops = 0;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        if(ops === 0) {
          result = root.childs[i].head.value;
        }
        else {
          result -= root.childs[i].head.value;
        }
        
        root.childs.splice(i, 1);
        ++ops;
        --i;
      }
    }
    
    modified = modified || (ops > 1);
    
    if(ops > 0 || root.childs.length === 0) {
      root.childs.push(new Leaf({ type: 'constant', value: result }));
    }
  }
  
  return modified;
});


// a * 0 -> 0
// 5 * 0 -> 0
rules.push(function multiplicationByZero(root) {
  var modified = applyToChilds(root, multiplicationByZero);
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    var i, hasNull = false;
    
    for(i = 0; i < root.childs.length && !hasNull; ++i) {
      var current = root.childs[i];
      
      if(current.head.type === 'constant' && current.head.value === 0) {
        hasNull = true;
      }
    }
    
    if(hasNull) {
      root.head.type = 'constant';
      root.head.value = 0;
      root.head.loc = undefined;
      root.childs = undefined;
      
      modified = true;
    }
  }
  
  return modified;
});


// b * b * b * a -> b^3 * a
rules.push(function groupingByMultiplication(root) {
  var modified = applyToChilds(root, groupingByMultiplication);
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    var i, result = 0,
        current,
        literals = { };
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'literal') {
        current = root.childs[i].head.value;
        
        if(literals[current]) {
          literals[current]++;
          root.childs.splice(i, 1);
          --i;
        } else {
          literals[current] = 1;
        }
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'literal') {
        var name = root.childs[i].head.value;
        current = root.childs[i];
        
        if(literals[name] > 1) {
          current.head = { type: 'operator', value: '^' };
          
          current.childs = [
            new Leaf({ type: 'literal', value: name }),
            new Leaf({ type: 'constant', value: literals[name] })
          ];
          
          modified = true;
        }
      }
    }
  }
  
  return modified;
});


// 2 / 4 / 2 -> (2 * 2) / 4
// 6 / a / 3 / a -> (6 * 3) / (a * a)
rules.push(function fractionsNormalization(root) {
  var modified = applyToChilds(root, fractionsNormalization);
  
  if(root.head.type === 'operator' && root.head.value === '/') {
    var i, lhs = [], rhs = [];
    
    for(i = 0; i < root.childs.length; ++i) {
      if(i % 2 === 0) {
        lhs.push(root.childs[i]);
      }
      else {
        rhs.push(root.childs[i]);
      }
    }
    
    modified = modified || lhs.length > 1 || rhs.length > 1;
    
    if(lhs.length > 1) {
      lhs = new Node({
        type: 'operator',
        value: '*'
      }, lhs);
    }
    else {
      lhs = lhs[0];
    }
    
    if(rhs.length > 1) {
      rhs = new Node({
        type: 'operator',
        value: '*'
      }, rhs);
    }
    else {
      rhs = rhs[0];
    }
    
    root.childs = [ lhs, rhs ];
  }
  
  return modified;
});


// (a * a) / (b * a) -> a / b
rules.push(function fractionsReduction(root) {
  var modified = applyToChilds(root, fractionsReduction);
  
  if(root.head.type === 'operator' && root.head.value === '/') {
    var lhs = uniqueTokens(root.childs[0].getSeparableSymbols()),
        rhs = uniqueTokens(root.childs[1].getSeparableSymbols()),
        diff = [], i, j;
    
    for(i = 0; i < lhs.length; ++i) {
      var found = false;
      
      for(j = 0; !found && j < rhs.length; ++j) {
        found = rhs[j].type === lhs[i].type && rhs[j].value === lhs[i].value;
      }
      
      if(found) {
        diff.push(lhs[i]);
      }
    }
    
    if(diff.length > 0) {
      for(i = 0; i < diff.length; ++i) {
        var obj = JSON.parse(JSON.stringify(diff[i]));
        
        if(!root.childs[0].divide(root, obj)) {
          throw new Error('Internal Error: fractionsReduction(0)');
        }
        if(!root.childs[1].divide(root, obj)) {
          throw new Error('Internal Error: fractionsReduction(1)');
        }
      }
      
      modified = true;
    }
  }
  
  return modified;
});


// a * 1 -> a
// a / 1 -> a
// a ^ 1 -> a
// a + 0 -> a
rules.push(function unnecessaryConstantStrip(root) {
  var modified = applyToChilds(root, unnecessaryConstantStrip),
      i;
  
  if(root.head.type === 'operator') {
    
    if(root.head.value === '/' && root.childs.length === 2) {
      if(root.childs[1].head.type === 'constant' && root.childs[1].head.value === 1) {
        root['__proto__'] = root.childs[0]['__proto__'];
        root.head = root.childs[0].head;
        root.childs = root.childs[0].childs;
        
        modified = true;
      }
      
      else if(root.childs[0].head.type === 'constant' && root.childs[0].head.value === 0) {
        root['__proto__'] = Leaf.prototype;
        root.head.type = 'constant';
        root.head.value = 0;
        root.childs = undefined;
        
        modified = true;
      }
      
      else if(root.childs[1].head.type === 'constant' && root.childs[1].head.value === 0) {
        throw new Error('Expression Error: division by zero!');
      }
    }
    
    else if(root.head.value === '*') {
      
      for(i = 0; i < root.childs.length; ++i) {
        if(root.childs[i].head.type === 'constant' && root.childs[i].head.value === 1) {
          root.childs.splice(i, 1);
          --i;
          
          modified = true;
        }
      }
    }
    
    else if(['+', '-'].indexOf(root.head.value) !== -1) {
      for(i = 0; i < root.childs.length; ++i) {
        if(root.childs[i].head.type === 'constant' && root.childs[i].head.value === 0) {
          root.childs.splice(i, 1);
          --i;
          
          modified = true;
        }
      }
    }
    
    else if(root.head.value === '^' && root.childs[1]) {
      if(root.childs[1].head.type === 'constant' && root.childs[1].head.value === 1) {
        root['__proto__'] = root.childs[0]['__proto__'];
        root.head = root.childs[0].head;
        root.childs = root.childs[0].childs;
        
        modified = true;
      }
    }
  }
  
  return modified;
});


// (2 + 3) * 5  -> 25
// 2 * 1        -> 2
rules.push(function constantsMultiplication(root) {
  var modified = applyToChilds(root, constantsMultiplication);
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    var i, result = 1, ops = 0;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        result *= root.childs[i].head.value;
        root.childs.splice(i, 1);
        ++ops;
        --i;
      }
    }
    
    modified = modified || (ops > 1);
    
    if(ops > 0 || root.childs.length === 0) {
      root.childs.push(new Leaf({ type: 'constant', value: result }));
    }
  }
  
  return modified;
});


// 2 / 4 -> 1 / 2
// 14 / 21 -> 2 / 3
rules.push(function fractionConstantsReduction(root) {
  var modified = applyToChilds(root, fractionConstantsReduction);
  
  if(root.head.type === 'operator' && root.head.value === '/' && root.childs.length === 2) {
    var lhs = root.childs[0].getSeparableSymbols(true),
        rhs = root.childs[1].getSeparableSymbols(true),
        lk, rk, k;
    
    lhs = lhs.filter(function(e) {
      return e.type === 'constant';
    });
    rhs = rhs.filter(function(e) {
      return e.type === 'constant';
    });
    
    lk = lhs.reduce(function(prev, e) { return prev * e.value; }, 1);
    rk = rhs.reduce(function(prev, e) { return prev * e.value; }, 1);
    
    k = Utils.gcd(Math.abs(lk), Math.abs(rk));
    
    if(k !== 1) {
      var obj = {
        type: 'constant',
        value: k
      };
      
      if(!root.childs[0].divide(root, obj)) {
        throw new Error('Internal Error: fractionConstantsReduction(0)');
      }
      if(!root.childs[1].divide(root, obj)) {
        throw new Error('Internal Error: fractionConstantsReduction(1)');
      }
      
      return true;
    }
  }
  
  return modified;
});


// 2 * a + 3 * a -> 5 * a
rules.push(function groupLiterals(root) {
  var modified = applyToChilds(root, groupLiterals),
      i, pair, current,
      literals = { };
  
  if(root.head.type === 'operator' && ['+', '-'].indexOf(root.head.value) !== -1) {
    for(i = 0; i < root.childs.length; ++i) {
      pair = root.childs[i].getSimpleMultPair();
      if(pair) {
        if(literals[pair.literal]) {
          if(root.head.value === '+') {
            literals[pair.literal] += pair.constant;
          }
          else {
            literals[pair.literal] -= pair.constant;
          }
          
          root.childs.splice(i, 1);
          modified = true;
          --i;
        } else {
          literals[pair.literal] = pair.constant;
        }
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      pair = root.childs[i].getSimpleMultPair();
      
      if(pair) {
        current = root.childs[i].childs;
        current[current[0].head.type === 'constant' ? 0 : 1].head.value = literals[pair.literal];
      }
    }
  }
  
  return modified;
});


// 2/3 + 1/3 -> 3/3
// 1 / 7 + 1 / 3 -> 10 / 21
rules.push(function commonDenominator(root) {
  var modified = applyToChilds(root, commonDenominator);
  
  if(root.head.type === 'operator' && ['+', '-'].indexOf(root.head.value) !== -1) {
    var fractions = [], result = [], denominator = [],
        i, current, constants;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'operator' && root.childs[i].head.value === '/') {
        fractions.push(root.childs[i]);
        root.childs.splice(i, 1);
        --i;
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        result.push(root.childs[i]);
        root.childs.splice(i, 1);
        --i;
      }
    }
    
    if(fractions.length + result.length < 2) {
      root.childs = root.childs.concat(fractions);
      root.childs = root.childs.concat(result);
      return modified;
    }
    
    constants = result.length;
    for(i = 0; i < fractions.length; ++i) {
      result.push(fractions[i].childs[0]);
      denominator.push(fractions[i].childs[1]);
    }
    
    denominator = new Node({
      type: 'operator',
      value: '*'
    }, denominator);
    
    for(i = 0; i < constants; ++i) {
      current = [ denominator.clone(), result[i] ];
      
      result[i] = new Node({
        type: 'operator',
        value: '*'
      }, current);
    }
    for(i = constants; i < result.length; ++i) {
      current = [ denominator.clone(), result[i] ];
      
      if(!current[0].divide(current, fractions[i - constants].childs[1].head)) {
        throw new Error('Internal Error: commonDenominator(0)');
      }
      
      result[i] = new Node({
        type: 'operator',
        value: '*'
      }, current);
    }
    
    result = new Node({
      type: root.head.type,
      value: root.head.value
    }, result);
    
    root.childs.push(new Node({
      type: 'operator',
      value: '/'
    }, [result, denominator]).reduce());
    
    return true;
  }
  
  return modified;
});


// 2 ^ 2 -> 4
// 4 ^ (1/2) -> 2
// 2 ^ (-1) -> 1/2
rules.push(function constantsPower(root) {
  var modified = applyToChilds(root, constantsPower);
  
  if(root.head.type === 'operator' && root.head.value === '^') {
    if(root.childs[0].head.type === 'constant' && root.childs[1].head.type === 'constant') {
      if(root.childs[1].head.value < 0 && root.childs[1].head.value === (root.childs[1].head.value|0)) {
        var oldRoot = root.clone();
        oldRoot.childs[1].head.value *= -1;
        
        root.head.value = '/';
        root.childs = [
          new Leaf({
            type: 'constant',
            value: 1
          }),
          
          oldRoot
        ];
        
        return true;
      }
    }
    
    if(root.childs[0].head.type === 'constant' && root.childs[1].isConstant()) {
      var constValue = root.childs[1].getConstantValue();
      
      root.head.type = 'constant';
      root.head.value = Math.round(100 * Math.pow(root.childs[0].head.value, constValue)) / 100;
      root.childs = undefined;
      root['__proto__'] = Leaf.prototype;
      
      modified = true;
    }
  }
  
  return modified;
});


// sqrt(4) -> 2
rules.push(function constantsSquareRoot(root) {
  var modified = applyToChilds(root, constantsSquareRoot);
  
  if(root.head.type === 'func' && root.head.value === 'sqrt' && root.childs[0].isConstant()) {
    var constValue = root.childs[0].getConstantValue();
      
    root.head.type = 'constant';
    root.head.value = Math.round(100 * Math.sqrt(constValue)) / 100;
    root.childs = undefined;
    root['__proto__'] = Leaf.prototype;
  }
  
  return modified;
});


rules.push(function stripDepth(root) {
  var modified = applyToChilds(root, stripDepth),
      i;
  
  if(root.head.type === 'operator' && root.childs.length === 1) {
    root.head = root.childs[0].head;
    root['__proto__'] = root.childs[0]['__proto__'];
    root.childs = root.childs[0].childs;
    modified = true;
  }
  
  if(root.head.type === 'operator' && root.childs.length === 0) {
    root.head = {
      type: 'constant',
      value: 0
    };
    root['__proto__'] = Leaf.prototype;
    root.childs = undefined;
    modified = true;
  }
  
  if(root.childs) {
    for(i = 0; i < root.childs.length; ++i) {
      var current = root.childs[i];
      if(current.head.type === 'operator' && current.childs && current.childs.length === 0) {
        root.childs.splice(i, 1);
        --i;
      }
    }
  }
  
  return modified;
});
},{"./tree":4,"./utils":5}],4:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';
var Utils = require('./utils');

function Node(head, childs) {
  this.head = head;
  this.childs = childs;
}

function Leaf(head) {
  this.head = head;
  this.childs = undefined;
}

Node.prototype.reduce = function() {
  var i;
  
  for(i = 0; i < this.childs.length; ++i) {
    this.childs[i].reduce();
    
    if(this.childs[i].head.type === 'operator' && this.head.type === 'operator' && this.childs[i].head.value === this.head.value) {
      this.childs = this.childs.slice(0, i).concat(this.childs[i].childs).concat(this.childs.slice(i + 1));
    }
  }
  
  return this;
};

Leaf.prototype.reduce = function() { return this; };

Node.prototype.getSeparableSymbols = function(isExtended) {
  if(this.head.type !== 'operator') {
    return [];
  }
  
  var comparer = function(obj, e) {
    return obj.type === e.type && obj.value === e.value;
  };
  var comparerExt = function(e) {
    return e.type === 'constant';
  };
  
  var getAllSymbols = function(node) {
    var tmp = [], result = [], i;
    
    for(i = 0; i < node.childs.length; ++i) {
      tmp = tmp.concat(node.childs[i].getSeparableSymbols(isExtended));
    }
    
    for (i = 0; i < tmp.length; i++) {
      if(!result.some(comparer.bind(undefined, tmp[i]))) {
        result.push(tmp[i]);
      }
    }
    
    return result;
  };
  var getSharedSymbols = function(node) {
    var tmp = [], i;
    
    for(i = 0; i < node.childs.length; ++i) {
      tmp.push(node.childs[i].getSeparableSymbols());
    }
    
    return tmp[0].filter(function(e) {
      for(i = 1; i < tmp.length; ++i) {
        if(!tmp[i].some(comparer.bind(undefined, e))) {
          return false;
        }
      }
      
      return true;
    });
  };
  var getSharedExtendedSymbols = function(node) {
    var tmp = [], i;
    
    for(i = 0; i < node.childs.length; ++i) {
      tmp.push(node.childs[i].getSeparableSymbols(true).filter(comparerExt));
      if(tmp[i].length !== 1) {
        return [];
      }
      
      tmp[i] = tmp[i][0];
    }
    
    if(tmp.length === 0) {
      return [];
    }
    
    var result = JSON.parse(JSON.stringify(tmp[0]));
    for(i = 1; i < tmp.length; ++i) {
      result.value = Utils.gcd(Math.abs(result.value), Math.abs(tmp[i].value));
    }
    
    return [ result ];
  };
  
  if(['-', '+'].indexOf(this.head.value) !== -1) {
    if(!isExtended) {
      return getSharedSymbols(this);
    }
    else {
      return getSharedExtendedSymbols(this);
    }
  }
  else {
    return getAllSymbols(this, isExtended);
  }
};

Leaf.prototype.getSeparableSymbols = function() {
  return [ this.head ];
};

Node.prototype.divide = function(root, symbol) {  
  var i = 0, divided = false;
  
  if(this.head.type === 'operator') {
    
    if(['+', '-'].indexOf(this.head.value) !== -1) {
      divided = true;
      
      while(i < this.childs.length) {
        divided = this.childs[i].divide(this, symbol) && divided;
        ++i;
      }
      
      return divided;
    }
    
    else if(this.head.value === '^' && this.childs[0].head.type === symbol.type && this.childs[0].head.value === symbol.value) {
      this.childs[1].head.value -= 1;
      return true;
    }
    
    else {
      while(i < this.childs.length && !divided) {
        divided = this.childs[i].divide(this, symbol);
        ++i;
      }
      
      return divided;
    }
  }
};

Leaf.prototype.divide = function(root, symbol) {
  if(this.head.type !== symbol.type) {
    return false;
  }
  
  if(this.head.type === 'constant' && (this.head.value % symbol.value) === 0) {
    this.head.value /= symbol.value;
    return true;
  }
  
  if(this.head.type === 'literal' && this.head.value === symbol.value) {
    var i = root.childs.indexOf(this);
    root.childs.splice(i, 1);
    return true;
  }
  
  return false;
};

Node.prototype.getSimpleMultPair = function() {
  if(this.head.type !== 'operator' || this.head.value !== '*') {
    return false;
  }
  
  if(this.childs.length !== 2) {
    return false;
  }
  
  if(this.childs[0].head.type === 'constant' && this.childs[1].head.type === 'literal') {
    return {
      literal: this.childs[1].head.value,
      constant: this.childs[0].head.type
    };
  }
  
  else if(this.childs[0].head.type === 'literal' && this.childs[1].head.type === 'constant') {
    return {
      literal: this.childs[0].head.value,
      constant: this.childs[1].head.value
    };
  }
};

Leaf.prototype.getSimpleMultPair = function() {
  return false;
};

Node.prototype.clone = function() {
  var childs = new Array(this.childs.length),
      i;
  
  for(i = 0; i < this.childs.length; ++i) {
    childs[i] = this.childs[i].clone();
  }
  
  return new Node({
    type: this.head.type,
    value: this.head.value,
    loc: this.head.loc
  }, childs);
};

Leaf.prototype.clone = function() {
  return new Leaf({
    type: this.head.type,
    value: this.head.value,
    loc: this.head.loc
  });
};

Node.prototype.isConstant = function() {
  var result = true,
      i;
  
  for(i = 0; i < this.childs.length; ++i) {
    result = result && this.childs[i].isConstant();
  }
  
  return result;
};

Leaf.prototype.isConstant = function() {
  return this.head.type === 'constant'; 
};

Node.prototype.getConstantValue = function() {
  var result;
  
  if(this.head.type === 'operator') {
    var i;
    
    if(this.head.value === '+') {
      result = 0;
      for(i = 0; i < this.childs.length; ++i) {
        result += this.childs[i].getConstantValue();
      }
      
      return result;
    }
    
    if(this.head.value === '-') {
      result = this.childs[0].getConstantValue();
      for(i = 1; i < this.childs.length; ++i) {
        result -= this.childs[i].getConstantValue();
      }
      
      return result;
    }
    
    if(this.head.value === '*') {
      result = 1;
      for(i = 0; i < this.childs.length; ++i) {
        result *= this.childs[i].getConstantValue();
      }
      
      return result;
    }
    
    if(this.head.value === '/') {      
      return this.childs[0].getConstantValue() / this.childs[1].getConstantValue();
    }
    
    if(this.head.value === '^') {      
      return Math.pow(this.childs[0].getConstantValue(), this.childs[1].getConstantValue());
    }
  }
  
  else {
    throw new Error('TODO `getConstantValue` for non-operators');
  }
  
  
  
  return result;
};

Leaf.prototype.getConstantValue = function() {
  return this.head.type === 'constant' ? this.head.value : 0;
};

Node.prototype.serializeTeX = function(priority) {
  priority === priority || -1;
  
  var result = '',
      currentPriority = Utils.getOperationPriority(this.head.value);
  
  if(this.head.type === 'operator' && ['-', '+', '*', '^'].indexOf(this.head.value) !== -1) {
    result = this.childs.map(function(e) {
      return e.serializeTeX(currentPriority);
    }).join(' ' + this.head.value + ' ');
    
    if(currentPriority < priority) {
      return '(' + result + ')';
    }
    else {
      return result;
    }
  }
  
  if(this.head.type === 'operator' && this.head.value === '/') {
    return '\\frac{ ' + this.childs[0].serializeTeX() + ' }{ ' + this.childs[1].serializeTeX() + ' }';
  }
  
  if(this.head.type === 'func' && this.head.value === 'sqrt') {    
    return '\\sqrt{ ' + this.childs[0].serializeTeX() + ' }';
  }
  
  if(this.head.type === 'func') {
    var prefix = '';
    if(['sin', 'cos'].indexOf(this.head.value) !== -1) {
      prefix = '\\';
    }
    
    return prefix + this.head.value + '( ' + this.childs[0].serializeTeX() + ' )';
  }
};

Leaf.prototype.serializeTeX = function() {
  if(this.head.type === 'complex') {
    return this.head.value + 'i ';
  }
  
  return this.head.value;
};

module.exports.Node = Node;
module.exports.Leaf = Leaf;
},{"./utils":5}],5:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

module.exports.gcd = function gcd(n1, n2) {
  if(n1 === 0 || n2 === 0) {
    return 1;
  }
  
  if(n1 === n2) {
    return n1;
  }
  
  if(n1 > n2) {
    return gcd(n1 - n2, n2);
  }
  else {
    return gcd(n1, n2 - n1);
  }
};

module.exports.getOperationPriority = function(value) {
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
};
},{}]},{},[1,2,3,4,5])