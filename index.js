/*jslint white: true, node: true, plusplus: true, vars: true */
/*global module, require, __dirname */
'use strict';

if(process.env.YOURPACKAGE_COVERAGE) {
  module.exports.Lexer = require(__dirname + '/src-cov/lexer.js');
  module.exports.Expression = require(__dirname + '/src-cov/expression.js');
}
else if(typeof window === 'undefined') {
  module.exports.Lexer = require(__dirname + '/src/lexer.js');
  module.exports.Expression = require(__dirname + '/src/expression.js');
}
else {
  module.exports.Lexer = require('./src/lexer.js');
  module.exports.Expression = require('./src/expression.js');
}