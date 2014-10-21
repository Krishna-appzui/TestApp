/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Item
 * @author Bryan Nagle
 * @date 6/2/14
 * @namespace
 * @module
 */

var Item = {
    valueForComplexKey: function(item, field) {

        var data = _.isUndefined(item.data)
            ? item
            : item.data;

        if (field.indexOf('/') === -1) {
            return data[field];
        }
        else if (field.indexOf('[') !== -1 && field.indexOf('=') !== -1)  {
            var blockField = field.match(/(.*?)\[/)[1];
            var components = field.match(/\[(.*?\])/)[1].split('=');
            var block = this.findBlock(data[blockField], components[0], components[1]);
            var bField = _.last(field.split('/'));
            return _.isUndefined(block)
                ? undefined
                : block.data[bField];
        }
    },
    findBlock: function(blocks, field, value) {
        return _.find(blocks, function(block) {
            return block.data[field] === value;
        });
    }
}