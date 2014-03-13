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


// 2 / 4 / 2 -> 2 / (4 * 2)
// 6 / a / 3 / a -> (6 * a) / (a * 3)
rules.push(function fractionsNormalization(root) {
  var modified = applyToChilds(root, fractionsNormalization);
  
  if(root.head.type === 'operator' && root.head.value === '/') {
    var i, lhs = [], rhs = [];
    
    for(i = 0; i < Math.min(2, root.childs.length); ++i) {
      if(i % 2 === 0) {
        lhs.push(root.childs[i]);
      }
      else {
        rhs.push(root.childs[i]);
      }
    }
    for(i = 2; i < root.childs.length; ++i) {
      if(i % 2 === 1) {
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
      
      else if(root.childs[i].head.type === 'literal') {
        if(root.head.value === '+') {
          if(literals[root.childs[i].head.value]) {
            literals[root.childs[i].head.value] += 1;
            modified = true;
          }
          else {
            literals[root.childs[i].head.value] = 1;
          }
        } 
        else {
          if(literals[root.childs[i].head.value]) {
            literals[root.childs[i].head.value] -= 1;
            modified = true;
          }
          else {
            literals[root.childs[i].head.value] = modified ? -1 : 1;
          }
        }
        
        root.childs.splice(i, 1);
        --i;
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      pair = root.childs[i].getSimpleMultPair();
      
      if(pair) {
        current = root.childs[i].childs;
        current[current[0].head.type === 'constant' ? 0 : 1].head.value = literals[pair.literal];
        delete literals[pair.literal];
      }
    }
    
    for(i in Object.getOwnPropertyNames(literals)) {
      if(literals[i] !== 1) {
        root.childs.push(new Node({ type: 'operator', value: '*' }, [
          new Leaf({ type: 'constant', value: literals[i] }),
          new Leaf({ type: 'literal', value: i })
        ]));
      }
      else {
        root.childs.push(new Leaf({ type: 'literal', value: i }));
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
        i, current, first, found;
    
    for(i = 0; i < root.childs.length; ++i) {
      if(root.childs[i].head.type === 'operator' && root.childs[i].head.value === '/') {
        found = true;
        break;
      }
    }
    
    if(!found) {
      return false;
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
  
  // TODO
  
  return false;
});

// b^3 * b^2 -> b^5
// b^3 * b   -> b^4
rules.push(function powersGroup(root) {
  var modified = applyToChilds(root, powersGroup),
      i, first, powers = { }, current;
  
  if(root.head.type === 'operator' && root.head.value === '*') {
    for(i = 0; i < root.childs.length; ++i) {
      current = root.childs[i];
      
      if(current.head.type === 'operator' && current.head.value === '^') {
        if(powers[current.childs[0]]) {
          powers[current.childs[0]].push(current.childs[1]);
          root.childs.splice(i, 1);
          --i;
        }
        else {
          powers[current.childs[0]] = [ current.childs[1] ];
        }
      }
      else if(current.head.type === 'literal') {
        if(powers[current.head.value]) {
          powers[current.head.value].push(new Leaf({ type: 'constant', value: 1 }));
          root.childs.splice(i, 1);
          --i;
        }
        else {
          powers[current.head.value] = [ new Leaf({ type: 'constant', value: 1 }) ];
        }
      }
    }
    
    for(i = 0; i < root.childs.length; ++i) {
      current = root.childs[i];
      
      if(current.head.type === 'operator' && current.head.value === '^' && powers[current.childs[0]].length > 1) {
        current.childs[1] = new Node({ type: 'operator', value: '+' }, powers[current.childs[0]]);
        modified = true;
      }
      else if(current.head.type === 'literal' && powers[current.head.value].length > 1) {
        var power = new Node({ type: 'operator', value: '+' }, powers[current.head.value]);
        
        root.childs[i] = new Node({type: 'operator', value: '^' }, [root.childs[i], power]);
        modified = true;
      }
    }
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