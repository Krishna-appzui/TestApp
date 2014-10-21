/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * listConfig.js
 * @author Bryan Nagle
 * @date 9/10/14
 * @namespace
 * @module
 */

var _ = require('lodash');
var workflowList = require('../../dsl/workflowList');

exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'workflowListConfig', data);

        if (_.isUndefined(data.token) || _.isUndefined(data.userId)) {
            response('Missing Parameters');
            return;
        }

        response(null, workflowList(data.userId));
    }
}