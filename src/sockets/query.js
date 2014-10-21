/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket endpoint for streaming query
 * @date 4/2/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Query
 */

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function(data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'query', data);

        var schemasByType = require('../../lib/orm/schema').schemasByType;
        var communitySchemasByType = require('../../lib/orm/schema').communitySchemasByType;

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.token === 'undefined'
            || typeof data.namespace === 'undefined'
            || typeof data.userId === 'undefined'
            || typeof data.sortBy === 'undefined'
            || typeof data.itemType === 'undefined'
            || typeof data.category === 'undefined') {
            response('Missing parameters', []);
            return;
        }

        var StreamCursor = require('../../lib/orm/StreamCursor');
        var query = new StreamCursor(data);

        query.next(function(err, result, last) {
            response(null, result);
        });
    }
}