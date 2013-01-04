module.exports = function( grunt ) {
  'use strict';

  grunt.loadNpmTasks('grunt-crx');
  //
  // Grunt configuration:
  //
  // https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
  //
  grunt.initConfig({

    // Project configuration
    // ---------------------

    // headless testing through PhantomJS
    mocha: {
      all: ['test/**/*.html']
    },

    // default lint configuration, change this to match your setup:
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md#lint-built-in-task
    lint: {
      files: [
        'Gruntfile.js',
        'app/**/*.js',
      ]
    },

    crx: {
      md: {
        "src": "app",
        "dest": "dist",
        "exclude": [ ".git", ".svn", "lib/CodeMirror/doc", "lib/MathJax/docs", "lib/MathJax/fonts", "lib/MathJax/test"],
        "privateKey": "app.pem"
      }
    },

    // specifying JSHint options and globals
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md#specifying-jshint-options-and-globals
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
    },

    
  });

  // Alias the `test` task to run the `mocha` task instead
  grunt.registerTask('test', 'mocha');

};
