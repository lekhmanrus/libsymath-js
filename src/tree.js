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
      
      return result.filter(function(e) {
        var found = true;
        
        for(i = 0; found && i < tmp.length; ++i) {
          found = tmp[i].indexOf(e) !== -1 && found;
        }
        
        return found;
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
    console.log('FIXME: NON OP ' + this.head.type);
    return [];
  }
};

Leaf.prototype.getSeparableSymbols = function() {
  return [ this.head ];
};

Node.prototype.removeSeparableSymbol = function(symbol) {
  var i;
  
  for(i = 0; i < this.childs.length; ++i) {
    if(this.childs[i].head.type === symbol.type && this.childs[i].head.value === symbol.value) {
      this.childs.splice(i, 1);
      --i;
    }
    
    else {
      this.childs[i].removeSeparableSymbol(symbol);
    }
  }
};

Leaf.prototype.removeSeparableSymbol = function(symbol) { };

module.exports.Node = Node;
module.exports.Leaf = Leaf;