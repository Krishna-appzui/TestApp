/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * DimensionInputView
 * @author Bryan Nagle
 * @date 5/17/14
 * @namespace
 * @module
 */

var DimensionInputView = Backbone.View.extend({
    data: null,
    template: null,
    events: {
        'click .dimension-select a': 'dimensionSelected'
    },
    inputElement: null,
    diffIconElement: null,
    _compare: null,
    labelElement: null,
    buttonElement: null,
    listElement: null,
    dimensionSelectedCallback: null,
    readOnly: false,
    dimensionsByPath: {},
    selectedDimension: null,
    initialize: function(params) {

        this.data = {};
        this.template = $('#DimensionInputView').html();
        this.setElement($(ejs.render(this.template, params)));
        this.labelElement = $(this.el).find('.view-control-label');
        this.inputElement = $(this.el).find('.view-control-input');
        this.diffIconElement = $(this.el).find('.view-control-difficon');
        this.buttonElement = $(this.el).find('.view-control-button');
        this.listElement = $(this.el).find('.view-control-list');
    },
    name: function(aName) {
        return _.isUndefined(aName)
            ? this.inputElement.prop('name')
            : this.inputElement.prop('name', aName);
    },
    label: function(aLabel) {
        return _.isUndefined(aLabel)
            ? this.labelElement.html()
            : this.labelElement.html(aLabel);
    },
    enabled: function(aEnabled) {
        return _.isUndefined(aEnabled)
            ? this.buttonElement.prop('disabled')
            : this.buttonElement.prop('disabled', !aEnabled);
    },
    val: function(aVal) {
        /*
        if (_.isUndefined(aVal)) {
            return this.inputElement.val();
        }
        else {
            this.inputElement.val(aVal);

            if (!_.isNull(this.dimensionSelectedCallback)) {

                //var dimension = this.dimensionsByPath[path];
               //this.dimensionSelectedCallback(null, this, dimension);
            }
        }*/


        return _.isUndefined(aVal)
            ? this.inputElement.val()
            : this.inputElement.val(aVal);
    },
    compare: function(aCompare) {
        if (_.isUndefined(aCompare)) {
            return this._compare;
        } else {
            switch (aCompare) {
                case 'different':
                case 'added':
                case 'removed':
                    this.diffIconElement
                        .removeClass('glyphicon-ok')
                        .removeClass('glyphicon-darkgray')
                        .addClass('glyphicon-exclamation-sign')
                        .addClass('glyphicon-orange');
                    break;

                default:
                    this.diffIconElement
                        .removeClass('glyphicon-orange')
                        .removeClass('glyphicon-exclamation-sign')
                        .addClass('glyphicon-ok')
                        .addClass('glyphicon-darkgray');
                    break;
            }
        }
        this._compare = aCompare;
    },
    dimensionSelected: function(ev) {

        var element = $(ev.target);
        var path = element.data('path');
        var display = element.text();

        if (!_.isNull(this.dimensionSelectedCallback)) {

            var dimension = this.dimensionsByPath[path];
            this.selectedDimension = dimension;
            this.dimensionSelectedCallback(null, this, dimension);
        }
    },
    level: function(aLevel, attributes) {

        if (_.isUndefined(aLevel)) {
            return this.data.level;
        } else {

            //var cValue = this.data.selectedPath;
            var cDisplay = this.val();
            this.enabled(false);
            this.val('Loading...');

            this.data.level = aLevel;
            this.data.attributes = attributes;
            var self = this;

            DimensionManager.dimensionsAtLevel(aLevel, attributes, function(dimensionsByPath) {

                if (dimensionsByPath === undefined)
                    return;

                var sDimension = dimensionsByPath[self.data.selectedPath];

                if (sDimension !== undefined) {
                    self.val(sDimension.display);
                    self.selectedDimension = sDimension;
                } else {
                    //self.val(cValue);
                    //self.data.selectedPath = undefined;
                    //self.val('');
                    self.val(cDisplay);
                }

                var dimensions = _.values(dimensionsByPath);

                if (dimensions.length == 0)
                    return;

                var list = '';

                dimensions.forEach(function(dimension, index) {
                    self.dimensionsByPath[dimension.path] = dimension;
                    list += '<li><a data-path="'+dimension.path+'">' + dimension.display + '</a></li>';
                });

                self.listElement.html(list);

                if (!self.readOnly) {
                    self.enabled(true);
                }
            });
        }
    },
    reload: function(readonly) {
        this.readOnly = readonly;
        this.level(this.data.level, this.data.attributes);
    }
});