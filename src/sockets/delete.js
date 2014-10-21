/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to Delete an Item
 * @date 4/3/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Delete
 */

"use strict"
var orm = require('../../lib/orm');
var dm = orm.manager;


/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'delete', data);

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.item === 'undefined') {
            if (typeof data.item.h_id === 'undefined' || typeof data.h_type === 'undefined') {
                response('Missing Parameters');
                return;
            }
        }

        if (typeof data.token === 'undefined' || typeof data.namespace === 'undefined' || typeof data.userId === 'undefined') {
            response('Missing Parameters');
            return;
        }

        var h_type;
        var h_id;

        if (typeof data.item !== 'undefined') {
            h_type = data.item.headers.type;
            h_id = data.item.headers.id;
        } else {
            h_type = data.h_type;
            h_id = data.h_id;
        }

        dm.delete(data.namespace,data.category, h_type, h_id, function(err, result) {
            response(err, result);
        });
    }
}