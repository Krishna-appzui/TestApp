/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint to submit a workflow.  Handles submitting of multiple workflows.
 * @Author Bryan Nagle
 * @date 4/5/14
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 * @class SubmitMultiple
 */

var orm = require('../../../lib/orm');
var dm = orm.manager;
var wf = require('../../workflow/calculate');
var _ = require('lodash');
var interface = require('../../dsl/interface');
var routes = require('../../dsl/routes');
var workflowForm = require('../../dsl/workflowForm')
var sm = require('../../../lib/orm/schema');
var utils = require('../../../lib/utils');
var orm = require('../../../lib/orm');
var validation = require('../../dsl/validation');

/**
 * Description
 * @method handler
 * @param {} db
 * @param {} socket
 * @return FunctionExpression
 */
exports.handler = function(db, socket) {
    return function (data) {

        var errors = [];
        var response = require('../../../lib/core/socketResponse').response(socket, 'submitMultipleWorkflow', data);

        if (typeof data.workflows === 'undefined' && data.workflows.length === 0) {
            response({msg:['Please choose atleast one workflow to approve'],id:null});
            return;
        }
        else
        {
            processWorkfFlowSubmit(db,socket,data,0,[]);
        }
    }
}
function processWorkfFlowSubmit(db,socket,data,wfid,errors){
    var response = require('../../../lib/core/socketResponse').response(socket, 'submitMultipleWorkflow', data);
    var wfdata = data.workflows[wfid];
    wf.fetchStepsForWorkflow(wfdata, function(steps) {
        var currentStep = {};
        var i=0;
        for(;i<data.curr.length;i++){
            console.log(data.curr[i].data.workflowId === data.workflows[wfid].data.approvalId);
            if(data.curr[i].data.workflowId === data.workflows[wfid].data.approvalId)
            {
                console.log('got the current step');
                currentStep = data.curr[i];
                break;
            }
        }
        var wfData ={};
        wfData.workflow ={};
        wfData.workflow = data.workflows[wfid];
        wfData.curr={};
        wfData.curr = currentStep;
        wfData.userId = data.userId;
        updateWorkflow(db, wfData, steps, function(err, result) {
            if (!_.isNull(err)) {
                errors.push({msg:result,id:data.workflows[wfid].data.approvalId});
                processNextWorkflow(db,socket,data,wfid,errors);

            } else if (!_.isUndefined(result) && result.last === true) {
                // Last Step, send to backend!
                interface.process(data.workflows[wfid], currentStep, function(err, result) {

                    if (!_.isUndefined(result) && !_.isUndefined(result.workflow)) {

                        var workflow = result.workflow;
                        var timestamp = new Date();

                        orm.workflowActivity.save(data.token, {
                            workflowId: workflow.data.approvalId,
                            accountId: workflow.data.accountId,
                            requestor: workflow.data.requestor,
                            accountName: _.isUndefined(workflow.data.name)
                                ? currentStep.name
                                : workflow.data.name,
                            state: workflow.data.state,
                            status: workflow.data.status,
                            updatedAt: timestamp,
                            currentApprover: currentStep.approver,
                            backendResponseMessage: result.responseCode +' '+result.responseBody
                        });
                        processNextWorkflow(db,socket,data,wfid,errors);
                    }
                    else{
                        errors.push({msg:result,id:data.workflows[wfid].data.approvalId});
                        processNextWorkflow(db,socket,data,wfid,errors);
                    }
                });
            } else {
                errors.push({msg:result,id:data.workflows[wfid].data.approvalId});
                processNextWorkflow(db,socket,data,wfid,errors);
            }

        }, function(result) {
            errors.push({msg:result,id:data.workflows[wfid].data.approvalId});
        });
    });
    //}
}
function processNextWorkflow(db,socket,data,wfid,errors){
    wfid = wfid+1;
    var response = require('../../../lib/core/socketResponse').response(socket, 'submitMultipleWorkflow', data);
    var nextWf = getNextWorkFlowForApproval(data,wfid);
    if(nextWf !== null){
        processWorkfFlowSubmit(db,socket,data,wfid,errors);
    }
    else
    {
        if(errors.length>0){
            response(new Error('Mass approval failed'),errors);
        }
        else{
            response(null,errors);
        }
    }
}
function getNextWorkFlowForApproval(data,wfId){
    if(wfId == data.workflows.length){
        return null;
    }
    return data.workflows[wfId];
}
/**
 * Description
 * @private
 * @method updateWorkflow
 * @param {} db
 * @param {} data
 * @param {} steps
 * @param {} successHandler
 * @param {} failureHandler
 * @return
 */
function updateWorkflow(db, data, steps, callback) {

    isWorkflowEditable(data.workflow.data.approvalId, data.curr.data.stepId, function(pErr, isEditable) {

        if (isEditable === false) {
            callback('Workflow is not editable', ['This Workflow or Step has already been submitted.']);
            return;
        }

        validation.checkValidations(data.userId, data.workflow, data.curr, data.prev, function(valErr, result) {

            if (result === true) {
                var curr = data.curr;
                var workflow = data.workflow;

                collapseBlocks(data.curr);

                var stepCount = steps.length;
                var timestamp = new Date();

                if (curr.data.stepOrder === stepCount - 1) {

                    curr.data.stepState = 'Approved';
                    workflow.data.state = 'Submit';
                    workflow.data = stripUnmatchedFields('wfApproval', workflow.data);
                    dm.update('dc', 'workflow', workflow, function(err, data) {

                        if (!_.isNull(err)) {
                            callback(err);
                        } else {
                            dm.update('dc', 'workflow', curr, function(err ,data) {
                                callback(err, { last: true });
                            });
                        }

                    });
                } else {

                    var next = steps[curr.data.stepOrder + 1];
                    copyData(next.data, curr.data);

                    curr.data.stepState = 'Approved';
                    next.data.stepState = 'Active';

                    console.dlog('Submitting Workflow Update');

                    orm.workflowActivity.save(data.token, {
                        workflowId: workflow.data.approvalId,
                        accountId: workflow.data.accountId,
                        requestor: workflow.data.requestor,
                        state: workflow.data.state,
                        status: workflow.data.status,
                        accountName: _.isUndefined(workflow.data.name) ? next.data.name : workflow.data.name,
                        updatedAt: timestamp,
                        currentApprover: next.data.approver
                    });

                    dm.updateItems('dc', 'workflow', [curr, next], function(err, result) {
                        callback(err);
                    });
                }
            } else {
                callback(valErr, result);
            }

        });
    });
}

function isWorkflowEditable(workflowId, stepId, callback) {

    orm.manager.fetchItems({
        itemType: 'wfApproval',
        category: 'workflow',
        sortBy: 'updatedAt',
        queryFilter: [
            [
                {
                    field: 'approvalId',
                    value: workflowId,
                    comparison: 'e'
                }
            ]
        ]
    }, function(err, workflowResult) {

        if (workflowResult.length === 0) {
            callback(null, true);
            return;
        }
        orm.manager.fetchItems({
            itemType: 'wfStep',
            category: 'workflow',
            sortBy: 'stepOrder',
            queryFilter: [
                [
                    {
                        field: 'stepId',
                        value: stepId,
                        comparison: 'e'
                    }
                ]
            ]
        }, function(err, stepResult) {

            var approval = workflowResult[0];
            var step = _.isEmpty(stepResult) || stepResult.length === 0
                ? null
                : stepResult[0];

            if (approval.data.status === 'Closed' || approval.data.state ===
                'Processed' || (!_.isNull(step) && step.data.stepState !== 'Active')) {
                callback(null, false);
            } else {
                callback(null, true);
            }
            step.data.stepState
        });
    });
}

/**
 * Description
 * @private
 * @method createWorkflow
 * @param {} db
 * @param {} data
 * @param {} callback
 * @return
 */
function createWorkflow(db, data, callback) {

    var workflow = data.workflow;
    var prev = data.prev;
    var curr = data.curr;
    collapseBlocks(data.prev);
    collapseBlocks(data.curr);

    curr.data.stepState = 'Approved';

    validation.checkValidations(data.userId, data.workflow, data.curr, data.prev, function(valErr, result) {

        if (result === true) {

            routes.calculateApprovers(db, data.userId, data.workflow, data.curr, data.prev, function(err, approvers) {

                if (!_.isNull(err)) {
                    callback(err, 'failure');
                    return;
                }

                var steps = [prev, curr];
                var isFirst = true;
                var timestamp = new Date();
                var currentApprover = null;

                for (var adx = 0; adx < approvers.length; adx++) {
                    var approver = approvers[adx];

                    currentApprover = (isFirst)
                        ? approver.userid
                        : currentApprover;

                    var id = utils.newUUID();

                    var step = {
                        headers: {
                            id: id,
                            type: "wfStep",
                            createdat: timestamp,
                            updatedat: timestamp
                        },
                        data: {
                            stepId: id,
                            stepOrder: adx + 2,
                            workflowId: workflow.data.approvalId,
                            stepState: (isFirst) ? 'Active' : 'Waiting',
                            approver: approver.userid,
                            approverPositionType: approver.positiontype
                        }
                    };

                    if (isFirst) {
                        isFirst = false;
                        copyData(step.data, curr.data);
                    }

                    steps.push(step);
                }

                steps.forEach(function(step, index) {
                    collapseBlocks(step);
                });

                if (approvers.length === 0) {
                    curr.data.stepState = 'Approved';
                    workflow.data.state = 'Submit';
                }

                console.dlog('Submitting New Workflow');

                orm.workflowActivity.save(data.token, {
                    workflowId: workflow.data.approvalId,
                    accountId: workflow.data.accountId,
                    requestor: workflow.data.requestor,
                    state: workflow.data.state,
                    status: workflow.data.status,
                    accountName: _.isUndefined(workflow.data.name)
                        ? data.curr.data.name
                        : workflow.data.name,
                    updatedAt: timestamp,
                    currentApprover: _.isNull(currentApprover)
                        ? data.userId
                        : currentApprover
                });

                dm.insert('dc', 'workflow', workflow, function(err1, result1) {
                    dm.insertItems('dc', 'workflow', steps, function(err2, result2) {

                        if (!_.isNull(err2) && !_.isUndefined(err)) {
                            callback(err2);
                            return;
                        }

                        if (approvers.length === 0) {
                            // No approvers needed, so submit to backend.
                            interface.process(workflow, curr, function(err, result3) {

                                if (!_.isNull(err) && !_.isUndefined(err)) {
                                    callback(err);
                                    return;
                                }

                                var timestamp = new Date();

                                var responseMessage = '' + result3.responseCode;

                                if (!_.isUndefined(result3.responseBody)) {
                                    responseMessage += ' '+result3.responseBody;
                                }

                                if (result3.responseCode === 200) {
                                    responseMessage += ' OK';
                                }

                                orm.workflowActivity.save(data.token, {
                                    workflowId: workflow.data.approvalId,
                                    accountId: workflow.data.accountId,
                                    requestor: workflow.data.requestor,
                                    accountName: _.isUndefined(workflow.data.name)
                                        ? data.curr.data.name
                                        : workflow.data.name,
                                    state: workflow.data.state,
                                    status: workflow.data.status,
                                    updatedAt: timestamp,
                                    currentApprover: data.curr.data.approver,
                                    backendResponseMessage: responseMessage
                                });

                                callback(null, 'success');
                            });

                        } else {
                            callback(null, 'success');
                        }
                    });
                });
            });

        } else {
            callback(valErr, result);
        }

    });
}

/**
 * Description
 * @private
 * @method overwriteData
 * @param {} step
 * @param {} data
 * @return
 */
function overwriteData(step, data) {
    for (var key in data) {

        if (typeof data[key] !== 'undefined') {
            step[key] = data[key];
        }
    }
}

/**
 * @private
 * Description
 * @method copyData
 * @param {} step
 * @param {} data
 * @return
 */
function copyData(step, data) {

    //var schemasByType = require('../../orm/schema').schemasByType;
    //var schema = sm.getSchema('wfStep');

    var schema = workflowForm.default.wfStep;

    for (var fdx = 0; fdx < schema.fields.length; fdx++) {
        var field = schema.fields[fdx];

        var value = data[field.name];

        if (typeof value === 'undefined')
            continue;

        step[field.name] = value;
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

/**
 * Description
 * @private
 * @method stripUnmatchedFields
 * @param {} type
 * @param {} data
 * @return output
 */
function stripUnmatchedFields(type, data) {

    var schema = sm.getSchema(type);
    var output = {};

    for (var fdx = 0; fdx < schema.fields.length; fdx++) {
        var field = schema.fields[fdx];
        var value = data[field.name];

        if (typeof value === 'undefined' || value === null)
            continue;

        output[field.name] = value;

        if (field.dataType === 'dimension') {
            output[field.name+'display'] = data[field.name+'display'];
        }
    }

    return output;
}