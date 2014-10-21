/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * cache
 * @author Bryan Nagle
 * @date 4/2/14
 *
 * @namespace server.core
 * @module server.core
 * @class Cache
 * @static
 *
 */

var _ = require('lodash');
var grunt = require('grunt');

/*
app.locals.cache.modules = _.union(['/src/main.js'], _.map(grunt.file.expand('./public/src/modules/*.js'), function(file) {
    return file.substr(8);
}));*/

module.exports = {
    devcache: function () {

        var modules = _.map(grunt.file.expand('src/public/src/modules/*.js'), function(file) {
            return file.substr(11);
        });

        var views = _.map(grunt.file.expand('src/public/src/views/*.js'), function(file) {
            return file.substr(11);
        });

        var ejs = _.map(grunt.file.expand('templates/ejs/*.ejs'), function(file) {
            return grunt.file.read(file);
        });

        var shtml = _.map(grunt.file.expand('templates/shtml/*.shtml'), function(file) {
            return grunt.file.read(file);
        });

        return {
            javascripts: _.union(['src/main.js'], modules, views),
            templates: _.union(ejs, shtml)
        }
    },
    prodcache: function() {

        var ejs = _.map(grunt.file.expand('templates/ejs/*.ejs'), function(file) {
            return grunt.file.read(file);
        });

        var shtml = _.map(grunt.file.expand('templates/shtml/*.shtml'), function(file) {
            return grunt.file.read(file);
        });

        return {
            javascripts: ["javascripts/application.js"],
            templates: _.union(ejs, shtml)
        }
    }
}