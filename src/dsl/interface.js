/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * interface
 * 4/15/14
 */

"use strict"

var orm = require('../../lib/orm');
var dm = orm.manager;
var d = orm.dimension;
var wf = require('../workflow/calculate');
var async = require('async');
var _ = require('lodash');
var request = require('request-json');

// CustomerCreateUpdateRequest Interface
module.exports = {
    process: function (workflow, curr, callback) {

        if (_.isUndefined(workflow.data.requestor))
            return;

        wf.expandBlocks(curr);

        async.parallel({
                original: function(callback){
                    setTimeout(function(){

                        if (_.isUndefined(workflow.data.accountId)) {
                            callback(null);
                            return;
                        }

                        wf.fetchAccount(workflow.data.accountId, function(err, account) {

                            if (_.isUndefined(account)) {
                                callback(null);
                                return;
                            }

                            wf.fetchBlocks(account, function(faultedAccount) {
                                d.dimensionsForItem(account, function(err, dimensionsByPath) {
                                    callback(null, { account: faultedAccount, dimensions:dimensionsByPath });
                                });
                            });

                        });

                    }, 1000);
                },
                user: function(callback){
                    setTimeout(function(){

                        dm.fetchUserAndPosition(workflow.data.requestor, function(err, user, position) {
                            callback(null, user);
                        });

                    }, 1000);
                },
                currDimensions: function(callback){
                    setTimeout(function(){

                        d.dimensionsForItem(curr, function(err, dimensionsByPath) {
                            callback(null, dimensionsByPath);
                        });

                    }, 1000);
                }
            },
            function(err, results) {

                if (typeof results === 'undefined' ||
                    typeof results.user === 'undefined') {
                    process.nextTick(function() {
                        callback(new Error('Missing Data'));
                    });
                    return;
                }

                var requestSchema = {};

                if (typeof results.original === 'undefined' ||  typeof results.original.account === 'undefined') {
                    results.original = {};
                    results.original.account = orm.item.instance();
                    requestSchema.RequestType = 'Create';
                } else {
                    requestSchema.RequestType = 'Update';
                }

                wf.expandBlocks(results.original.account);

                var billToAddress = findBlock(curr.data.addresses, 'addressType', '/Data/communicationType[CustomerBillTo]');
                var billToPhone = orm.item.instance();
                var billToFax = orm.item.instance();
                var shipToAddress = findBlock(curr.data.addresses, 'addressType', '/Data/communicationType[CustomerShipTo]');
                var shipToPhone = findBlock(curr.data.phones, 'phoneType', '/Data/communicationType[Work]');
                var shipToFax = findBlock(curr.data.phones, 'phoneType', '/Data/communicationType[WorkFax]');

                var oldBillToAddress = findBlock(results.original.account.data.addresses, 'addressType', '/Data/communicationType[CustomerBillTo]');
                var oldBillToPhone = orm.item.instance();
                var oldBillToFax = orm.item.instance();
                var oldShipToAddress = findBlock(results.original.account.data.addresses, 'addressType', '/Data/communicationType[CustomerShipTo]');
                var oldShipToPhone = findBlock(results.original.account.data.phones, 'phoneType', '/Data/communicationType[Work]');
                var oldShipToFax = findBlock(results.original.account.data.phones, 'phoneType', '/Data/communicationType[WorkFax]');

                var account = results.original.account;
                var user = results.user;

                if (typeof billToAddress === 'undefined') billToAddress = orm.item.instance();
                if (typeof billToPhone === 'undefined') billToPhone = orm.item.instance();
                if (typeof shipToAddress === 'undefined') shipToAddress = orm.item.instance();
                if (typeof shipToPhone === 'undefined') shipToPhone = orm.item.instance();
                if (typeof shipToFax === 'undefined') shipToFax = orm.item.instance();

                if (typeof oldBillToAddress === 'undefined') oldBillToAddress = orm.item.instance();
                if (typeof oldBillToPhone === 'undefined') oldBillToPhone = orm.item.instance();
                if (typeof oldBillToFax === 'undefined') oldBillToFax = orm.item.instance();

                if (typeof oldShipToAddress === 'undefined') oldShipToAddress = orm.item.instance();
                if (typeof oldShipToPhone === 'undefined') oldShipToPhone = orm.item.instance();
                if (typeof oldShipToFax === 'undefined') oldShipToFax = orm.item.instance();

                if (typeof account === 'undefined') account = orm.item.instance();
                if (typeof user === 'undefined') user = orm.item.instance();

                var mapper = new CustomerFieldMapper(results.original.dimensions);

                mapper.map(workflow, {
                    RequestId: 'approvalId'
                });

                mapper.map(account, {
                    AccountId: 'accountId',
                    CustomerBase: 'accountPrefix',
                    Old_CustomerClass: 'member(priceClass)',
                    Old_CustomerType: 'member(customerType)',
                    Old_Suffix: 'accountSuffix',
                    Old_SalesTerritoryName: 'display(salesTerritory)',
                    Old_SalesTerritory: 'member(salesTerritory)',
                    Old_HomeSSC_Name: 'display(distributionCenter)',
                    Old_HomeSSC: 'member(distributionCenter)',
                    Old_SBU: 'member(sbu)',
                    Old_SalesRegion: 'member(region)',
                    Old_SalesRegionName: 'regiondisplay'
                });

                mapper.map(oldBillToAddress, {
                    Old_BillToAddressLine1: 'addressLine1',
                    Old_BillToAddressLine2: 'addressLine2',
                    Old_BillToAddressLine3: 'addressLine3',
                    Old_BillToCountry: 'member(country)',
                    Old_BillToCity: 'city',
                    Old_BillToState: 'member(region)',
                    Old_BillToPostalCode: 'postalCode'
                });

                mapper.map(oldBillToPhone, {
                    Old_BillToPhone: 'phoneNumber'
                });

                mapper.map(oldBillToFax, {
                    Old_BillToFax: 'phoneNumber'
                });

                mapper.map(oldShipToPhone, {
                    Old_ShipToPhone: 'phoneNumber'
                });

                mapper.map(oldShipToFax, {
                    Old_ShipToFax: 'phoneNumber'
                });

                mapper.map(oldShipToAddress, {
                    Old_ShipToAddressLine1: 'addressLine1',
                    Old_ShipToAddressLine2: 'addressLine2',
                    Old_ShipToAddressLine3: 'addressLine3',
                    Old_ShipToCountry: 'member(country)',
                    Old_ShipToCity: 'city',
                    Old_ShipToState: 'member(region)',
                    Old_ShipToPostalCode: 'postalCode'
                });

                mapper.map(curr, {
                    CustomerName: 'name',
                    CustomerSuffix: 'accountSuffix',
                    RequestCreateDate: 'h_createdat',
                    New_ShipToName: 'name',
                    New_CustomerClass: 'member(priceClass)',
                    New_CustomerType: 'member(customerType)',
                    New_Suffix: 'accountSuffix',
                    New_SalesTerritoryName: 'salesTerritoryDisplay',
                    New_SalesTerritory: 'member(salesTerritory)',
                    New_HomeSSC_Name: 'distributionCenterDisplay',
                    New_HomeSSC: 'member(distributionCenter)',
                    New_SBU: 'member(sbu)',
                    New_PO_RequiredInd: 'isPoRequired',
                    ReasonFor_NewSuffix: 'reasonForNewSuffix',
                    ReasonFor_Class: 'reasonForClass',
                    DoingBusinessAS: 'alternateName',
                    Comments: 'comments',
                    New_Contact: 'contact',
                    New_SalesRegion: "member(region)",
                    New_SalesRegionName: "regionDisplay"
                });

                mapper.map(billToAddress, {
                    New_BillToAddressLine1: 'addressLine1',
                    New_BillToAddressLine2: 'addressLine2',
                    New_BillToAddressLine3: 'addressLine3',
                    New_BillToCountry: 'member(country)',
                    New_BillToCity: 'city',
                    New_BillToState: 'member(region)',
                    New_BillToPostalCode: 'postalCode'
                });

                mapper.map(billToPhone, {
                    New_BillToPhone: 'phoneNumber'
                });

                mapper.map(billToFax, {
                    New_BillToFax: 'phoneNumber'
                });

                mapper.map(shipToAddress, {
                    New_ShipToAddressLine1: 'addressLine1',
                    New_ShipToAddressLine2: 'addressLine2',
                    New_ShipToAddressLine3: 'addressLine3',
                    New_ShipToCountry: 'member(country)',
                    New_ShipToCity: 'city',
                    New_ShipToState: 'member(region)',
                    New_ShipToPostalCode: 'postalCode'
                });

                mapper.map(shipToPhone, {
                    New_ShipToPhone: 'phoneNumber'
                });

                mapper.map(shipToFax, {
                    New_ShipToFax: 'phoneNumber'
                });

                mapper.map(user, {
                    RequestByName: 'name'
                });

                requestSchema = _.extend(requestSchema, mapper.generateRequest());

                var client = request.newClient(process.env.WF_CUSTOMER_BACKEND_URL);
                client.setBasicAuth(process.env.WF_CUSTOMER_BACKEND_USER, process.env.WF_CUSTOMER_BACKEND_PASSWORD);

                client.post(process.env.WF_CUSTOMER_BACKEND_PATH, { CustomerCreateUpdateRequest:requestSchema }, function(err, res, body) {

                    if (typeof err === 'undefined' || err !== null || res.statusCode !== 200) {
                        console.dlog('Workflow Customer Response: ' + res.statusCode);
                        callback(err, 'failure');
                        return;
                    }

                    workflow.data.state = 'Processed';
                    workflow.data.status = 'Closed';

                    dm.updateItems('dc', 'workflow', [workflow], function(err, result) {
                        console.dlog('Workflow Customer Response: ' + res.statusCode);
                        callback(null, { workflow: workflow, responseCode: res.statusCode, responseBody: res.Body });
                        return;
                    });
                });
            }
        );
    }
}

function splitName(name) {

    var first;
    var last;

    if (typeof name !== 'undefined' && name !== null && name.length > 0) {

        var components = name.split(' ');

        if (typeof components !== 'undefined' && components.length > 1) {
            first = components[0];
            last = components[1];
        }
    }

    return { first: first, last:last }
}

function transformDimensionPath(dimensionPath) {
    if (typeof dimensionPath === 'undefined' || dimensionPath === null)
        return '';

    var member = orm.dimension.memberForPath(dimensionPath);
    return (typeof member === 'undefined' || member === null) ? '' : member;
}

function findBlock(blocks, field, value) {

    return _.find(blocks, function(block) {
        return block.data[field] === value;
    });

}

function CustomerFieldMapper(dimensionsByPath) {
    this.dimensionsByPath = dimensionsByPath;
    this.result = {};

    if (typeof this.dimensionsByPath === 'undefined' || this.dimensionsByPath === null) {
        this.dimensionsByPath = {};
    }
};


CustomerFieldMapper.prototype.getValue = function(item, key) {

    if (key === '')
        return '';

    var value;

    if (item === undefined) {
        console.log('arg');
    }

    if (key.indexOf('h_') !== -1 || key.indexOf('parent_') !== -1) {
        value = item.headers[key.substr(2)];
    } else {
        value = item.data[key];
    }

    if (typeof value === 'undefined' || value === null) {
        value = '';
    }

    return value;
};

CustomerFieldMapper.prototype.parse = function(input) {

    if (input.indexOf('(') === -1) {
        return { value: input };
    }

    var fName = input.match(/.+?(?=\()/)[0];
    var value = input.match(/\((.*?)\)/)[1];
    return { func: fName, value: value };
};

CustomerFieldMapper.prototype.map = function(item, fieldMapping) {

    for (var toKey in fieldMapping) {
        var fromKey = fieldMapping[toKey];

        var parsed = this.parse(fromKey);

        switch(parsed.func) {

            case 'regionMember':
                var value = this.getValue(item, parsed.value);
                var region = orm.dimension.parentPathForDepth(value, 3);
                this.result[toKey] = transformDimensionPath(region);
                break;

            case 'firstName':
                var value = this.getValue(item, parsed.value);
                var userName = splitName(value);
                this.result[toKey] = userName.first;
                break;

            case 'lastName':
                var value = this.getValue(item, parsed.value);
                var userName = splitName(value);
                this.result[toKey] = userName.last;
                break;

            case 'member':
                var path = this.getValue(item, parsed.value);
                this.result[toKey] = transformDimensionPath(path);
                break;

            case 'display':
                var path = this.getValue(item, parsed.value);

                if (typeof path === 'undefined' || path === null || path.length === 0) {
                    this.result[toKey] = '';
                    continue;
                }

                var dimension = this.dimensionsByPath[path];

                if (typeof dimension !== 'undefined' && dimension !== null) {
                    this.result[toKey] = dimension.display;
                } else {
                    this.result[toKey] = '';
                }

                break;

            default:
                this.result[toKey] = this.getValue(item, parsed.value);
                break;
        }
    }
};

CustomerFieldMapper.prototype.generateRequest = function() {

    var self = this;

    Object.keys(this.result).forEach(function(key, index) {

        if (key.indexOf('Old_') === -1 || typeof self.result[key] === 'undefined')
            return;

        var matchingKey = 'New_'+key.substr(4);

        if (typeof self.result[matchingKey] !== 'undefined' && self.result[matchingKey] !== null && self.result[matchingKey].length > 0)
            return;

        self.result[matchingKey] = self.result[key];

    });

    Object.keys(this.result).forEach(function(key, index) {

        if (key.indexOf('New_ShipTo') === -1)
            return;

        var billKey = 'New_BillTo'+key.substr(10);

        if (typeof self.result[billKey] !== 'undefined' && self.result[billKey] !== null && self.result[billKey].length > 0)
            return;

        self.result[billKey] = self.result[key];
    });

    return this.result;
};