/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * remoteQuery
 * @author Bryan Nagle
 * @date 7/9/14
 * @namespace
 * @module
 */

var express = require('express');
var router = express.Router();
var orm = require('../../../lib/orm');
var dm = orm.manager;
var core = require('../../../lib/core');

router.post('/', function(req, res) {

    var userId = req.body.userId;
    var token = req.body.token;
    var community = req.body.community;
    var query = req.body.query;

    if (typeof token === 'undefined' || typeof community === 'undefined') {
        res.redirect('/signin');
        return;
    }

    core.auth.validate(token, function(err, result) {

        query = query.replace(/ _/g, ' '+community+'_');

        orm.database.connect(function(err, client, done) {
            client.query(query, null, function (err, result) {
                done();  // Release the client instance

                if (!_.isEmpty(err))
                {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify([]));
                    return;
                }

                var data = [];

                result.rows.forEach(function(row, rowIndex) {
                    var rowData = {};

                    result.fields.forEach(function(field, fieldIndex) {
                        rowData[field.name] = row[field.name];
                    });

                    data.push(rowData);
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            });
        });
    });
});

module.exports = router;