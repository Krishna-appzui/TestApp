/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Create New workflow item along with Step 0 and Step 1 items and return them to the client
 * @Author Bryan Nagle
 * @date 4/5/14
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 * @class Create
 */

var orm = require('../../../lib/orm');
var dm = orm.manager;
var wf = require('../../workflow/calculate');
var compare = require('../../../lib/orm/itemDiff');
var _ = require('lodash');
var utils = require('../../../lib/utils');

/**
 * Description
 * @method handler
 * @param {} db
 * @param {} socket
 * @return FunctionExpression
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'createWorkflow', data);

        if (_.isUndefined(data) || _.isUndefined(data.token) || _.isUndefined(data.userId)) {
            response('Missing Parameters');
            return;
        }

        /**
         * Description
         * @private
         * @method donehandler
         * @param {} result
         * @return 
         */
        var donehandler = function(result) {
            response(null, result);
        };

        // TODO:  Clean this up to reduce nesting and properly process errors
        if (typeof data.accountId !== 'undefined') {

            dm.fetchUserAndPosition(data.userId, function(err, user, position) {
                wf.fetchAccount(data.accountId, function(err, account) {
                    wf.fetchBlocks(account, function(account) {
                        createWorkflow(db, user, position, account, data, donehandler);
                    });

                });
            });

        } else if (typeof data.account !== 'undefined') {

            dm.fetchUserAndPosition(data.userId, function(err, user, position) {
                wf.fetchBlocks(data.account, function(account) {
                    createWorkflow(db, user, position, account, data, donehandler);
                });
            });

        } else {

            dm.fetchUserAndPosition(data.userId, function(err, user, position) {
                createWorkflow(db, user, position, undefined, data, donehandler);
            });

        }
    }
}

/**
 * Description
 * @private
 * @method createWorkflow
 * @param {} db
 * @param {} user
 * @param {} position
 * @param {} account
 * @param {} itemToOrg
 * @param {} data
 * @param {} callback
 * @return 
 */
function createWorkflow(db, user, position, account, data, callback) {

    if (typeof callback === 'undefined')
        return;

    if (typeof account === 'undefined') {
        var uuid = utils.newUUID();
        account = { headers:{ id:uuid, type:'account' }, data:{ addresses:[], phones:[], emails:[] } };
    }

    var id = utils.newUUID();
    var timestamp = new Date();

    var approval = {
        headers: {
            id: id,
            type: "wfApproval",
            createdat: timestamp,
            updatedat: timestamp
        },
        data: {
            approvalId: id,
            accountId: account.data.accountId,
            accounthId: account.headers.id,
            status: 'Working',
            state: 'Pending',
            requestor: data.userId,
            createdAt: timestamp,
            updatedAt: timestamp
        }
    };

    id = utils.newUUID();

    var step0 = {
        headers: {
            id: id,
            type: "wfStep",
            createdat: timestamp,
            updatedat: timestamp
        },
        data: {
            stepId: id,
            stepOrder: 0,
            workflowId: approval.data.approvalId,
            stepState: 'Approved',
            approver: data.userId,
            approverPositionType: (typeof position !== 'undefined') ? position.data.positionType : undefined
        }
    }

    step0.data = _.extend(step0.data, stripUnmatchedFields('wfStep', account.data));
    orm.item.fill(step0);
    wf.expandBlocks(step0);

    var customerShipToAddress = wf.findBlock(step0.data.addresses, 'addressType', '/Data/communicationType[CustomerShipTo]');

    if (_.isUndefined(customerShipToAddress) || _.isNull(customerShipToAddress)) {

        customerShipToAddress = {
            headers: {
                id: step0.headers.id+'/addresses'+step0.data.addresses.length,
                type: 'Address',
                'parent_id': approval.data.accounthId,
                'parent_type': 'account',
                'parent_fieldname': 'adddresses',
                'parent_sequence': step0.data.addresses.length
            },
            data: {
                addressType: '/Data/communicationType[CustomerShipTo]'
            }
        };

        step0.data.addresses.push(customerShipToAddress);
    }

    var customerBillToAddress = wf.findBlock(step0.data.addresses, 'addressType', '/Data/communicationType[CustomerBillTo]');

    if (_.isUndefined(customerBillToAddress) || _.isNull(customerBillToAddress)) {

        customerBillToAddress = {
            headers: {
                id: step0.headers.id+'/addresses'+step0.data.addresses.length,
                type: 'Address',
                'parent_id': approval.data.accounthId,
                'parent_type': 'account',
                'parent_fieldname': 'adddresses',
                'parent_sequence': step0.data.addresses.length
            },
            data: {
                addressType: '/Data/communicationType[CustomerBillTo]'
            }
        };

        step0.data.addresses.push(customerBillToAddress);
    }

    var customerWorkPhone = wf.findBlock(step0.data.phones, 'phoneType', '/Data/communicationType[Work]');

    if (_.isUndefined(customerWorkPhone) || _.isNull(customerWorkPhone)) {

        customerWorkPhone = {
            headers: {
                id: step0.headers.id+'/phones'+step0.data.phones.length,
                type: 'Phone',
                'parent_id': approval.data.accounthId,
                'parent_type': 'account',
                'parent_fieldname': 'phones',
                'parent_sequence': step0.data.phones.length
            },
            data: {
                phoneType: '/Data/communicationType[Work]'
            }
        };

        step0.data.phones.push(customerWorkPhone);
    }

    var customerWorkFax = wf.findBlock(step0.data.phones, 'phoneType', '/Data/communicationType[WorkFax]');

    if (_.isUndefined(customerWorkFax) || _.isNull(customerWorkFax)) {

        customerWorkFax = {
            headers: {
                id: step0.headers.id+'/phones'+step0.data.phones.length,
                type: 'Phone',
                'parent_id': approval.data.accounthId,
                'parent_type': 'account',
                'parent_fieldname': 'phones',
                'parent_sequence': step0.data.phones.length
            },
            data: {
                phoneType: '/Data/communicationType[WorkFax]'
            }
        };

        step0.data.phones.push(customerWorkFax);
    }

    id = utils.newUUID();

    var step1 = {
        headers: {},
        data: {}
    }

    step1.data = _.extend(step1.data, stripUnmatchedFields('wfStep', step0.data));
    orm.item.fill(step1);

    step1.headers.id = id;
    step1.headers.type = "wfStep";
    step1.headers.createdAt = timestamp;
    step1.headers.updatedAt = timestamp;

    step1.data.stepId = id;
    step1.data.stepOrder = 1;
    step1.data.workflowId = approval.data.approvalId;
    step1.data.stepState = 'Approved';
    step1.data.approver = data.userId;
    step1.data.approverPositionType = (typeof position !== 'undefined') ? position.data.positionType : undefined

    var doc = compare.compare(step1, step0);
    callback({ workflow:approval, prev:step0, curr:step1, diff:doc } );
}

/**
 * Description8
 * @private
 * @method stripUnmatchedFields
 * @param {} type
 * @param {} data
 * @return output
 */
function stripUnmatchedFields(type, data) {

    var schemasByType = require('../../../lib/orm/schema').schemasByType;
    var schema = schemasByType[type];
    var output = {};

    for (var fdx = 0; fdx < schema.fields.length; fdx++) {
        var field = schema.fields[fdx];
        var value = data[field.name];

        if (typeof value === 'undefined' || value === null)
            continue;

        output[field.name] = value;

        if (field.dataType === 'dimension') {
            output[field.name+'Display'] = data[field.name+'Display'];
            output[field.name+'Country'] = data[field.name+'Country'];
        }
    }

    return output;
}