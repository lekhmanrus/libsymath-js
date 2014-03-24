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
  
  // stub
  return false;
  //return this.divide_(symbol);
};
Leaf.prototype.divide = function(root, symbol) {
  symbol = JSON.parse(JSON.stringify(symbol));
  
  if(this.divideDry_(symbol) !== true) {
    return false;
  }
  
  // stub
  return false;
  //return this.divide_(symbol);
};

Node.prototype.divideDry_ = function(symbol) {
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
      
      if(result === undefined) {
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

    result = 0;
    
    for(i = 0; i < values.length; ++i) {
      if(values[i] === false) {
        continue;
      }
      if(values[i] === true) {
        return true;
      }
      
      result += values[i];
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
    return '\\frac{' + this.childs[0].serializeTeX() + '}{' + this.childs[1].serializeTeX() + '}';
  }
  
  if(this.head.type === 'func' && this.head.value === 'sqrt') {    
    return '\\sqrt{' + this.childs[0].serializeTeX() + '}';
  }
  
  if(this.head.type === 'func')
    return this.head.value + '(' + this.childs[0].serializeTeX() + ')';

};

Leaf.prototype.serializeTeX = function() {
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
  
  return this.head.value + '';
};

Node.prototype.compare = function(rhs) {
  if(!(rhs instanceof Leaf) || rhs.head.type !== this.head.type || rhs.head.value !== this.head.value || this.childs.length != rhs.childs.length) {
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

module.exports.Node = Node;
module.exports.Leaf = Leaf;