/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

var DimensionManager = {

    depthForPathOrLevel: function(input) {

        if (typeof input === 'undefined' || input === null || input.indexOf("/") == -1)
            return 0;

        var components = _.reject(input.split("/"), function(component) {
            return (component.length === 0);
        });

        return components.length - 1;
    },

    parentPathForDepth: function(path, depth) {

        if (_.isUndefined(path) || _.isNull(path))
            return 0;

        var components = _.reject(path.split("/"), function(component) {
            return (component.length === 0);
        });

        var output = _.reduce(components.slice(0, depth+1), function(memo, component) {
            return memo + '/' + component;
        }, '');

        return output;
    },

    dimensionForPath: function(path, callback) {

        if (callback === undefined)
            return;

        App.socket.query('dimension', { query:'dimensionsForPaths', paths: [path] }, function(err, result) {
            callback(result);
        });
    },

    dimensionsForPaths: function(paths, callback) {

        if (callback === undefined)
            return;

        App.socket.query('dimension', { query:'dimensionsForPaths', paths: paths }, function(err, result) {
            callback(result);
        });
    },

    dimensionsAtLevel: function(level, attributes, callback) {

        if (callback === undefined)
            return;

        App.socket.query('dimension', { query:'dimensionsAtLevel', attributes: attributes, level: level }, function(err, result) {
            callback(result);
        });
    },

    childDimensionsForLevel: function(level, attributes, callback) {

        if (callback === undefined)
            return;

        App.socket.query('dimension', { query:'childDimensionsForLevel', attributes: attributes, level: level }, function(err, result) {
            callback(result);
        });
    },

    childDimensionsForPath: function(path, attributes, callback) {

        if (callback === undefined)
            return;

        App.socket.query('dimension', { query:'childDimensionsForPath', attributes: attributes,  path: path }, function(err, result) {
            callback(result);
        });
    },

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
            var block = Item.findBlock(data[blockField], components[0], components[1]);
            var bField = _.last(field.split('/'));
            return _.isUndefined(block)
                ? undefined
                : block.data[bField];
        }
    },

    parseAttributes: function(item, schemaField) {

        if (_.isUndefined(schemaField.dimensionAttributes) || _.isNull(schemaField.dimensionAttributes))
            return null;

        var self = this;
        var parsedAttributes = [];

        schemaField.dimensionAttributes.forEach(function(attribute, index) {

            var pathStartsWith = attribute.pathStartsWith;
            var name = attribute.attribute;
            var value = attribute.value;
            var field = attribute.field;
            var level = attribute.level;
            var blockField = attribute.blockField;
            var custom = attribute.custom;

            var attributesBlock = {
                field: field,
                attribute: attribute.attribute
            };

            if (!_.isUndefined(custom)) {
                attributesBlock.custom = custom;
                if (!_.isUndefined(field)) {
                    attributesBlock.value = self.valueForComplexKey(item.data, field);
                }
            }
            else if (!_.isUndefined(value)) {
                attributesBlock.value = value;
            }
            else if (!_.isUndefined(field)) {

                if (!_.isUndefined(pathStartsWith)) {
                    var depth = self.depthForPathOrLevel(level);
                    var eValue = self.parentPathForDepth(item.data[field], depth);
                    attributesBlock.value = eValue;
                    attributesBlock.pathStartsWith = true;
                }
                else if (!_.isUndefined(level)) {
                    var depth = self.depthForPathOrLevel(level);
                    var eValue = self.parentPathForDepth(item.data[field], depth);
                    attributesBlock.level = level;
                    attributesBlock.value = eValue;
                } else {
                    attributesBlock.value = self.valueForComplexKey(item.data, field);
                }
            }

            parsedAttributes.push(attributesBlock);
        });

        return parsedAttributes;
    }
};
