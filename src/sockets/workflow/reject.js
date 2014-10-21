/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to reject a workflow.  Client calls and passes the workflow item.
 * @Author Bryan Nagle
 * @date 4/14/14
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 * @class Reject
 */

var orm = require('../../../lib/orm');
var dm = orm.manager;
var _ = require('lodash');

/**
 * @method handler
 * @param {} db
 * @param {} socket
 * @return FunctionExpression
 */
exports.handler = function(db, socket) {
    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'rejectWorkflow', data);

        if (typeof data.token === 'undefined'
            || typeof data.userId === 'undefined'
            || typeof data.workflow === 'undefined'
            || typeof data.curr === 'undefined') {
            response('Missing Parameters');
            return;
        }

        var workflow = data.workflow;
        var curr = data.curr;
        collapseBlocks(curr);

        workflow.data.state = 'Rejected';
        workflow.data.status = 'Closed';
        curr.data.stepState = 'Rejected';

        dm.update('dc', 'workflow', workflow, function(err, data) {
            dm.update('dc', 'workflow', curr, function (err, data) {
                response(err, data);
            });
        });
    }
}

/**
 * Description
 * @private
 * @method collapseBlocks
 * @param {} item
 * @return 
 */
function collapseBlocks(item) {

    collapseBlock(item, 'addresses');
    collapseBlock(item, 'phones');
    collapseBlock(item, 'emails');
}

/**
 * Description
 * @private
 * @method collapseBlock
 * @param {} item
 * @param {} field
 * @return 
 */
function collapseBlock(item, field) {

    if (_.isArray(item.data[field])) {
        item.data[field] = JSON.stringify(item.data[field]);
    }
}