/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * TextInputView
 * @author Bryan Nagle
 * @date 5/17/14
 * @namespace
 * @module
 */

var TextInputView = Backbone.View.extend({
    data: null,
    template: null,
    events: {
        "change .view-control-input": "textChanged"
    },
    inputElement: null,
    diffIconElement: null,
    _compare: null,
    labelElement: null,
    textChangedCallback: null,
    initialize: function(params) {

        this.data = {};

        if (_.isUndefined(params)) {
            params = {};
        }

        if (_.isUndefined(params.type)) {
            params.type = 'text';
        }

        this.template = $('#TextInputView').html();
        this.setElement($(ejs.render(this.template, params)));
        this.labelElement = $(this.el).find('.view-control-label');
        this.inputElement = $(this.el).find('.view-control-input');
        this.diffIconElement = $(this.el).find('.view-control-difficon');
    },
    type: function() {
        return this.params.type;
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
            ? this.inputElement.prop('disabled')
            : this.inputElement.prop('disabled', !aEnabled);
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
    textChanged: function(ev) {
        if (!_.isNull(this.textChangedCallback)) {
            this.textChangedCallback(null, this);
        }
    }
});