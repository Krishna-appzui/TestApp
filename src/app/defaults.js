/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Sets default values for any required environment variables that are not set.
 * @author Bryan Nagle
 * @class defaults
 * @date 4/2/14
 */
"use strict"

module.exports = {
    configure: function () {

        if (typeof process.env.PORT === 'undefined') {
            process.env.PORT = 3000;
        }

        if (typeof process.env.LS_HOST === 'undefined')
            process.env.LS_HOST = 'ldcloud-dev.liquidanalytics.com';

        if (typeof process.env.LS_PROTOCOL === 'undefined')
            process.env.LS_PROTOCOL = 'https'

        if (typeof process.env.OAUTH_HREF === 'undefined')
            process.env.OAUTH_HREF = 'https://ldcloud-dev.liquidanalytics.com';

        if (typeof process.env.PG_HOST === 'undefined') {
            process.env.PG_HOST = 'dev-vpc-daltile.coj4fuqfs6hi.us-east-1.rds.amazonaws.com';
        }

        if (typeof process.env.PG_PORT === 'undefined') {
            process.env.PG_PORT = 5432;
        }

        if (typeof process.env.PG_USER === 'undefined') {
            process.env.PG_USER = 'daltile';
        }

        if (typeof process.env.PG_PASSWORD === 'undefined') {
            process.env.PG_PASSWORD = '3PlhXh3X4wQPChH8'
        }

        if (typeof process.env.PG_DATABASE === 'undefined') {
            process.env.PG_DATABASE = 'daltile'
        }

        if (typeof process.env.COMMUNITY === 'undefined') {
            process.env.COMMUNITY = process.env.PG_DATABASE
        }

        if (typeof process.env.PG_SSL === 'undefined') {
            process.env.PG_SSL = true;
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_URL === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_URL = 'https://tst.virtualservices.mohawkind.com/';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PATH === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PATH = 'SOAT302/vDAL.eMPower.CustomerCreate.svc';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_USER === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_USER = 'empowerDAL';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PASSWORD === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PASSWORD = 'dalpower001';
        }
    },
    glazersQa: function () {

        if (typeof process.env.PORT === 'undefined') {
            process.env.PORT = 3000;
        }

        if (typeof process.env.LS_HOST === 'undefined')
            process.env.LS_HOST = 'ldcloud-qa.liquidanalytics.com';

        if (typeof process.env.LS_PROTOCOL === 'undefined')
            process.env.LS_PROTOCOL = 'https'

        if (typeof process.env.OAUTH_HREF === 'undefined')
            process.env.OAUTH_HREF = 'https://ldcloud-qa.liquidanalytics.com';

        if (typeof process.env.PG_HOST === 'undefined') {
            process.env.PG_HOST = 'dev-vpc-glazers.coj4fuqfs6hi.us-east-1.rds.amazonaws.com';
        }

        if (typeof process.env.PG_PORT === 'undefined') {
            process.env.PG_PORT = 5432;
        }

        if (typeof process.env.PG_USER === 'undefined') {
            process.env.PG_USER = 'glazers';
        }

        if (typeof process.env.PG_PASSWORD === 'undefined') {
            process.env.PG_PASSWORD = 'ziQcD7CWDb4E5jHz'
        }

        if (typeof process.env.PG_DATABASE === 'undefined') {
            process.env.PG_DATABASE = 'glazers_qa'
        }

        if (typeof process.env.COMMUNITY === 'undefined') {
            process.env.COMMUNITY = 'GLAZERS'
        }

        if (typeof process.env.PG_SSL === 'undefined') {
            process.env.PG_SSL = true;
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_URL === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_URL = 'https://tst.virtualservices.mohawkind.com/';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PATH === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PATH = 'SOAT302/vDAL.eMPower.CustomerCreate.svc';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_USER === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_USER = 'empowerDAL';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PASSWORD === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PASSWORD = 'dalpower001';
        }
    },
    daltileProd: function () {
        if (typeof process.env.PORT === 'undefined') {
            process.env.PORT = 3000;
        }

        if (typeof process.env.LS_HOST === 'undefined')
            process.env.LS_HOST = 'ldcloud.liquidanalytics.com';

        if (typeof process.env.LS_PROTOCOL === 'undefined')
            process.env.LS_PROTOCOL = 'https'

        if (typeof process.env.OAUTH_HREF === 'undefined')
            process.env.OAUTH_HREF = 'https://ldcloud.liquidanalytics.com';

        if (typeof process.env.PG_HOST === 'undefined') {
            process.env.PG_HOST = 'prod-vpc-daltile.coj4fuqfs6hi.us-east-1.rds.amazonaws.com';
        }

        if (typeof process.env.PG_PORT === 'undefined') {
            process.env.PG_PORT = 5432;
        }

        if (typeof process.env.PG_USER === 'undefined') {
            process.env.PG_USER = 'daltile';
        }

        if (typeof process.env.PG_PASSWORD === 'undefined') {
            process.env.PG_PASSWORD = '2YvxSwFRqzNgsA27'
        }

        if (typeof process.env.PG_DATABASE === 'undefined') {
            process.env.PG_DATABASE = 'daltile'
        }

        if (typeof process.env.COMMUNITY === 'undefined') {
            process.env.COMMUNITY = process.env.PG_DATABASE
        }

        if (typeof process.env.PG_SSL === 'undefined') {
            process.env.PG_SSL = true;
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_URL === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_URL = 'https://tst.virtualservices.mohawkind.com/';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PATH === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PATH = 'SOAT302/vDAL.eMPower.CustomerCreate.svc';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_USER === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_USER = 'empowerDAL';
        }

        if (typeof process.env.WF_CUSTOMER_BACKEND_PASSWORD === 'undefined') {
            process.env.WF_CUSTOMER_BACKEND_PASSWORD = 'dalpower001';
        }
    }
}