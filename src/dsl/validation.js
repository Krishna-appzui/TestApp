/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * validation
 * 4/4/14
 */

"use strict"

var orm = require('../../lib/orm');
var dm = orm.manager;
var async = require('async');
var _ = require('lodash');
var wf = require('../workflow/calculate');

module.exports = {

    workflowFormValidations: {
        wfStep: {
            name: {
                required: true
            },
            reasonForNewSuffix: {
                conditionalRequired: { field:'accountSuffix' }
            },
            distributionCenter: {
                required: true
            },
            priceClass: {
                required: true
            },
            reasonForClass: {
                conditionalRequired: { field:'priceClass' }
            },
            customerType: {
                required: true
            },
            salesTerritory: {
                required: true
            },
            region: {
                required: true
            },
            sbu: {
                required: true
            }
        },
        addresses: {
            addressType: {
                required: true
            },
            addressLine1: {
                required: true
            },
            postalCode: {
                required: true,
                usOrCdnPostal: { field: 'country' }
            },
            region: {
                required: true,
                matchLevel: { field: 'country', message: 'Please enter a valid region for the selected Country' }
            },
            country: {
                required: true
            },
            city: {
                required: true
            }
        },
        phones: {
            phoneNumber: {
                phoneUS: true
            }
        }
    },

    checkValidations: function (requestor, workflow, curr, prev, callback) {

        wf.expandBlocks(curr);

        async.parallel({
                priceClass: function(callback){
                    setTimeout(function(){

                        validatePriceClass(curr, function(err, result) {
                            callback(err, result);
                        });

                    }, 1000);
                },
                user: function(callback){
                    setTimeout(function(){

                        validateCustomerType(curr, function(err, result) {
                            callback(err, result);
                        });

                    }, 1000);
                },
                currDimensions: function(callback){
                    setTimeout(function(){

                        validateDistributionCenter(curr, function(err, result) {
                            callback(err, result);
                        });

                    }, 1000);
                }
            },
            function(err, results) {

                var success = true;
                var messages = [];

                _.values(results).forEach(function(result, index) {
                    if (result !== true) {
                        success = false;
                        messages.push(result);
                    }
                });

                if (messages.length === 0) {
                    callback(null, true);
                } else {
                    callback(new Error('Validation Failed'), messages);
                }

            });
    }
}

function validateDistributionCenter(curr, callback) {

    var paths = [ curr.data.salesTerritory, curr.data.distributionCenter ];

    orm.dimension.dimensionsForPaths(paths, function(err, result) {

        var dimensions = _.values(result);

        var salesTerritory = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.salesTerritory;
        });
        var distributionCenter = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.distributionCenter;
        });

        if (_.isUndefined(salesTerritory)) {
            callback(null, 'Invalid Sales Territory.');
            return;
        }

        if (_.isUndefined(distributionCenter)) {
            callback(null, 'Invalid SSC.');
            return;
        }

        var sscDepth = orm.dimension.depthForPathOrLevel('/Org/company/sbu/region');
        var expectedPathParent = orm.dimension.parentPathForDepth(salesTerritory.path, sscDepth);
        var valuePath = orm.dimension.parentDimensionForLevel(distributionCenter.path, '/Org/company/sbu/region');

        orm.dimension.dimensionsForPaths([expectedPathParent, valuePath], function(err, result) {

            if (_.isEmpty(result) || _.values(result).length != 2) {

                if (!_.isEmpty(result) && _.values(result).length == 1) {
                    callback(null, true);
                }
                else {
                    callback(null, 'Invalid SSC Name for selected sales rep.');
                }
            }
            else {

                var array = _.values(result);
                var d1 = array[0];
                var d2 = array[1];

                if ((distributionCenter.path.indexOf(expectedPathParent) !== -1 && distributionCenter.validforaccountcrud === 'Y') || (d1.crosssburegion == d2.crosssburegion)) {
                    callback(null, true);
                } else {
                    callback(null, 'Invalid SSC Name for selected sales rep.');
                }
            }
        });
    });
}

function validateCustomerType(curr, callback) {

    var paths = [ curr.data.salesTerritory, curr.data.customerType ];

    orm.dimension.dimensionsForPaths(paths, function(err, result) {

        var dimensions = _.values(result);

        var salesTerritory = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.salesTerritory;
        });
        var customerType = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.customerType;
        });

        if (_.isUndefined(salesTerritory)) {
            callback(null, 'Invalid Sales Rep.');
            return;
        }

        if (_.isUndefined(customerType)) {
            callback(null, 'Invalid Customer Type.');
            return;
        }

        var customerTypeDepth = orm.dimension.depthForPathOrLevel('/Org/company/sbu');
        var expectedSbu = orm.dimension.parentPathForDepth(salesTerritory.path, customerTypeDepth);

        if ((customerType.sbu === expectedSbu && customerType.country === salesTerritory.country) && customerType.validforaccountcrud === 'Y') {
            callback(null, true);
        } else {
            callback(null, 'Invalid Customer Type for selected sales rep.');
        }

    });

}

function validatePriceClass(curr, callback) {
    var paths = [ curr.data.salesTerritory, curr.data.priceClass ];

    orm.dimension.dimensionsForPaths(paths, function(err, result) {

        var dimensions = _.values(result);

        var salesTerritory = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.salesTerritory;
        });
        var priceClass = _.find(dimensions, function(dimension) {
            return dimension.path === curr.data.priceClass;
        });

        if (_.isUndefined(salesTerritory)) {
            callback(null, 'Invalid Sales Territory.');
            return;
        }

        if (_.isUndefined(priceClass)) {
            callback(null, 'Invalid Price Class.');
            return;
        }

        var priceRegionDepth = orm.dimension.depthForPathOrLevel('/Org/company/sbu/region');
        var expectedPriceRegion = orm.dimension.parentPathForDepth(salesTerritory.path, priceRegionDepth);
        priceClass.priceregion === expectedPriceRegion
        if ((priceClass.priceregion === expectedPriceRegion) || (priceClass.level === '/Account/priceClass' && priceClass.validforaccountcrud === 'Y' && _.isNull(priceClass.salesregion))) {
            callback(null, true);
        } else {
            callback(null, 'Invalid Customer Class for selected sales rep.');
        }

    });


}