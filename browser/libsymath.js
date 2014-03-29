require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Focm2+":[function(require,module,exports){
(function (process,__dirname){
/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module, require, __dirname */
'use strict';

if(process.env.YOURPACKAGE_COVERAGE) {
  module.exports.Lexer = require(__dirname + '/src-cov/lexer.js');
  module.exports.Expression = require(__dirname + '/src-cov/expression.js');
}
else if(typeof window === 'undefined') {
  module.exports.Lexer = require(__dirname + '/src/lexer.js');
  module.exports.Expression = require(__dirname + '/src/expression.js');
}
else {
  module.exports.Lexer = require('./src/lexer.js');
  module.exports.Expression = require('./src/expression.js');
}
}).call(this,require("/home/l/Desktop/libsymath-js/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),"/")
},{"./src/expression.js":4,"./src/lexer.js":5,"/home/l/Desktop/libsymath-js/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":3}],"libsymath":[function(require,module,exports){
module.exports=require('Focm2+');
},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
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
},{"./lexer":5,"./nicer":6,"./optimizer":7,"./tree":8,"./utils":9}],5:[function(require,module,exports){
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
    while(this.offset < length && (S_LETTER.test(this.buffer[this.offset]) || S_DIGIT.test(this.buffer[this.offset]))) {
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
},{}],6:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true, sub: true, bitwise: true */
/*global module */
'use strict';

var Optimizer = require('./optimizer.js');

function Nicer(root, type) {
  if(type !== 'expanced' && type !== 'factorized') {
    throw new Error('wrong type!');
  }
  
  this.root_ = root;
  this.type_ = type;
}

Nicer.prototype.nice = function() {
  if(this.type_ === 'expanced') {
    this.root_.niceExpanced();
  }
  else {
    this.root_.niceFactorized();
  }
  
  var optimizer = new Optimizer(this.root_, true);
  optimizer.process();
  
  this.sort(this.root_);
};

Nicer.prototype.sort = function(root) {
  var i;
  
  if(root.childs) {
    for(i = 0; i < root.childs.length; ++i) {
      this.sort(root.childs[i]);
    }
    root.calcPowerValue();
    
    if(/\+|\*/.test(root.head.value)) {
      root.childs = root.childs.sort(function(lhs, rhs) {
        if(lhs.head.type === 'literal' && rhs.head.type === 'literal') {
          return lhs.head.value.localeCompare(rhs.head.value);
        }
        
        if(root.head.value === '*') {
          return lhs.power_ - rhs.power_;
        }
        else {
          return rhs.power_ - lhs.power_;
        }
      });

      var funcs = [];
      for(i = 0; i < root.childs.length; ++i) {
        if(root.childs[i].head.type === 'func') {
          funcs.push(root.childs[i]);
          root.childs.splice(i, 1);
          --i;
        }
      }

      root.childs = root.childs.concat(funcs);
    }
  }
  else {
    root.calcPowerValue();
  }
};

module.exports = Nicer;
},{"./optimizer.js":7}],7:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true, sub: true, bitwise: true */
/*global module */
'use strict';

var Node  = require('./tree').Node,
    Leaf  = require('./tree').Leaf,
    Utils = require('./utils');

function Optimizer(root, softMode) {
  if(!root) {
    throw new ReferenceError('root is not defined!');
  }
  
  this.root_ = root;
  this.soft_ = softMode || false;
}

module.exports = Optimizer;

var rules = [];
Optimizer.prototype.process = function() {
  var i, modified;
  
  do {
    modified = false;
    this.root_.reduce();
    
    for(i = 0; i < rules.length; ++i) {
      modified = rules[i](this.root_, this.soft_) || modified;
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
function treeComparer(e1, e2) {
  return e1.compare(e2);
}

// RULES:

// (2 + 3) * a  -> 5 * a
// 1 + 2        -> 3
rules.push(function constantsAddition(root) {
  var modified = applyToChilds(root, constantsAddition);
  
  if(root.head.type === 'operator' && root.head.value === '+') {
    var i, result = 0, ops = 0, first;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        result += root.childs[i].head.value;
        if(ops > 0) {
          root.childs.splice(i, 1);
          --i;
        }
        else {
          first = i;
        }
        ++ops;
      }
    }
    
    modified = modified || (ops > 1);
    
    if(ops > 0 || root.childs.length === 0) {
      root.childs[first].head.value = result;
    }
  }
  
  return modified;
});


// 1 - 2 -> -1
// 2 - 1 -> 1
rules.push(function constantsSubtraction(root) {
  var modified = applyToChilds(root, constantsSubtraction);
  
  if(root.head.type === 'operator' && root.head.value === '-') {
    var i, result = 0, ops = 0, first;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'constant') {
        if(ops === 0) {
          result = root.childs[i].head.value;
        }
        else {
          result -= root.childs[i].head.value;
        }
        
        if(ops > 0) {
          root.childs.splice(i, 1);
          --i;
        }
        else {
          first = i;
        }
        ++ops;
      }
    }
    
    modified = modified || (ops > 1);
    
    if(ops > 0 || root.childs.length === 0) {
      root.childs[first].head.value = result;
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
      root['__proto__'] = Leaf.prototype;
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
          current['__proto__'] = Node.prototype;
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


// (2 / 4) / 2 -> 2 / (4 * 2)
// (6 / a) / (3 / a) -> (6 * a) / (a * 3)
rules.push(function fractionsNormalization(root) {
  var modified = applyToChilds(root, fractionsNormalization);
  
  if(root.head.type === 'operator' && root.head.value === '/') {
    if(root.childs.length == 2 && (root.childs[0].head.value === '/' || root.childs[1].head.value === '/')) {
      var lhs = [], rhs = [];
      
      if(root.childs[0].head.value === '/') {
        lhs.push(root.childs[0].childs[0]);
        rhs.push(root.childs[0].childs[1]);
      }
      else {
        lhs.push(root.childs[0]);
      }
      
      if(root.childs[1].head.value === '/') {
        lhs.push(root.childs[1].childs[1]);
        rhs.push(root.childs[1].childs[0]);
      }
      else {
        rhs.push(root.childs[1]);
      }
      
      lhs = lhs.filter(function(e) { return e !== undefined; });
      rhs = rhs.filter(function(e) { return e !== undefined; });
      
      root.childs = [
        new Node({
          type: 'operator',
          value: '*'
        }, lhs),
        
        new Node({
          type: 'operator',
          value: '*'
        }, rhs)
      ];
      
      return true;
    }
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
  
  if(root.head.type === 'operator' && ['+', '-'].indexOf(root.head.value) !== -1 && root.childs.length != 1) {
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
      
      else if(root.childs[i].head.type === 'literal') {
        if(root.head.value === '+') {
          if(literals[root.childs[i].head.value]) {
            literals[root.childs[i].head.value] += 1;
            
            root.childs.splice(i, 1);
            --i;
            modified = true;
          }
          else {
            literals[root.childs[i].head.value] = 1;
          }
        } 
        else {
          if(literals[root.childs[i].head.value]) {
            literals[root.childs[i].head.value] -= 1;
            
            root.childs.splice(i, 1);
            --i;
            modified = true;
          }
          else {
            literals[root.childs[i].head.value] = modified ? -1 : 1;
          }
        }
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      pair = root.childs[i].getSimpleMultPair();
      
      if(pair) {
        current = root.childs[i].childs;
        current[current[0].head.type === 'constant' ? 0 : 1].head.value = literals[pair.literal];
      }
      else if(root.childs[i].head.type === 'literal') {
        if(literals[root.childs[i].head.value] === 1) {
          continue;
        }

        root.childs[i] = new Node({ type: 'operator', value: '*' }, [
          new Leaf({ type: 'constant', value: literals[root.childs[i].head.value] }),
          root.childs[i]
        ]);
        modified = true;
      }
    }
    

    /*for(i in literals) {
      if(literals[i] !== 1) {
        root.childs.push(new Node({ type: 'operator', value: '*' }, [
          new Leaf({ type: 'constant', value: literals[i] }),
          new Leaf({ type: 'literal', value: i })
        ]));
      }
      else {
        root.childs.push(new Leaf({ type: 'literal', value: i }));
      }
    }*/
  }
  
  return modified;
});


// a*b*c + a*b*c -> 2*a*b*c
rules.push(function groupSame(root) {
  var modified = applyToChilds(root, groupSame),
      i, current, literals,
      parts = new Utils.Map(treeComparer);
  
  if(root.head.type === 'operator' && ['+', '-'].indexOf(root.head.value) !== -1) {
    for(i = 0; i < root.childs.length; ++i) {      
      current = parts.get(root.childs[i]);
      if(current) {
        parts.set(root.childs[i], (root.head.value === '+' ? current + 1 : current - 1));
        root.childs.splice(i, 1);
        --i;
      }
      else {
        parts.set(root.childs[i], 1);
      }
    }

    for(i = 0; i < root.childs.length; ++i) {
      current = parts.get(root.childs[i]);
      if(current === 1) {
        continue;
      }
      if(current !== 0) {
        root.childs[i] = new Node({
          type: 'operator',
          value: '*'
        }, [ new Leaf({ type: 'constant', value: current }), root.childs[i] ]);
      }
      else {
        root.childs.splice(i, 1);
        --i;
      }
    }
  }
  
  return modified;
});


// 2/3 + 1/3 -> 3/3
// 1 / 7 + 1 / 3 -> 10 / 21
rules.push(function commonDenominator(root, soft) {
  if(soft) {
    return false;
  }
  
  var modified = applyToChilds(root, commonDenominator);
  
  if(root.head.type === 'operator' && ['+', '-'].indexOf(root.head.value) !== -1) {
    var fractions = [], result = [], denominator = [],
        i, current, first, found;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'operator' && root.childs[i].head.value === '/') {
        if(root.childs[i].childs.length < 2 || root.childs[i].childs[1] instanceof Node) {
          return modified;
        }
        
        found = true;
      }
    }
    
    if(!found) {
      return modified;
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'operator' && root.childs[i].head.value === '/') {
        if(!first) {
          first = 'fraction';
        }
        
        fractions.push(root.childs[i]);
        root.childs.splice(i, 1);
        --i;
        continue;
      }
      
      if(root.childs[i].head.type === 'constant') {
        if(!first) {
          first = 'constant';
        }
        
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
    
    if(first === 'constant') {
      for(i = 0; i < fractions.length; ++i) {
        denominator.push(fractions[i].childs[1]);
      }
    }
    else {
      denominator = fractions.map(function(e) {
        return e.childs[1];
      }).concat(denominator);
    }
    
    denominator = new Node({
      type: 'operator',
      value: '*'
    }, denominator);
    
    for(i = 0; i < result.length; ++i) {
      current = [ denominator.clone(), result[i] ];

      result[i] = new Node({
        type: 'operator',
        value: '*'
      }, current);
    }
    
    if(first === 'constant') {      
      for(i = 0; i < fractions.length; ++i) {
        current = [ denominator.clone(), fractions[i].childs[0] ];
        
        if(!current[0].divide(current, fractions[i].childs[1].head)) {
          throw new Error('Internal Error: commonDenominator(0)');
        }
        
        result.push(new Node({
            type: 'operator',
            value: '*'
          }, current));
      }
    }
    else {
      result = fractions.map(function(e) {
        current = [ denominator.clone(), e.childs[0] ];
        
        if(!current[0].divide(current, e.childs[1].head)) {
          throw new Error('Internal Error: commonDenominator(0)');
        }

        return new Node({
            type: 'operator',
            value: '*'
          }, current);
      }).concat(result);
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


// sqrt(a) -> a^(1/2)
rules.push(function convertSqrtToPower(root) {
  var modified = applyToChilds(root, convertSqrtToPower);
  
  if(root.head.type === 'func' && root.head.value === 'sqrt') {
    root.head.type = 'operator';
    root.head.value = '^';
    
    var power = new Node({ type: 'operator', value: '/' }, [
      new Leaf({ type: 'constant', value: 1 }),
      new Leaf({ type: 'constant', value: 2 })
    ]);
    
    root.childs = [ root.childs[0], power ];
    
    return true;
  }
  
  return modified;
});


// (a^2) ^ b -> a^(2*b)
rules.push(function powersCascade(root) {
  var modified = applyToChilds(root, powersCascade);
  
  if(root.head.type === 'operator' && root.head.value === '^' && root.childs.length > 2) {
    root.childs[1] = new Node({ type: 'operator', value: '*' }, root.childs.slice(1));
    root.childs.splice(2);
    
    return true;
  }
  
  return modified;
});


// b^3 * b^2 -> b^5
// b^3 * b   -> b^4
rules.push(function powersGroup(root) {
  var modified = applyToChilds(root, powersGroup),
      i, first, powers = new Utils.Map(treeComparer), current, curPower;
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    for(i = 0; i < root.childs.length; ++i) {
      current = root.childs[i];
      
      if(current.head.type === 'operator' && current.head.value === '^') {
        curPower = powers.get(current.childs[0]);
        if(curPower) {
          curPower.push(current.childs[1]);
          root.childs.splice(i, 1);
          --i;
        }
        else {
          powers.set(current.childs[0], [ current.childs[1] ]);
        }
      }
      else if(current.head.type === 'literal') {
        curPower = powers.get(current);
        if(curPower) {
          curPower.push(new Leaf({ type: 'constant', value: 1 }));
          root.childs.splice(i, 1);
          --i;
        }
        else {
          powers.set(current, [ new Leaf({ type: 'constant', value: 1 }) ]);
        }
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      current = root.childs[i];
      
      if(current.head.type === 'operator' && current.head.value === '^') {
        curPower = powers.get(current.childs[0]);
        
        if(curPower.length > 1) {
          current.childs[1] = new Node({ type: 'operator', value: '+' }, curPower);
          modified = true;
        }
      }
      else if(current.head.type === 'literal') {
        curPower = powers.get(current);
        
        if(curPower.length > 1) {
          var power = new Node({ type: 'operator', value: '+' }, curPower);

          root.childs[i] = new Node({type: 'operator', value: '^' }, [root.childs[i], power]);
          modified = true;
        }
      }
    }
  }
  
  return modified;
});


// (1/3) * (1/2)
rules.push(function fractionsMultiplier(root) {
  var modified = applyToChilds(root, fractionsMultiplier);
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    var numerator = [], denominator = [],
        i, current, found;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'operator' && root.childs[i].head.value === '/') {
        found = true;
        break;
      }
    }
    if(!found) {
      return modified;
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      current = root.childs[i];
      
      if(current.head.type === 'operator' && current.head.value === '/') {
        if(current.childs.length > 2) {
          // should perform new optimizer iteration and normalize fraction first
          return true;
        }
        
        numerator.push(current.childs[0]);
        denominator.push(current.childs[1]);
      }
      
      if(current.head.type === 'constant' || current.head.type === 'literal' || current.head.type === 'complex') {
        numerator.push(current);
      }
    }
    
    root.head.type = 'operator';
    root.head.value = '/';
    
    root.childs = [
      new Node({ type: 'operator', value: '*' }, numerator),
      new Node({ type: 'operator', value: '*' }, denominator)
    ];
    
    return true;
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
},{"./tree":8,"./utils":9}],8:[function(require,module,exports){
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
    
    if(this.childs[i].head.type === 'operator' && this.head.type === 'operator' && this.childs[i].head.value === this.head.value && this.childs[i].head.value != '/') {
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
  else if(this.head.value === '/') {
    return this.childs[0].getSeparableSymbols(isExtended);
  }
  else {
    return getAllSymbols(this, isExtended);
  }
};
Leaf.prototype.getSeparableSymbols = function() {
  return [ this.head ];
};

Node.prototype.divide = function(root, symbol) {
  symbol = JSON.parse(JSON.stringify(symbol));
  
  if(this.divideDry_(symbol) !== true) {
    return false;
  }
  
  if(this.divide_(symbol) !== true) {
    return false;
  }
  
  return true;
};
Leaf.prototype.divide = function(root, symbol) {
  symbol = JSON.parse(JSON.stringify(symbol));
  
  if(this.divideDry_(symbol) !== true) {
    return false;
  }
  
  if(this.divide_(symbol) !== true) {
    return false;
  }
  
  return true;
};

Node.prototype.divideDry_ = function(symbol) {
  if(symbol.value === 1) { return true; }
  
  var values = [], result, i;
  
  if(['+', '-'].indexOf(this.head.value) !== -1) {
    for(i = 0; i < this.childs.length; ++i) {
      values.push(this.childs[i].divideDry_(symbol));
    }

    result = true;
    
    for(i = 0; i < values.length; ++i) {
      if(values[i] === false) {
        return false;
      }
      if(values[i] === true) {
        continue;
      }
      
      if(result === true) {
        result = values[i];
      }
      else {
        result = Utils.gcd(result, values[i]);
      }
    }
    
    return result;
  }
  
  if(this.head.value === '/') {
    result = this.childs[0].divideDry_(symbol);
    return result;
  }
  
  if(this.head.value === '*') {
    for(i = 0; i < this.childs.length; ++i) {
      values.push(this.childs[i].divideDry_(symbol));
    }

    result = 1;
    
    for(i = 0; i < values.length; ++i) {
      if(values[i] === false) {
        continue;
      }
      if(values[i] === true) {
        return true;
      }
      
      result *= values[i];
    }
    
    
    if(result === true || result >= symbol.value) {
      return true;
    }
    return result;
  }
  
  if(this.head.value === '^') {
    return this.childs[0].head.type === symbol.type && this.childs[0].head.value === symbol.value;
  }
};
Leaf.prototype.divideDry_ = function(symbol) {
  if(symbol.value === 1) { return true; }
  
  if(this.head.type !== symbol.type) {
    return false;
  }
  
  if(this.head.type === 'constant' && symbol.type === 'constant') {
    var current = Utils.gcd(this.head.value, symbol.value);
    if(current === 1) { return false; }
    if(current === symbol.value) { return true; }
    return current;
  }
  
  if(this.head.type === 'literal' && this.head.value === symbol.value) {
    return true;
  }
};

Node.prototype.divide_ = function(symbol) {
  if(symbol.value === 1) { return true; }
  
  var values = [], result, current, tmp, i;
  
  if(['+', '-'].indexOf(this.head.value) !== -1) {
    current = this.divideDry_(symbol);
    if(current === false) {
      return false;
    }
    if(current !== true) {
      symbol.value /= current;
      symbol = JSON.parse(JSON.stringify(symbol));
      symbol.value = current;
    }
    
    for(i = 0; i < this.childs.length; ++i) {
      this.childs[i].divide_(symbol);
    }
    
    /*if(current !== true) {
      symbol.value = current;
    }*/
    return current;
  }
  
  if(this.head.value === '/') {
    result = this.childs[0].divide_(symbol);
    if(result !== true && result !== false) {
      symbol.value /= result;
    }
    return result;
  }
  
  if(this.head.value === '*') {
    current = this.divideDry_(symbol);
    if(current === false) {
      return false;
    }
    if(current !== true) {
      symbol.value /= current;
      symbol = JSON.parse(JSON.stringify(symbol));
      symbol.value = current;
    }
    
    for(i = 0; i < this.childs.length; ++i) {
      result = this.childs[i].divide_(symbol);

      if(result === true) {
        return current;
      }
      if(result === false) {
        continue;
      }

      //symbol.value = result;
    }
    
    /*if(current !== true) {
      symbol.value = current;
    }*/
    return current;
  }
  
  if(this.head.value === '^') {
    result = false;
    
    if(this.childs[0].head.type === symbol.type && this.childs[0].head.value === symbol.value) {
      var one = new Leaf({
        type: 'constant',
        value: 1
      });
      
      this.childs[1] = new Node({
        type: 'operator',
        value: '-'
      }, [ this.childs[1], one ]);
      
      result = true;
    }
    
    return result;
  }
};
Leaf.prototype.divide_ = function(symbol) {
  if(symbol.value === 1) { return true; }
  
  if(this.head.type !== symbol.type) {
    return false;
  }
  
  if(this.head.type === 'constant' && symbol.type === 'constant') {
    var current = Utils.gcd(this.head.value, symbol.value);
    if(current === 1) { return false; }
    
    this.head.value /= current;
    
    if(current === symbol.value) { return true; }
    symbol.value /= current;
    
    return current;
  }
  
  if(this.head.type === 'literal' && this.head.value === symbol.value) {
    this.head.type = 'constant';
    this.head.value = 1;
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
  priority = priority || -1;
  
  var result = '',
      currentPriority = Utils.getOperationPriority(this.head.value);
  
  if(this.head.type === 'operator' && ['-', '+', '*', '^'].indexOf(this.head.value) !== -1) {
    var op = this.head.value;
    if(this.head.value === '*'/* && this.childs[0].type === 'constant'*/)
      op = ' ';
    result = this.childs.map(function(e) {
      return e.serializeTeX(currentPriority);
    }).join('}' + op + '{');
    
    if(currentPriority < priority) {
      return '({' + result + '})';
    }
    else {
      return '{' + result + '}';
    }
  }
  
  if(this.head.type === 'operator' && this.head.value === '/') {
    var sign = '';
    if(this.childs[0].head.type === 'constant' && this.childs[0].head.value < 0) {
      sign = '-';
    }
    if(this.childs[1].head.type === 'constant' && this.childs[1].head.value < 0) {
      sign = (sign === '-' ? '' : '-');
    }
    
    return sign + '\\frac{' + this.childs[0].serializeTeX(0, true) + '}{' + this.childs[1].serializeTeX(0, true) + '}';
  }
  
  if(this.head.type === 'func' && this.head.value === 'sqrt') {    
    return '\\sqrt{' + this.childs[0].serializeTeX() + '}';
  }
  
  if(this.head.type === 'func') {
    return this.head.value + '(' + this.childs[0].serializeTeX() + ')';
  }
};
Leaf.prototype.serializeTeX = function(proirity, noSign) {
  if(this.head.type === 'complex') {
    if(this.head.value === -1)
      return '-i';
    else if(this.head.value === 1)
      return 'i';
    else if(this.head.value === 0)
      return '';
    else
      return this.head.value + 'i';
  }
  
  if(noSign && this.head.type === 'constant') {
    return Math.abs(this.head.value) + '';
  }
  
  return this.head.value + '';
};

Node.prototype.serializeText = function(priority) {
  priority = priority || -1;
  
  var result = '',
      currentPriority = Utils.getOperationPriority(this.head.value);
  
  if(this.head.type === 'operator' && ['-', '+', '*', '^'].indexOf(this.head.value) !== -1) {
    result = this.childs.map(function(e) {
      return e.serializeText(currentPriority);
    }).join(' ' + this.head.value + ' ');
    if(currentPriority < priority)
      return '(' + result.trim() + ')';
    else
      return result.trim();
  }
  
  if(this.head.type === 'operator' && this.head.value === '/') {
    var sign = '';
    if(this.childs[0].head.type === 'constant' && this.childs[0].head.value < 0) {
      sign = '-';
    }
    if(this.childs[1].head.type === 'constant' && this.childs[1].head.value < 0) {
      sign = (sign === '-' ? '' : '-');
    }
    if(sign === '-')
      return '(' + sign + this.childs[0].serializeText(0, true) + '/' + this.childs[1].serializeText(0, true) + ')';
    else
      return this.childs[0].serializeText(0, true) + '/' + this.childs[1].serializeText(0, true);
  }

  if(this.head.type === 'func') {
    return this.head.value + '(' + this.childs[0].serializeText() + ')';
  }
};
Leaf.prototype.serializeText = function(proirity, noSign) {
  if(this.head.type === 'complex') {
    if(this.head.value === -1)
      return '-i';
    else if(this.head.value === 1)
      return 'i';
    else if(this.head.value === 0)
      return '';
    else
      return this.head.value + 'i';
  }
  
  if(noSign && this.head.type === 'constant') {
    return Math.abs(this.head.value) + '';
  }
  
  return this.head.value + '';
};

Node.prototype.compare = function(rhs) {
  if(!(rhs instanceof Node) || rhs.head.type !== this.head.type || rhs.head.value !== this.head.value || this.childs.length != rhs.childs.length) {
   return false; 
  }
  
  var i;
  
  for(i = 0; i < this.childs.length; ++i) {
    if(!this.childs[i].compare(rhs.childs[i])) {
      return false;
    }
  }
  
  return true;
};
Leaf.prototype.compare = function(rhs) {
  return rhs instanceof Leaf && rhs.head.type === this.head.type && rhs.head.value === this.head.value;
};

Node.prototype.calcPowerValue = function() {  
  if(this.head.type === 'operator') {
    if(this.head.value === '*') {
      this.power_ = this.childs.reduce(function(prev, e) {
        return prev + e.power_;
      }, 0);

      return this.power_;
    }

    if(this.head.value === '*') {
      this.power_ = this.childs[0].power_ - this.childs[1].power_ + 0.05;
      return this.power_;
    }
    
    if(/\-|\+/.test(this.head.value)) {
      var max = 0;
      this.childs.forEach(function(e) {
        if(e.power_ > max) {
          max = e.power_;
        }
      });

      this.power_ = max + 0.07;
      return this.power_;
    }

    if(this.head.value === '^') {
      this.power_ = this.childs[0].power_ * (this.childs[1].power_ + 1) + 0.1;
      return this.power_;
    }
  }
  
  if(this.head.type === 'func') {
    this.power_ = -1;
    return this.power_;
  }
};
Leaf.prototype.calcPowerValue = function() {
  if(this.head.type === 'constant' || this.head.type === 'complex') {
    this.power_ = 0;
    return 0;
  }
  
  if(this.head.type === 'literal') {
    this.power_ = 1;
    return 1;
  }
};

Node.prototype.niceFactorized = function() {
  var i, parts, subtree;
  
  for(i = 0; i < this.childs.length; ++i) {
    this.childs[i].niceFactorized();
  }
  
  if(this.head.type === 'operator' && /\+|\-/.test(this.head.value)) {
    parts = this.getSeparableSymbols();
    if(parts.length === 0) {
      return;
    }
    
    subtree = this.clone();
    for(i = 0; i < parts.length; ++i) {
      subtree.divide(null, parts[i]);
      parts[i] = new Leaf(parts[i]);
    }
    
    this.childs = parts.concat(subtree);
    this.head.value = '*';
  }
};
Leaf.prototype.niceFactorized = function() {
  // no need to `nice`
};

Node.prototype.niceExpanced = function() {
  var i, j, tmp, current, pluses = [], minuses = [];
  
  for(i = 0; i < this.childs.length; ++i) {
    this.childs[i].niceExpanced();
  }
  
  if(this.head.type === 'operator' && this.head.value === '*') {
    for(i = 0; i < this.childs.length; ++i) {
      current = this.childs[i];
      if(current.head.type === 'operator' && current.head.value === '+') {
        for(j = 0; j < current.childs.length; ++j) {
          tmp = this.clone();
          tmp.childs[i] = current.childs[j];
          pluses.push(tmp);
        }
      }
      else if(current.head.type === 'operator' && current.head.value === '-') {
        for(j = 0; j < current.childs.length; ++j) {
          tmp = this.clone();
          tmp.childs[i] = current.childs[j];
          minuses.push(tmp);
        }
      }
    }
  }
  
  else if(this.head.type === 'operator' && this.head.value === '/') {
    current = this.childs[0];
    if(current.head.type === 'operator' && current.head.value === '+') {
      for(j = 0; j < current.childs.length; ++j) {
        tmp = this.clone();
        tmp.childs[0] = current.childs[j];
        pluses.push(tmp);
      }
    }
    else if(current.head.type === 'operator' && current.head.value === '-') {
      for(j = 0; j < current.childs.length; ++j) {
        tmp = this.clone();
        tmp.childs[0] = current.childs[j];
        minuses.push(tmp);
      }
    }
  }
  
  if(pluses.length > 0) {
    this.head.value = '+';
    this.childs = pluses;
    
    if(minuses.length > 0) {
      this.childs.push(new Node({
        type: 'operator',
        value: '-'
      }, minuses));
    }
    
    for(i = 0; i < this.childs.length; ++i) {
      this.childs[i].niceExpanced();
    }
    
    return;
  }
  if(minuses.length > 0) {
    this.head.value = '-';
    this.childs = minuses;
    
    for(i = 0; i < this.childs.length; ++i) {
      this.childs[i].niceExpanced();
    }
    
    return;
  }
};
Leaf.prototype.niceExpanced = function() {
  // no need to `nice`
};

Node.prototype.differentiate = function(base) {
  var i, constants = [], deps = [], f, df, g, dg;

  if(!this.depends(base) || this.childs.length === 0) {
    this.head.value = 0;
    this.head.type  = 'constant';
    this.childs = undefined;
    this['__proto__'] = Leaf.prototype;
    return;
  }

  if(this.head.type === 'func') {
    // TODO(not implemented)
    throw new Error('function differentiation isn\'t implemented yet!');

    return this;
  }

  if(this.head.type === 'operator') {

    if(this.head.value === '*') {
      // test for simple case
      for(i = 0; i < this.childs.length; ++i) {
        if(this.childs[i].depends(base)) {
          deps.push(this.childs[i]);
        }
        else {
          constants.push(this.childs[i]);
        }
      }

      f = deps[0].clone();
      g = deps.slice(1, deps.length - 1);
      if(g.length > 1) {
        g = new Node()
      }
      else if(g.length === 1) {
        g = g[0];
      }
      else {
        g = new Leaf({ type: 'constant', value: 1 });
      }

      df = f.clone().differentiate(base);
      dg = g.clone().differentiate(base);

      this.childs = constants;

      var tree = new Node({
          type: 'operator',
          value: '+'
        }, []);

      tree.childs.push(new Node({
          type: 'operator',
          value: '*'
        }, [ g, df ]));
      tree.childs.push(new Node({
          type: 'operator',
          value: '*'
        }, [ dg.clone(), f.clone() ]));

      this.childs.push(tree);
      return this;
    }

    if(this.head.value === '/') {
      f = this.childs[0];
      g = this.childs[1];

      df = f.clone().differentiate(base);
      dg = g.clone().differentiate(base);

      this.childs[0] = new Node({
        type: 'operator',
        value: '-'
      }, []);

      this.childs[0].childs.push(new Node({
        type: 'operator',
        value: '*'
      }, [ df, g ]));

      this.childs[0].childs.push(new Node({
        type: 'operator',
        value: '*'
      }, [ dg, f ]));

      this.childs[1] = new Node({
        type: 'operator',
        value: '^'
      }, [ g, new Leaf({ type: 'constant', value: 2 }) ]);

      return this;
    }

    if(/\+|\-/.test(this.head.value)) {
      for(i = 0; i < this.childs.length; ++i) {
        this.childs[i].differentiate(base);
      }

      return this;
    }

    if(this.head.value === '^') {
      if(this.childs[0].depends(base)) {
        var c = this.childs[1];
        var x = this.clone();

        x.childs[1] = new Node({
          type: 'operator',
          value: '-'
        }, [ c.clone(), new Leaf({ type: 'constant', value: 1 }) ]);

        this.head.value = '*';
        this.childs = [ c, x ];

        if(x.childs[0] instanceof Node) {
          this.childs.push(x.childs[0].clone().differentiate(base));
        }

        return this;
      }
      else {
        this.childs = [this.clone(), new Node({
          type: 'func',
          value: 'ln'
        }, [ this.childs[0].clone() ])];
        this.head.value = '*';

        return this;
      }
    }

  }
};
Leaf.prototype.differentiate = function(base) {
  if(this.head.type === 'constant') {
    this.head.value = 0;
    return this;
  }

  if(this.head.type === 'literal') {
    this.head.type  = 'constant';
    this.head.value = (this.head.value === base ? 1 : 0);
    return this;
  }

  if(this.head.type === 'complex') {
    // TODO(not implemented)
    throw new Error('complex differentiation isn\'t implemented yet!');

    return this;
  }
};

Node.prototype.depends = function(base) {
  var i;

  for(i = 0; i < this.childs.length; ++i) {
    if(this.childs[i].depends(base)) {
      return true;
    }
  }

  return false;
};
Leaf.prototype.depends = function(base) {
  return this.head.type === 'literal' && this.head.value === base;
};

Node.prototype.getLiterals = function() {
  var literals = [], current, i;

  if(this.head.type === 'operator' && this.head.value === '*') {
    for(i = 0; i < this.childs.length; ++i) {
      current = this.childs[i].getLiterals();
      if(current) {
        literals.push(current);
      }
    }

    if(literals.length > 1) {
      return new Node({
        type: 'operator',
        value: '*'
      }, literals);
    }
    else if(literals.length === 1) {
      return literals[0];
    }
  }
};
Leaf.prototype.getLiterals = function() {
  if(this.head.type !== 'literal') {
    return undefined;
  }
  else {
    return this.clone();
  }
};

module.exports.Node = Node;
module.exports.Leaf = Leaf;
},{"./utils":9}],9:[function(require,module,exports){
/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

module.exports.gcd = function gcd(n1, n2) {
  if(n1 instanceof Object || n2 instanceof Object) {
    throw new Error('gcd: wrong usage!');
  }
  
  return gcd_(Math.abs(n1), Math.abs(n2));
};

function gcd_(n1, n2) {
  if(n1 === 0 || n1 === n2) {
    return n2;
  }
  if(n2 === 0) {
    return n1;
  }
  
  if(n1 === 1 || n2 === 1) {
    return 1;
  }
  
  var n1_ = n1 % 2 === 0;
  var n2_ = n2 % 2 === 0;
  
  if(n1_ && n2_) {
    return 2 * gcd_(n1 / 2, n2 / 2);
  }
  
  if(n1_) {
    return gcd_(n1 / 2, n2);
  }
  if(n2_) {
    return gcd_(n1, n2 / 2);
  }
  
  if(n1 > n2) {
    return gcd_((n1 - n2) / 2, n2);
  }
  else {
    return gcd_((n2 - n1) / 2, n1);
  }
}

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

function Map(comparer) {
  this.keys   = [];
  this.values = [];
  
  this.comparer = comparer || function(e1, e2) {
    return e1 == e2;
  };
}

Map.prototype.get = function(key) {
  return this.values[this.idx_(key)];
};

Map.prototype.set = function(key, value) {
  var idx = this.idx_(key);
  
  if(idx === -1) {
    this.keys.push(key);
    this.values.push(value);
  }
  else {
    this.values[idx] = value;
  }
};

Map.prototype.has = function(key) {
  return this.idx_(key);
};

Map.prototype.idx_ = function(key) {
  var i;
  
  for(i = 0; i < this.keys.length; ++i) {
    if(this.comparer(key, this.keys[i])) {
      return i;
    }
  }
  
  return -1;
};

module.exports.Map = Map;
},{}]},{},["Focm2+"]);