/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint for talking to Liquid Server.  Passes arguments to lsBridge static class.
 * @author Bryan Nagle
 * @date 4/23/14
 * @namespace server.socket
 * @module server.socket
 * @class LiquidServer
 */

var bridge = require('../../lib/orm/lsBridge');

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function(data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'liquidServer', data);

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.token === 'undefined'
            || typeof data.namespace === 'undefined'
            || typeof data.userId === 'undefined'
            || typeof data.command === 'undefined') {
            response('Missing parameters', []);
            return;
        }

        switch (data.command) {
            case 'upsert':
                bridge.upsert(data.token, data.items, function(err, result) {
                    response(err, result);
                });
                break;
            case 'delete':
                bridge.delete(data.token, data.itemIds, function(err, result) {
                    response(err, result);
                });
                break;

            default:
                response(new Error('Unknown Command'));
                break;
        }

    }
}