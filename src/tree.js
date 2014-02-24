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

Node.prototype.getSeparableSymbols = function() {
  if(this.head.type === 'operator') {
    var result = [], tmp = [],
        i;
    
    if(['-', '+'].indexOf(this.head.value) !== -1) {
      for(i = 0; i < this.childs.length; ++i) {
        tmp.push(this.childs[i].getSeparableSymbols());
      }
      
      return tmp[0].filter(function(e) {
        for(i = 1; i < tmp.length; ++i) {
          var found = false, j;
          
          for(j = 0; !found && j < tmp[i].length; ++j) {
            if(tmp[i][j].type === e.type && tmp[i][j].value === e.value) {
              found = true;
            }
          }
          
          if(!found) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    else {
      for(i = 0; i < this.childs.length; ++i) {
        tmp = tmp.concat(this.childs[i].getSeparableSymbols());
      }
      
      for (i = 0; i < tmp.length; i++) {
        if (result.indexOf(result[i]) === -1) {
          result.push(tmp[i]);
        }
      }
      
      return result;
    }
    
  }
  else {
    return [];
  }
};

Leaf.prototype.getSeparableSymbols = function() {
  return [ this.head ];
};

function removeSeparableSymbol(node, symbol) {
  var removeOnce = function(node, symbol) {
    var i;
    
    for(i = 0; i < node.childs.length; ++i) {
      if(node.childs[i].head.type === symbol.type && node.childs[i].head.value === symbol.value) {
        node.childs[i].head.type  = 'constant';
        node.childs[i].head.value = 1;
        return true;
      }
      
      else {
        if(node.childs[i].removeSeparableSymbol(symbol)) {
          return true;
        }
      }
    }
  };
  
  var removeAll = function(node, symbol) {
    var i;
    
    for(i = 0; i < node.childs.length; ++i) {
      if(node.childs[i].head.type === symbol.type && node.childs[i].head.value === symbol.value) {
        node.childs[i].head.type  = 'constant';
        node.childs[i].head.value = 1;
      }
      
      else {
        node.childs[i].removeSeparableSymbol(symbol);
      }
    }
    
    return true;
  };
  
  if(node.head.type === 'operator') {
    if(['+', '-'].indexOf(node.head.value) !== -1) {
      return removeAll(node, symbol);
    }
    
    else if(node.head.value === '^') {
      node.childs[1].head.value -= 1;
      return true;
    }
    
    else {
      return removeOnce(node, symbol);
    }
  }
}

function removeSeparableSymbolRoot(node, symbol) {
  var i;
  
  for(i = 0; i < node.childs.length; ++i) {
    if(node.childs[i].head.type === symbol.type && node.childs[i].head.value === symbol.value) {
      node.childs[i].head.type  = 'constant';
      node.childs[i].head.value = 1;
    }
    
    else {
      node.childs[i].removeSeparableSymbol(symbol);
    }
  }
}

Node.prototype.removeSeparableSymbol = function(symbol, isRoot) {
  if(isRoot) {
    removeSeparableSymbolRoot(this, symbol);
  }
  
  else {
    return removeSeparableSymbol(this, symbol);
  }
};

Leaf.prototype.removeSeparableSymbol = function(symbol) { };

module.exports.Node = Node;
module.exports.Leaf = Leaf;