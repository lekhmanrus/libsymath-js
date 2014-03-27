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
      // TODO(not implemented)
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
        //
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

module.exports.Node = Node;
module.exports.Leaf = Leaf;