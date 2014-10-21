/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * DimensionTreeInputView
 * @author Bryan Nagle
 * @date 5/17/14
 * @namespace
 * @module
 */

var DimensionTreeInputView = Backbone.View.extend({
    data: null,
    template: null,
    events: {
        'click .view-control-button': 'selectBtnPressed'
    },
    inputElement: null,
    diffIconElement: null,
    _compare: null,
    labelElement: null,
    buttonElement: null,
    dimensionSelectedCallback: null,
    readOnly: false,
    initialize: function(params) {

        this.data = {};

        this.template = $('#DimensionTreeInputView').html();
        this.setElement($(ejs.render(this.template, params)));
        this.labelElement = $(this.el).find('.view-control-label');
        this.inputElement = $(this.el).find('.view-control-input');
        this.diffIconElement = $(this.el).find('.view-control-difficon');
        this.buttonElement = $(this.el).find('.view-control-button');
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
    selectBtnPressed: function(ev) {

        var self = this;

        App.presentModalPage('DimensionSelectView', {
            level: this.data.level,
            label: this.buttonElement.text(),
            attributes: this.data.attributes,
            schemaField: this.data.schemaField,
            selectedHandler: function(dimension) {
                if (!_.isNull(self.dimensionSelectedCallback)) {
                    self.dimensionSelectedCallback(null, self, dimension);
                }
            }
        });
    },

    level: function(aLevel, attributes) {

        if (_.isUndefined(aLevel)) {
            return this.data.level;
        }
        this.data.level = aLevel;
        this.data.attributes = attributes;

        var cValue = this.data.selectedPath;
        if (_.isUndefined(cValue) || cValue.length === 0) {
            if (!this.readOnly) {
                this.enabled(true);
            }
            return;
        }

        this.enabled(false);
        this.val('Loading...');
        var self = this;

        DimensionManager.dimensionForPath(cValue, function(dimensionsByPath) {

            if (dimensionsByPath !== undefined && dimensionsByPath[cValue] !== undefined ) {
                var dimension = dimensionsByPath[cValue];
                self.val(dimension.display);

                /*
                if (!_.isNull(self.dimensionSelectedCallback)) {
                    self.dimensionSelectedCallback(null, self, dimension);
                }*/
            } else {
                self.val(cValue);
            }

            if (!self.readOnly) {
                self.enabled(true);
            }
        });
    },
    reload: function(readonly) {
        this.readOnly = readonly;
        /*
        if (!_.isNull(this.dimensionSelectedCallback)) {
            this.dimensionSelectedCallback(null, this, '', undefined);
        }*/
        this.level(this.data.level, this.data.attributes);
    }
});