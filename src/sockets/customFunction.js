/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * customFunction
 * @author Bryan Nagle
 * @date 9/15/14
 * @namespace
 * @module
 */

var _ = require('lodash');
var functs = require('../dsl/functions');

exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../lib/core/socketResponse').response(socket, 'customFunction', data);

        if (typeof data.community !== 'undefined' && typeof data.namespace === 'undefined') {
            data.namespace = data.community;
        }

        if (_.isUndefined(data.token) || _.isUndefined(data.namespace) || _.isUndefined(data.userId) || _.isUndefined(data.name)) {
            response('Missing Parameters');
            return;
        }

        functs.executeFunction(data.name, data.args, function(err, result) {
            response(err, result);
        });
    }
}