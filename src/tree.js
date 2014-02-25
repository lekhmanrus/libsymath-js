/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

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
};

Leaf.prototype.reduce = function() { };

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
    
    var result = JSON.parse(JSON.stringify(tmp[0]));
    for(i = 1; i < tmp.length; ++i) {
      result.value = gcd(result.value, tmp[i].value);
    }
    
    //console.log(result);
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
    
    else if(this.head.value === '^') {
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

module.exports.Node = Node;
module.exports.Leaf = Leaf;