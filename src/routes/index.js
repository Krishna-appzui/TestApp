/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

var express = require('express');
var router = express.Router();
var app = require('../app');
var core = require('../../lib/core');
var utils = require('../../lib/utils');

/**
 * Description
 * @namespace server.routes
 * @module server.routes
 * @class Index
 */

/**
 * @method get
 * @param req
 * @param res
 */
router.get('/', function (req, res) {

    var sid = req.cookies.sid;

    core.session.get(sid, function(err, sess) {

        var userId = _.isUndefined(sess) || _.isUndefined(sess.userId)
            ? req.cookies.userId
            : sess.userId;

        var token = _.isUndefined(sess) || _.isUndefined(sess.token)
            ? req.cookies.token
            : sess.token;

        var community = _.isUndefined(sess) || _.isUndefined(sess.community)
            ? req.cookies.community
            : sess.community;

        /*
         If environment is development, reload cache every time so
         we can see live updates without having to restart the entire server.
         */
        if (process.env.NODE_ENV === 'development') {
            req.app.locals.cache = app.cache.devcache();
        }

        if (typeof token === 'undefined' || typeof community === 'undefined' || typeof userId === 'undefined') {
            res.redirect('/signin');
            return;
        }

        core.auth.validate(token, function(err, result) {

            if (err !== null || typeof result === 'undefined') {
                //res.status(401).send('Unauthorized');
                res.redirect('/signin');
                return;
            }

            var config = {
                host: process.env.LS_HOST,
                protocol: process.env.LS_PROTOCOL,
                oauthUrl: process.env.OAUTH_HREF,
                page: "LibraryView",
                mobile:false
            }

            res.render('index', {config: config});
        });
    });

});

router.get('/signin', function (req, res) {
    res.render('signin');
});

router.get('/version', function (req, res) {
    var pkg = utils.files.readJSON('./package.json');
    res.render('version', {pkg: pkg});
});

module.exports = router;