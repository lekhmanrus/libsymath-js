/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

module.exports.gcd = function gcd(n1, n2) {
  if(n1 instanceof Object || n2 instanceof Object) {
    throw new Error('gcd: wrong usage!');
  }
  
  return gcd_(Math.abs(n1), Math.abs(n2));
};

function gcd_(n1, n2) {
  if(n1 === 0 || n1 === n2) {
    return n2;
  }
  if(n2 === 0) {
    return n1;
  }
  
  if(n1 === 1 || n2 === 1) {
    return 1;
  }
  
  var n1_ = n1 % 2 === 0;
  var n2_ = n2 % 2 === 0;
  
  if(n1_ && n2_) {
    return 2 * gcd_(n1 / 2, n2 / 2);
  }
  
  if(n1_) {
    return gcd_(n1 / 2, n2);
  }
  if(n2_) {
    return gcd_(n1, n2 / 2);
  }
  
  if(n1 > n2) {
    return gcd_((n1 - n2) / 2, n2);
  }
  else {
    return gcd_((n2 - n1) / 2, n1);
  }
}

module.exports.getOperationPriority = function(value) {
  if(value === '+' || value === '-') {
    return 1;
  }
  
  if(value === '*' || value === '/') {
    return 2;
  }
  
  if(value === '^') {
    return 3;
  }
  
  return -1;
};

function Map(comparer) {
  this.keys   = [];
  this.values = [];
  
  this.comparer = comparer || function(e1, e2) {
    return e1 == e2;
  };
}

Map.prototype.get = function(key) {
  return this.values[this.idx_(key)];
};

Map.prototype.set = function(key, value) {
  var idx = this.idx_(key);
  
  if(idx === -1) {
    this.keys.push(key);
    this.values.push(value);
  }
  else {
    this.values[idx] = value;
  }
};

Map.prototype.has = function(key) {
  return this.idx_(key);
};

Map.prototype.idx_ = function(key) {
  var i;
  
  for(i = 0; i < this.keys.length; ++i) {
    if(this.comparer(key, this.keys[i])) {
      return i;
    }
  }
  
  return -1;
};

module.exports.Map = Map;