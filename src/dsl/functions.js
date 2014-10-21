/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * functions
 * @author Bryan Nagle
 * @date 9/15/14
 * @namespace
 * @module
 */

"use strict"

var _ = require('lodash');
var db = require('./../../lib/orm/database');

module.exports = {

    executeFunction: function(name, args, callback) {

        if (_.isUndefined(callback))
            return;

        var fn = this[name];

        if (typeof fn === 'function') {
            fn(args, callback);
        }
    },

    customDaltilePriceClassList: function (args, callback) {

        var priceRegion = _.find(args.attributes, function(attribute) {
            return attribute.attribute === 'priceregion';
        });

        var validForAccountCrud = _.find(args.attributes, function(attribute) {
            return attribute.attribute === 'validforaccountcrud';
        });

        var priceClassExceptions = _.find(args.attributes, function(attribute) {
            return attribute.custom === 'priceClassExceptions';
        });

        var sql = "select d.path, d.level, d.depth, d.display, d.sortorder, da.validforaccountcrud, da.country, da.sbu, da.priceregion, da.salesregion, da.crosssburegion " +
            "from daltile_dimension_dimension d left join " +
            "daltile_block_dimensionattributes da on (da.parent_id = d.h_id) where (d.level = '/Account/priceClass' and da.validforaccountcrud = 'Y' " +
            "and da.priceregion = $1) or (d.level = '/Account/priceClass' and da.validforaccountcrud = 'Y' and da.salesregion is null and da.country = $2) order by d.sortorder asc "

        var params = [ priceRegion.value, priceClassExceptions.value];

        console.dlog(sql);
        console.dlog(JSON.stringify(params));

        db.connect(function(err, client, done) {
            client.query(sql, params, function (err, result) {
                done();

                if (typeof err !== 'undefined' && err !== null) {
                    console.log(err);
                    callback(err, {});
                } else {
                    callback(null, result.rows);
                }
            });
        });
    },

    customDaltileSscList: function (args, callback) {

        var salesTerritory = _.find(args.attributes, function(attribute) {
            return attribute.field === 'salesTerritory';
        });

        var validForAccountCrud = _.find(args.attributes, function(attribute) {
            return attribute.attribute === 'validforaccountcrud';
        });


        var sql = "select da.crosssburegion from daltile_dimension_dimension d, daltile_block_dimensionattributes da "+
            "where d.path=$1 and da.parent_id = d.h_id";

        var param1 = [ salesTerritory.value ];

        console.log(sql);
        console.log(JSON.stringify(param1));

        db.connect(function(err, client, done) {
            client.query(sql,param1,function(err,result){
                var sql = "select otherd.path from daltile_dimension_dimension d left join daltile_block_dimensionattributes da " +
                    "on (da.parent_id = d.h_id) left join daltile_block_dimensionattributes otherda on " +
                    "(da.crosssburegion = otherda.crosssburegion) left join  daltile_dimension_dimension otherd on " +
                    "(otherda.parent_id = otherd.h_id) where d.path = $1";

                result.rows.forEach(function(row, index) {
                    if(row.crosssburegion === null){
                        sql = "select d.path from daltile_dimension_dimension d left join daltile_block_dimensionattributes da"+
                            " on (da.parent_id = d.h_id) left join  daltile_dimension_dimension otherd on (da.parent_id = otherd.h_id)"+
                            " where d.path = $1";
                    }
                    //break the loop
                    return false;
                });

                var param1 = [ salesTerritory.value ];

                client.query(sql, param1, function (err, result) {

                    if (typeof err !== 'undefined' && err !== null) {
                        console.log(err);
                        callback(err, {});
                    } else {
                        var param2 = [ args.level ];

                        var sql2 = "select d.path, d.level, d.depth, d.display, d.sortorder, da.validforaccountcrud, " +
                            "da.country, da.sbu, da.priceregion, da.salesregion, da.crosssburegion from " +
                            "daltile_dimension_dimension d left join daltile_block_dimensionattributes da " +
                            "on (da.parent_id = d.h_id) where d.level = $1 and da.validforaccountcrud = 'Y' and (";

                        var isFirst = true;

                        result.rows.forEach(function(row, index) {

                            var p = index + 2;
                            var region = row.path;

                            if (isFirst) {
                                isFirst = false;
                                sql2 += "d.path like $"+p+" || '%' "
                            }
                            else {
                                sql2 += "or d.path like $"+p+" || '%' "
                            }

                            param2.push(row.path)
                        });

                        sql2 += ") order by d.sortorder asc";

                        console.log(sql2);
                        console.log(JSON.stringify(param2));

                        client.query(sql2, param2, function (err, result) {
                            done();

                            if (typeof err !== 'undefined' && err !== null) {
                                console.log(err);
                                callback(err, {});
                            } else {
                                callback(null, result.rows);
                            }
                        });
                    }
                });
            });


        });
    }
}