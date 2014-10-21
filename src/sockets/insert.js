/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to insert an item in to the database.
 * @date 4/3/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Insert
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
        var response = require('../../lib/core/socketResponse').response(socket, 'insert', data);

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (typeof data.token === 'undefined' || typeof data.namespace === 'undefined' || typeof data.userId === 'undefined' || typeof data.item === 'undefined') {
            response('Missing Parameters');
            return;
        }

        dm.insert(data.namespace, data.category, data.item, function(err, result) {
            response(err, result);
        });

    }
}
