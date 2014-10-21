/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * @Author Bryan Nagle
 * @date 4/8/14
 * @namespace server.workflow
 * @module server.workflow
 */

"use strict"

var orm = require('../../lib/orm');
var db = orm.database;
var _ = require('lodash');
var async = require('async');
var sql = require('sql');
var d = require('../../lib/orm/dimension');
var sm = require('../../lib/orm/schema');

/**
 * @class Calulate
 * @namespace server.workflow
 */
module.exports = {

    findBlock: function(blocks, field, value) {
        return _.find(blocks, function(block) {
            return block.data[field] === value;
        });
    },

    /**
     * For a given path, iterate through the parent dimensions that match the
     * specified list of levels, and for each dimension, look for any of the
     * specified position types.
     *
     * @method findPositions
     * @param path - The path to iterate upwards from.
     * @param levels - The levels of the path we need to match.
     * @param positionTypes - The positionTypes to look for
     * @param callback - The completion callback
     */
    findPositions: function(path, levels, positionTypes, callback) {

        if (typeof path === 'undefined') {
            callback(null, []);
            return;
        }

        var tasks = [];

        var taskFunc = function(alevel) {
            return function task(callback) {

                var npath = d.parentDimensionForLevel(path, alevel);

                var positionTable = sql.define({
                    name: 'daltile_org_position',
                    columns: [ "h_id", "userid", "orgpath", "positiontype", "sortorder" ]
                });

                var from = positionTable
                    .select(positionTable.star()).from(positionTable).where(positionTable.orgpath.equals(npath));

                var ors;

                positionTypes.forEach(function(positionType, index) {
                    if (typeof ors === 'undefined') {
                        ors = positionTable.positiontype.equals(positionType);
                    } else {
                        ors = ors.or(positionTable.positiontype.equals(positionType));
                    }
                });

                var query = from.and(ors).order(positionTable.sortorder).toQuery();

                console.dlog(query.text);
                console.dlog(JSON.stringify(query.values));

                db.connect(function connect(err, client, done) {
                    client.query(query.text, query.values, function results(err, result) {
                        done();

                        if ((err !== null && typeof err !== 'undefined') || result.rows.length === 0) {
                            callback(err, {});
                        } else {

                            var userid = result.rows[0].userid;
                            var positiontype = result.rows[0].positiontype;

                            if (typeof userid === 'undefined' || userid === null)
                                userid = '';

                            if (typeof positiontype === 'undefined' || positiontype === null)
                                positiontype = '';

                            callback(null, { userid:userid, positiontype:positiontype });
                        }
                    });
                });
            };
        };

        levels.forEach(function createTasks(level, index) {
            tasks.push(taskFunc(level));
        });

        async.series(tasks,
            function(err, results){
                callback(null, results);
            });
    },

    /**
     * Combines an array of arrays of user maps (each array is the result of one route) in
     * to a single list of users that are required for approval and notification.
     *
     * Each array is already sorted by the level of the lookup dimension, such as orgPath,
     * salesTerritory, ssc, etc.  We use standard lodash set methods to reduce this.
     *
     * Example, start with: [ [ u1, u2, u3 ], [ u2, u3, u4 u5] ],
     * Zip flips this to [ [ u1 , u2 ], [ u2, u3 ], [ u3, u4 ], [ u5 ] ].
     * Flatten turns this in to a single array,  [ u1, u2, u2, u3, u3, u4, u5 ].
     * Unique removes dupes, [ u1, u2, u3, u4, u5 ],
     * and this is our final user list.
     *
     * @method combineUserMapLists
     * @param {array} userMapLists - Array of Arrays of UserMaps.
     */
    combineUserMapLists: function(userMapLists) {

        var zipList = null;

        if (userMapLists.length === 1) {
            zipList = userMapLists;
        } else {
            zipList = _.zip.apply(null, userMapLists);
        }

        var combinedUserMapList = _.uniq(_.flatten(zipList, true), false, function(userMap, index, list) {
            return (typeof userMap !== 'undefined' && typeof userMap.userid !== 'undefined') ? userMap.userid : '';
        });

        return combinedUserMapList;
    },

    /**
     * Remove all falsy maps from the final user list
     *
     * The routes module inserts blank "NO_APPROVERS" objects to preserve the depth of
     * the lookup dimension. But once we've sorted our final list, we no longer need these
     * place holders, so we remove them.
     *
     * @method compactUserMaps
     * @param {array} The final, single, already sorted list of users.
     */
    compactUserMaps: function(userMaps) {

        var reject = function rejectFunc(userMap) {

            if (typeof userMap === 'undefined'
                || userMap === null
                || typeof userMap.userid === 'undefined'
                || userMap.userid === null
                || userMap.userid === "null"
                || userMap.userid === "\"null\""
                || userMap.userid.length === 0)
                return true;

            return false;
        };

        var validUserMaps = _.reject(userMaps, reject);
        return validUserMaps;
    },
    /**
     * For a given approval workflow, fetch its related steps.
     *
     * @method fetchStepsForWorkflow
     * @param approval - The wfApproval item
     * @param callback - Completion callback
     */
    fetchStepsForWorkflow: function(approval, callback) {

        if (typeof callback === 'undefined')
            return;

        var stepTable = sql.define({
            name: 'dc_workflow_wfstep',
            columns: ['h_id', 'workflowid', 'steporder']
        });

        var query = stepTable.select(stepTable.star())
            .from(stepTable)
            .where(stepTable.workflowid.equals(approval.data.approvalId))
            .order(stepTable.steporder).toQuery();

        db.connect(function(err, client, done) {
            client.query(query.text, query.values, function (err, result) {
                done();

                var steps = orm.item.parseQueryResult('wfStep', result);
                callback(steps);
            });
        });
    },

    addCalculatedFields: function(account, callback) {

        var salesTerritory = account.data.salesTerritory;

        if (typeof salesTerritory === 'undefined' || salesTerritory === null || salesTerritory.length === 0) {
            account.data.region = '';
            account.data.regionDisplay = '';
            account.data.sbu = '';
            process.nextTick(function() {
                callback(null, account);
            });
            return;
        }

        //var depth = orm.dimension.depthForMember(salesTerritory, 'region');
        var region = orm.dimension.parentPathForDepth(salesTerritory, orm.dimension.depthForMember(salesTerritory, 'region'));
        var sbu = orm.dimension.parentPathForDepth(salesTerritory, orm.dimension.depthForMember(salesTerritory, 'sbu'));

        account.data.region = region;
        account.data.sbu = sbu;

        orm.dimension.dimensionsForPaths([region, sbu], function(err, result) {
            account.data.regiondisplay = result[region].display;
            account.data.sbudisplay = result[sbu].display;
            callback(null, account);
        });
    },

    /**
     * For a given accountid, fetch the account item from the database.
     * TODO:  Move this in to data-manager.
     *
     * @method fetchAccount
     * @param accountid - the accountId of the item we want.
     * @param callback - Completion callback
     */
    fetchAccount: function(accountId, callback) {

        var self = module.exports;

        orm.manager.fetchItems({
            itemType: 'Account',
            category: 'entity',
            sortBy: 'name',
            queryFilter: [
                [
                    {
                        field: 'accountId',
                        value: accountId,
                        comparison: 'e'
                    }
                ]
            ]
        }, function(err, result) {

            if (result.length === 0) {
                callback(new Error('Account Not Found'));
                return;
            }

            var account = result[0];

            self.addCalculatedFields(account, function(err, result) {
                callback(null, result);
            });

        });
    },

    /**
     * For a given accountid, fetch the account item from the database, along
     * with all referenced dimensions.
     * TODO:  We don't actually need to do this anymore;  I (BN) have written
     * a generic fetch method that auto faults blocks and dimensions;  we just
     * need to switch this over to use it.
     *
     * @method fetchAccountWithDimensions
     * @param accountid - the accountId of the item we want.
     * @param callback - Completion callback
     */
    fetchAccountWithDimensions: function(accountId, callback) {

        var schemasByType = sm.schemasByType;
        var schema = schemasByType['Account'];

        module.exports.fetchAccount(accountId, function(err, account) {

            var paths = [];

            for (var fdx = 0; fdx < schema.fields.length; fdx++) {
                var field = schema.fields[fdx];

                if (field.dataType !== 'dimension')
                    continue;

                var value = account.data[field.name];

                if (typeof value !== 'undefined')
                    paths.push(value);

            }

            d.dimensionsForPaths(paths, function(err, dimensionsByPath) {
                callback(err, account, dimensionsByPath);
            });
        });
    },

    /**
     * Deserialize the JSON strings of blocks stored on the step item.
     * In order to keep track of blocks changes on our steps, we serialize
     * them to JSON and write them in to the database as text for the parent's
     * field column.  Before we can actually work with this data, we need to
     * convert it back to a proper Javascript object.
     *
     * @method expandBlocks
     * @param item - The item (wfStep) to deserialize the blocks on.
     */
    expandBlocks: function(item) {

        module.exports.expandBlockField(item, 'addresses');
        module.exports.expandBlockField(item, 'phones');
        module.exports.expandBlockField(item, 'emails');
    },

    /**
     * Convert the json string stored on the item field back in to a proper
     * Javascript object.
     *
     * @method expandBlockField
     * @param item - The item (wfStep) to deserialize the blocks on.
     * @param field - The field on the item to deserialize.
     */
    expandBlockField: function (item, field) {

        if (typeof item.data[field] === 'string') {
            var blockList = JSON.parse(item.data[field]);
            item.data[field] = blockList;

            blockList.forEach(function(block, index) {
                var itemSchema = sm.getSchema(block.headers.type);

                itemSchema.fields.forEach(function(field, index) {

                    if (field.name === field.name.toLowerCase())
                        return;

                    if (typeof block.data[field.name.toLowerCase()] !== 'undefined') {
                        block.data[field.name] = block.data[field.name.toLowerCase()];
                        delete block.data[field.name.toLowerCase()];
                    }

                });
            });

        }
    },

    /**
     * For a given account, fetch all of its blocks, and insert them on the item.
     * TODO:  I have now written a generic item fetch method that auto faults
     * blocks and dimensions;  as a result, we no longer need this.  Switch the
     * code over to use the new method and delete this one.
     *
     * @method fetchBlocks
     * @deprecated
     * @param account
     * @param callback
     */
    fetchBlocks: function(account, callback) {

        if (typeof account === 'undefined') {
            callback(account);
            return;
        }

        db.connect(function(err, client, done) {
            async.series([
                function(callback) {

                    getBlocks(client, 'daltile', 'Address', account, 'addresses', function(addresses) {
                        account.data.addresses = JSON.stringify(addresses);
                        callback(null, 'one');
                    });

                },
                function(callback){

                    getBlocks(client, 'daltile', 'Email', account, 'emails', function(emails) {
                        account.data.emails = JSON.stringify(emails);
                        callback(null, 'two');
                    });

                },
                function(callback){

                    getBlocks(client, 'daltile', 'Phone', account, 'phones', function(phones) {
                        account.data.phones = JSON.stringify(phones);
                        callback(null, 'three');
                    });

                }
            ], function(err, results) {
                done();
                callback(account);
            });

        });
    }
}

/**
 * Get all of the blocks of a specific type for a specific field on a specific
 * item.
 * TODO:  We don't need this anymore;  see TODO for fetchBlocks.
 *
 * @method getBlocks
 * @private
 * @deprecated
 * @param client
 * @param {String} namespace
 * @param {String} blockType
 * @param {Item} parent
 * @param {String} field
 * @param callback
 */
function getBlocks(client, namespace, blockType, parent, field, callback) {

    var blockTable = sql.define({
        name: namespace+'_block_'+blockType.toLowerCase(),
        columns: ['parent_id', 'parent_type', 'parent_fieldname', 'parent_sequence']
    });

    var parentId = parent.headers.id;
    var parentType = parent.headers.type;

    var query = blockTable.select(blockTable.star())
        .from(blockTable)
        .where(blockTable.parent_id.equals(parentId), blockTable.parent_type.equals(parentType), blockTable.parent_fieldname.equals(field)).order(blockTable.parent_sequence).toQuery();


    client.query(query.text, query.values, function (err, result) {

        if (typeof err !== 'undefined' && err !== null) {
            callback([]);
        } else {
            var blocks = orm.item.parseQueryResult(blockType, result);
            callback(blocks);
        }
    });
}