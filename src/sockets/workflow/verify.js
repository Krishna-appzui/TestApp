/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to verify a workflow.  Returns the calculated routes.
 * @date 4/5/14
 * @Author Bryan Nagle
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 * @class Verify
 */

var routes = require('../../dsl/routes');
var validation = require('../../dsl/validation');

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'verifyWorkflow', data);

        if (typeof data.token === 'undefined' || typeof data.userId === 'undefined' || typeof data.prev === 'undefined' || typeof data.curr === 'undefined') {
            response('Missing Parameters');
            return;
        }

        validation.checkValidations(data.userId, data.workflow, data.curr, data.prev, function(valErr, result) {

            if (result === true) {
                routes.calculateApprovers(db, data.userId, data.workflow, data.curr, data.prev, function(err, approvers) {
                    response(!_.isNull(err)
                            ? err.toString().substr(7)
                            : null,
                        { approvers:approvers });
                });
            } else {
                response(valErr, result);
            }
        });
    }

}