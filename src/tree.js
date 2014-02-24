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