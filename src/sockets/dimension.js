/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint for Dimension Queries
 * @date 4/6/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Dimension
 */

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'dimension', data);

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.token === 'undefined' || typeof data.namespace === 'undefined' || typeof data.userId === 'undefined') {
            response('Missing Parameters');
            return;
        }

        var d = require('../../lib/orm/dimension');

        switch (data.query) {

            case 'childDimensionsForPath':

                if (typeof data.path === 'undefined')
                    break;

                d.childDimensionsForPath(data.path, data.attributes, function(result) {
                    response(null, result);
                });

                break;

            case 'childDimensionsForLevel':

                if (typeof data.level === 'undefined')
                    break;

                d.childDimensionsForLevel(data.level, data.attributes, function(result) {
                    response(null, result);
                });

                break;

            case 'dimensionsAtLevel':

                if (typeof data.level === 'undefined')
                    break;

                d.dimensionsAtLevel(data.level, data.attributes, function(result) {
                    response(null, result);
                });

                break;

            case 'dimensionsForPaths':

                if (typeof data.paths === 'undefined')
                    break;

                d.dimensionsForPaths(data.paths, function(err, result) {
                    response(err, result);
                });

                break;

        }

    }
}

