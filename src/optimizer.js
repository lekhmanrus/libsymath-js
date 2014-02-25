/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true, sub: true */
/*global module */
'use strict';

var Node = require('./tree').Node,
    Leaf = require('./tree').Leaf;

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
    
    if(root.head.value === '/' && root.childs[1]) {
      if(root.childs[1].head.type === 'constant' && root.childs[1].head.value === 1) {
        root['__proto__'] = root.childs[0]['__proto__'];
        root.head = root.childs[0].head;
        root.childs = root.childs[0].childs;
      }
    }
    
    else if(root.head.value === '*') {
      for(i = 0; i < root.childs.length; ++i) {
        if(root.childs[i].head.type === 'constant' && root.childs[i].head.value === 1) {
          root.childs.splice(i, 1);
          --i;
        }
      }
    }
    
    else if(['+', '-'].indexOf(root.head.value) !== -1) {
      for(i = 0; i < root.childs.length; ++i) {
        if(root.childs[i].head.type === 'constant' && root.childs[i].head.value === 0) {
          root.childs.splice(i, 1);
          --i;
        }
      }
    }
    
    else if(root.head.value === '^' && root.childs[1]) {
      if(root.childs[1].head.type === 'constant' && root.childs[1].head.value === 1) {
        root['__proto__'] = root.childs[0]['__proto__'];
        root.head = root.childs[0].head;
        root.childs = root.childs[0].childs;
      }
    }
    
  }
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
  var gcd = function gcd(n1, n2) {
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
    
    k = gcd(lk, rk);
    
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
  
  return false;
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