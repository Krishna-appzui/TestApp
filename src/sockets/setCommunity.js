/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint for oauth SetCommunity
 * @date 3/31/14
 * @Author Bryan Nagle
 * @namespace server.socket
 * @module server.socket
 * @class SetCommunity
 */

var core = require('../../lib/core');

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'setCommunity', data);
        var sid = data.sid;

        core.session.get(sid, function(err, sess) {

            if (_.isUndefined(sess) || _.isUndefined(sess.token) || _.isUndefined(data.community)) {
                response('Missing Parameters');
                return;
            }

            var request = require('request');
            var url = process.env.OAUTH_HREF + "/ls/api/oauth2/setCommunity";

            request.post({
                url: url,
                form: {community: data.community},
                headers: {
                    "Authorization": "Bearer " + sess.token
                }
            }, function (err, postResponse, body) {

                if (postResponse.statusCode === 200) {

                    if (!_.isUndefined(sid)) {
                        core.session.get(sid, function(err, sess) {

                            sess.community = data.community;
                            core.session.set(sid, sess, function(err) {

                                if (!_.isNull(err) && !_.isUndefined(err)) {
                                    console.log('Community saved');

                                }
                                else {
                                    console.log('Error Saving Community: ' + err);
                                }
                            });

                        });
                    }

                    response(null, { community: data.community });
                }
                else {
                    response(err);
                }
            });


        });

        /*
        if (typeof data.token === 'undefined' || typeof data.community === 'undefined') {
            response('Missing Parameters');
            return;
        }

        var request = require('request');
        var url = process.env.OAUTH_HREF + "/ls/api/oauth2/setCommunity";

        request.post({
            url: url,
            form: {community: data.community},
            headers: {
                "Authorization": "Bearer " + data.token
            }
        }, function (err, postResponse, body) {

            if (postResponse.statusCode === 200) {

                if (!_.isUndefined(sid)) {
                    core.session.get(sid, function(err, sess) {

                        sess.community = data.community;
                        core.session.set(sid, sess, function(err) {

                            if (!_.isNull(err) || !_.isUndefined(err)) {
                                console.log('Error Saving Community: ' + err);
                            }
                            else {
                                console.log('Community saved');
                            }
                        });

                    });

                }

                response(null, { community: data.community });
            }
            else {
                response(err);
            }
        });*/
    }
}