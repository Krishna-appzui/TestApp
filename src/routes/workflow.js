/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * workflow
 * @date 4/1/14
 * @Author Bryan Nagle
 * @class Workflow
 */

var express = require('express');
var router = express.Router();

/**
 * @method get
 * @param req
 * @param res
 */
router.post('/', function(req, res) {

    var userId = req.body.userId;
    var token = req.body.token;
    var community = req.body.community;
    var options = req.body.options;
    var accountId = req.body.accountId;
    var page = req.body.page;
    var workflowId = req.body.workflowId;

    var mobile = !_.isUndefined(req.body.mobile) && (req.body.mobile === '1' || req.body.mobile === true)
        ? true
        : false;

    if (_.isUndefined(userId)
        || _.isUndefined(token)
        || _.isUndefined(community)
        || _.isUndefined(page)) {
        res.redirect('/signin');
        return;
    }

    var auth = require('../../lib/core/auth');
    auth.validate(token, function(err, result) {

        if (!_.isNull(err) || _.isUndefined(result)) {
            res.status(401).send('Unauthorized');
            return;
        }

        res.cookie('userId', userId);
        res.cookie('token', token);
        res.cookie('community', community);

        var config = {
            host: process.env.LS_HOST,
            protocol: process.env.LS_PROTOCOL,
            oauthUrl: process.env.OAUTH_HREF,
            page: page,
            embedded:true,
            options: (_.isUndefined(options))
                ? {}
                : JSON.parse(options),
            accountId: accountId,
            workflowId: workflowId
        }

        config.options.mobile = _.isUndefined(mobile)
            ? config.options.mobile
            : mobile;

        /*
         If environment is development, reload cache every time so
         we can see live updates without having to restart the entire server.
         */
        if (process.env.NODE_ENV === 'development') {
            var cache = require('../app/cache');
            req.app.locals.cache = cache.devcache();
        }

        res.render('index', {config: config});
    });
});

router.get('/', function(req, res) {

    var userId = req.cookies.userId;
    var token = req.cookies.token;
    var community = req.cookies.community;

    if (typeof userId === 'undefined' || typeof token === 'undefined' || typeof community === 'undefined') {
        res.redirect('/signin');
        return;
    }

    var auth = require('../../lib/core/auth');
    auth.validate(token, function(err, result) {

        if (err !== null || typeof result === 'undefined') {
            res.status(401).send('Unauthorized');
            return;
        }

        var config = {
            host: process.env.LS_HOST,
            protocol: process.env.LS_PROTOCOL,
            oauthUrl: process.env.OAUTH_HREF,
            page: "WFCreateView",
            embedded:true
        }

        /*
         If environment is development, reload cache every time so
         we can see live updates without having to restart the entire server.
         */
        if (process.env.NODE_ENV === 'development') {
            var cache = require('../app/cache');
            req.app.locals.cache = cache.devcache();
        }

        res.render('index', {config: config});

    });

});

module.exports = router;