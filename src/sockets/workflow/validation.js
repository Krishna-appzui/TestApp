/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * validation
 * @author Bryan Nagle
 * @date 6/4/14
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 */

var validation = require('../../dsl/validation');

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'workflowValidation', data);

        if (typeof data.token === 'undefined' || typeof data.userId === 'undefined') {
            response('Missing Parameters');
            return;
        }

        response(null, validation.workflowFormValidations);
    }
}