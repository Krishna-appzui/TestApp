/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * routes
 * 4/4/14
 */
"use strict"

var orm = require('../../lib/orm');
var dm = orm.manager;
var async = require('async');
var _ = require('lodash');
var wf = require('../workflow/calculate');
var NO_APPROVERS = { approvers:[], priority:999 };

module.exports = {
    calculateApprovers: function (db, requestor, approval, curr, prev, callback) {

        async.series([
                function(callback) {
                    setTimeout(function(){
                        createAccountRule(1, requestor, approval, curr, prev, callback);
                    }, 1000);
                },
                function(callback){
                    setTimeout(function(){
                        accountSuffixChangeRule(2, requestor, approval, curr, prev, callback);
                    }, 1000);
                }
            ],
            // callback
            function(err, results) {

                if (!_.isUndefined(err) && !_.isNull(err)) {
                    callback(err, results);
                    return;
                }

                var accountCreateUsers = _.find(results, { name: 'createAccount' });

                if (!_.isUndefined(accountCreateUsers) && accountCreateUsers.approvers.length > 0) {
                    processResults([accountCreateUsers], requestor, function(err, userMaps) {
                        callback(err, userMaps);
                    });
                    return;
                }

                var accountSuffixUsers = _.find(results, { name: 'accountSuffix' });

                if (!_.isUndefined(accountSuffixUsers) && accountSuffixUsers.approvers.length > 0) {
                    processResults([accountSuffixUsers], requestor, function(err, userMaps) {
                        callback(err, userMaps);
                    });
                    return;
                }

                /*
                 These tasks are run in parallel to help maximize performance.  We pass priority
                 so that we can sort the results and process the user lists in the correct order
                 after all tasks have completed.
                 */
                async.parallel([
                        function(callback){
                            setTimeout(function() {
                                sscChangeRule(4, requestor, approval, curr, prev, callback);
                            }, 1000);
                        },
                        function(callback){
                            setTimeout(function() {
                                priceClassChangeRule(5, requestor, approval, curr, prev, callback);
                            }, 1000);
                        },
                        function(callback){
                            setTimeout(function() {
                                salesTerritoryChangeRule(3, requestor, approval, curr, prev, callback);
                            }, 1000);
                        }
                    ],
                    // callback
                    function(err, results) {

                        processResults(results, requestor, function(err, userMaps) {
                            callback(err, userMaps);
                        });
                    }
                );
            }
        );
    }
}

function processResults(results, requestor, callback) {

    // Sort results by priority
    var sortedResults = _.sortBy(results, function(taskResult) {
        return taskResult.priority;
    });

    // Pluck the approver arrays in to a parent array
    var approverLists = _.pluck(results, "approvers");

    // Combine, compact
    var userMaps = _.reject(wf.compactUserMaps(wf.combineUserMapLists(approverLists)), function(userMap) {
      return userMap.userid === requestor;
    });
    callback(null, userMaps);

}

function salesTerritoryChangeRule(priority, requestor, approval, curr, prev, callback) {

    //curr.data.salesterritory = "/Org/company[DTL]/sbu[SC]/region[07]/subRegion[07.0]/salesTerritory[007]";
    //prev.data.salesterritory = "/Org/company[DTL]/sbu[SC]/region[01]/subRegion[01.0]/salesTerritory[001]";

    if (curr.data.salesTerritory === prev.data.salesTerritory) {
        callback(null, NO_APPROVERS);
        return;
    }

    console.dlog('Sales Territory Route Triggered');

    async.series([
            function rsm(callback) {
                wf.findPositions(prev.data.distributionCenter, [
                    '/Org/company/sbu/region/subRegion'
                ], [
                    '/Org/positionType[RSM]'
                ], function(err, userMaps) {
                    callback(err, userMaps);
                });
            },

            function prevRsvp(callback) {

                wf.findPositions(prev.data.salesTerritory, [
                    '/Org/company/sbu/region'
                ], [
                    '/Org/positionType[RSVP]'
                ], function(err, userMaps) {
                    callback(err, userMaps);
                });

            },
            function currRsvp(callback) {

                wf.findPositions(curr.data.salesTerritory, [
                    '/Org/company/sbu/region'
                ], [
                    '/Org/positionType[RSVP]'
                ], function(err, userMaps) {
                    callback(null, userMaps);
                });
            }
        ],
        function(err, results){
            var userMaps = wf.combineUserMapLists(results);
            callback(null, { approvers:userMaps, priority:priority, name:'salesTerritory' });
        });
}

function sscChangeRule(priority, requestor, approval, curr, prev, callback) {

    //curr.data.distributioncenter = '/Org/company[DTL]/sbu[SC]/region[32]/subRegion[32.1]/ssc[195]';
    //prev.data.distributioncenter = '/Org/company[DTL]/sbu[SC]/region[07]/subRegion[07.1]/ssc[169]';

    if (curr.data.distributionCenter === prev.data.distributionCenter) {
        callback(null, NO_APPROVERS);
        return;
    }

    console.dlog('SSC Route Triggered');

    async.series([
            function prevSSC(callback) {

                wf.findPositions(prev.data.distributionCenter, [
                    '/Org/company/sbu/region/subRegion/ssc',
                    '/Org/company/sbu/region'
                ], [
                    '/Org/positionType[SSCMGR]',
                    '/Org/positionType[RSVP]'
                ], function(err, userMaps) {
                    callback(null, userMaps);
                });

            },
            function currSSC(callback) {

                wf.findPositions(curr.data.distributionCenter, [
                    '/Org/company/sbu/region'
                ], [
                    '/Org/positionType[RSVP]'
                ], function(err, userMaps) {
                    callback(null, userMaps);
                });
            }
        ],
        function(err, results){
            var userMaps = wf.combineUserMapLists(results);
            callback(null, { approvers:userMaps, priority:priority, name:'ssc' });
        });
}

function priceClassChangeRule(priority, requestor, approval, curr, prev, callback) {

    if (curr.data.priceClass === prev.data.priceClass) {
        callback(null, NO_APPROVERS);
        return;
    }

    console.dlog('Price Class Route Triggered');

    wf.findPositions(curr.data.distributionCenter, [
        '/Org/company/sbu/region/subRegion/ssc',
        '/Org/company/sbu/region',
        '/Org/company/sbu/'
    ], [
        '/Org/positionType[SSCMGR]',
        '/Org/positionType[RSVP]',
        '/Org/positionType[SBUVP]'
    ], function(err, userMaps) {
        callback(null, { approvers:userMaps, priority:priority, name:'priceClass' });
    });
}

function accountSuffixChangeRule(priority, requestor, approval, curr, prev, callback) {

    if (curr.data.accountSuffix === prev.data.accountSuffix) {
        callback(null, NO_APPROVERS);
        return;
    }

    console.dlog('Account Suffix Route Triggered');

    wf.findPositions(curr.data.distributionCenter, [
        '/Org/company/sbu/region/subRegion/ssc',
        '/Org/company/sbu/region'
    ], [
        '/Org/positionType[SSCMGR]',
        '/Org/positionType[RSVP]'
    ], function(err, userMaps) {
        callback(null, { approvers:userMaps, priority:priority, name:'accountSuffix' });
    });
}

function createAccountRule(priority, requestor, approval, curr, prev, callback) {

    if (typeof approval.data.accountId !== 'undefined') {
        callback(null, NO_APPROVERS);
        return;
    }

    console.dlog('Create Approval Route Triggered');

    dm.fetchUserAndPosition(requestor, function(err, user, position) {

        if (_.isUndefined(user)) {
            callback(new Error('No user record found for '+requestor), NO_APPROVERS);
            return;
        }

        if (_.isUndefined(position)) {
            callback(new Error('User '+requestor+' has not been assigned a valid position.'), NO_APPROVERS);
            return;
        }

        var orgPath = position.data.orgPath;

        if (typeof orgPath === 'undefined' || orgPath.length === 0) {
            callback(null, NO_APPROVERS);
            return;
        }

        wf.findPositions(curr.data.distributionCenter, [
            '/Org/company/sbu/region/subRegion/ssc',
            '/Org/company/sbu/region/subRegion'
        ], [
            '/Org/positionType[SSCMGR]',
            '/Org/positionType[RSM]'
        ], function(err, userMaps) {
            callback(null, { approvers:userMaps, priority:priority, name:'createAccount' });
        });

    });
}

