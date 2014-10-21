/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Socket Endpoint for a request to compare two step items and return a diff document.
 * @date 4/8/14
 * @Author Bryan Nagle
 * @namespace server.socket.workflow
 * @module server.socket.workflow
 * @class Compare
 */

var wf = require('../../workflow/calculate')

/**
 * @method handler
 * @param db
 * @param socket
 * @returns {Function}
 */
exports.handler = function(db, socket) {

    return function (data) {
        var response = require('../../../lib/core/socketResponse').response(socket, 'compareSteps', data);

        if (typeof data.token === 'undefined'
            || typeof data.userId === 'undefined'
            || typeof data.prev === 'undefined'
            || typeof data.curr === 'undefined'
            || typeof data.prev === 'undefined'
            || typeof data.curr === 'undefined') {
            response('Missing Parameters');
            return;
        }

        wf.expandBlocks(data.prev);
        wf.expandBlocks(data.curr);

        var compare = require('../../../lib/orm/itemDiff');
        var doc = compare.compare(data.curr, data.prev);

        response(null, { prev:data.prev, curr:data.curr, diff:doc });
    }
}

/**
 * Description
 * @method expandBlocks
 * @param {} item
 * @return 
 *//*
function expandBlocks(item) {

    expandBlockField(item, 'addresses');
    expandBlockField(item, 'phones');
    expandBlockField(item, 'emails');
}*/

/**
 * Description
 * @method expandBlockField
 * @param {} item
 * @param {} field
 * @return 
 *//*
function expandBlockField(item, field) {

    if (item === null || typeof item === 'undefined')
        return;

    if (typeof item.data[field] === 'string') {
        item.data[field] = JSON.parse(item.data[field]);
    }
}*/