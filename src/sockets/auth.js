/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to Authenticate
 * @date 3/31/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class Auth
 */

"use strict"

var core = require('../../lib/core');
var utils = require('../../lib/utils');

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function(data) {

        var response = require('../../lib/core/socketResponse').response(socket, 'auth', data);

        if (typeof data.userId === 'undefined' || typeof data.password === 'undefined') {
            response('Missing Credentials');
            return;
        }

        var auth = require('../../lib/core/auth');
        auth.credentials(data.userId, data.password, data.community, function(err, sess) {

            if (_.isUndefined(sess)) {
                response(err);
                return;
            }

            var sid = utils.newUUID();
            core.session.set(sid, sess, function(sessionErr) {
                sess.sid = sid;
                response(err, sess);
            });
        });
    }
}



