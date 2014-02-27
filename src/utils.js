/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

module.exports.gcd = function gcd(n1, n2) {
  if(n1 === 0 || n2 === 0) {
    return 1;
  }
  
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