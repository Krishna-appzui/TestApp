/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint for Schema Queries
 * @date 4/9/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Schema
 */

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'schema', data);

        var sm = require('../../lib/orm/schema');

        var schemasByType = sm.schemasByType;
        var communitySchemasByType = sm.communitySchemasByType;

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.token === 'undefined' || typeof data.namespace === 'undefined' || typeof data.userId === 'undefined') {
            response('Missing Parameters');
            return;
        }

        if (typeof data.types !== 'undefined') {

            var schemasByType = {};

            data.types.forEach(function(type, index) {
                schemasByType[type] = sm.getSchema(type);
            });

            response(null, { schemasByType: schemasByType });

        } else if (typeof data.itemType !== 'undefined') {

            var sbt;

            if (data.namespace === 'dc')
                sbt = schemasByType;
            else
                sbt = communitySchemasByType;

            var schema = sbt[data.itemType];

            if (typeof schema !== 'undefined') {
                response(null, { schema: schema });
            } else {
                response('Schema not found');
            }
        }
    }
}