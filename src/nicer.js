/*jslint white: true, node: true, plusplus: true, vars: true, nomen: true, sub: true, bitwise: true */
/*global module */
'use strict';

function Nicer(root, type) {
  if(type !== 'expenced' && type !== 'factorized') {
    throw new Error('wrong type!');
  }
  
  this.root_ = root;
  this.type_ = type;
}

Nicer.prototype.niceExpanced = function(root) {
  
};

Nicer.prototype.nice = function(root) {
  if(this.type_ === 'expanced') {
    this.niceExpanced(root);
  }
  else {
    this.niceFactorized(root);
  }
};