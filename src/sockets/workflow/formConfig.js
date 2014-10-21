/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * formConfig
 * @author Bryan Nagle
 * @date 7/7/14
 * @namespace
 * @module
 */

var _ = require('lodash');
var workflowForm = require('../../dsl/workflowForm');

exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'workflowFormConfig', data);

        if (_.isUndefined(data.token) || _.isUndefined(data.userId) || _.isUndefined(data.formType)) {
            response('Missing Parameters');
            return;
        }

        response(null, workflowForm[data.formType]);
    }
}