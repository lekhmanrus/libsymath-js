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
    }
  }
  else {
    root.calcPowerValue();
  }
};

module.exports = Nicer;