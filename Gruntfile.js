module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-browserify');
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  });
  
  grunt.config.set('browserify', {
    lib: {
      files: {
        'browser/libsymath.js': ['index.js']
      },
      options: {
        alias: ['./index.js:libsymath']
      }
    }
  })

  grunt.registerTask('default', ['browserify']);

};