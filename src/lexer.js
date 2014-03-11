/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module */
'use strict';

function Lexer(buffer) {  
  this.buffer = buffer;
  this.offset = 0;
}

var WHITESPACE  = /\s/,
    S_DIGIT     = /[\d\.]/,
    S_COMPLEX_DIGIT = /[\d\.i]/,
    COMPLEX     = /^(i[\d\.]+|[\d\.]+i)$/,
    NUMBER      = /^(\d*\.\d+|\d+)$/,
    S_LETTER    = /[a-zа-я]/,
    LITERAL     = /^[a-zа-я]+\d*$/,
    OPERATOR    = /^(\+|\-|\*|\/|\^)$/,
    S_BRACKET   = /(\(|\[|\]|\))/,
    BRACKET     = /^(\(|\[|\]|\))$/;

Lexer.prototype.getNextToken = function() {
  var length = this.buffer.length;
  
  while(this.offset < length && WHITESPACE.test(this.buffer[this.offset])) {
    ++this.offset;
  }
  
  if(this.offset === length) {
    return;
  }
  
  var start = this.offset;
  
  if(OPERATOR.test(this.buffer[this.offset]) && !OPERATOR.test(this.buffer[this.offset + 1])) {
    ++this.offset;
  }
  else
  if(S_DIGIT.test(this.buffer[this.offset])) {
    while(this.offset < length && (S_COMPLEX_DIGIT.test(this.buffer[this.offset]) || S_LETTER.test(this.buffer[this.offset]))) {
      ++this.offset;
    }
  }
  else
  if(this.offset < length - 1 && S_COMPLEX_DIGIT.test(this.buffer[this.offset]) && S_DIGIT.test(this.buffer[this.offset + 1])) {
    while(this.offset < length && S_COMPLEX_DIGIT.test(this.buffer[this.offset])) {
      ++this.offset;
    }
  }
  else
  if(S_LETTER.test(this.buffer[this.offset])) {
    while(this.offset < length && (S_LETTER.test(this.buffer[this.offset]) || S_DIGIT.test(this.buffer[this.offset]))) {
      ++this.offset;
    }
  }
  else
  if(S_BRACKET.test(this.buffer[this.offset])) {
    ++this.offset;
  }
  else {
    while(this.offset < length && !WHITESPACE.test(this.buffer[this.offset])) {
      ++this.offset;
    }
  }
  
  return {
    text: this.buffer.substr(start, this.offset - start),
    loc: {
      start: start,
      end: this.offset
    }
  };
};

Lexer.prototype.getTokenType = function(token) {
  if(!token || !token.text || token.loc.start === undefined || token.loc.end === undefined) {
    throw new ReferenceError('getTokenType() failed: wrong input');
  }
  
  if(token.text === 'i') {
    return {
      type: 'complex',
      value: 1,
      loc: token.loc
    };
  }
  
  if(COMPLEX.test(token.text)) {
    return {
      type: 'complex',
      value: parseFloat(token.text.replace('i', '')),
      loc: token.loc
    };
  }
  
  if(NUMBER.test(token.text)) {
    return {
      type: 'constant',
      value: parseFloat(token.text),
      loc: token.loc
    };
  }
  
  if(LITERAL.test(token.text)) {
    return {
      type: 'literal',
      value: token.text,
      loc: token.loc
    };
  }
  
  if(OPERATOR.test(token.text)) {
    return {
      type: 'operator',
      value: token.text,
      loc: token.loc
    };
  }
  
  if(BRACKET.test(token.text)) {
    return {
      type: 'bracket',
      value: token.text,
      loc: token.loc
    };
  }
  
  var error = new SyntaxError('Expression error: invalid token: `' + token.text + '`');
  error.loc = token.loc;
  
  throw error;
};

Lexer.prototype.tokens = function() {
  var result = [], token = this.getNextToken(),
      currentType, previousType, i, j;
  
  while(token) {
    currentType = this.getTokenType(token);
    
    if(currentType.type === 'bracket' && previousType && previousType.type === 'literal' && ['(', '['].indexOf(currentType.value) !== -1) {
      result[result.length - 1].type = 'func';
    }
    else {
      result.push(currentType);
    }

    previousType = currentType;
    token = this.getNextToken();
  }
  
  
  if(result.length > 1) {
    // unary `-` workaround
    
    if(result[0].type === 'operator' && result[0].value === '-' && ['constant', 'complex'].indexOf(result[1].type !== -1)) {
      result[1].value *= -1;
      result.shift();
    } 
    
    else if(result[0].type === 'operator' && result[0].value === '-') {
      result[1].unaryNegative = true;
      result.shift();
    }
    
    for(i = 1; i < result.length; ++i) {
      if(result[i - 1].value === '(' && result[i].value === '-') {
        if(['constant', 'complex'].indexOf(result[i + 1].type) !== -1) {
          result.splice(i, 1);
          result[i].value *= -1;
        }
        
        else {
          result.splice(i, 1);
          result[i].unaryNegative = true;
        }
      }
    }
  }
  
  return result;
};

module.exports = Lexer;