/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * @class Validation
 * @author Bryan Nagle
 * @date 5/16/14
 * @namespace client/public
 * @module client/public
 */

var Validation = {

    extend: function() {

        $.validator.addMethod("conditionalRequired", function(value, element, params) {

            if (_.isUndefined(params.field) || _.isUndefined(params.formView)) {
                return true;
            }

            var compare = params.formView.diff[params.field];

            if (compare === 'same')
                return true;

            params.message = _.isUndefined(params.message)
                ? 'This field is required because you modified '+App.utils.unCamelCase(params.field)
                : params.message;

            return $(element).val().length !== 0;
        }, function(params) {
            return params.message;
        });

        $.validator.addMethod("usAndCdnPostal", function(postal, element, params) {
            params.message = _.isUndefined(params.message)
                ? "Please specify a valid Postal Code for your selected country. (US)"
                : params.message;

            return this.optional(element) ||
                postal.match(/(^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$)|(^\d{5}(-\d{4})?$)/);
        }, function(params) {
            return params.message;
        });

        $.validator.addMethod("matchLevel", function(value, element, params) {

            var formView = params.formView;

            if (_.isUndefined(formView) || _.isUndefined(params.field) || _.isUndefined(formView.inputViews)) {
                return true;
            }

            var currentInputView = _.find(formView.inputViews, function(inputView) {
                return $.contains(inputView.el, element);
            });

            var path = _.isUndefined(currentInputView)
                || _.isUndefined(currentInputView.data)
                || _.isUndefined(currentInputView.data.item)
                ? null
                : currentInputView.data.item.data[params.field];

            return this.optional(element) || currentInputView.data.selectedPath.indexOf(path) !== -1;

        }, function(params) {
            return params.message;
        });

        $.validator.addMethod("usOrCdnPostal", function(postal, element, params) {

            var formView = params.formView;

            if (_.isUndefined(formView) || _.isUndefined(params.field) || _.isUndefined(formView.inputViews)) {
                return true;
            }

            var currentInputView = _.find(formView.inputViews, function(inputView) {
                return $.contains(inputView.el, element);
            });

            var country = _.isUndefined(currentInputView)
                || _.isUndefined(currentInputView.data)
                || _.isUndefined(currentInputView.data.item)
                ? null
                : currentInputView.data.item.data[params.field];

            switch (country) {
                case '/Global/country[US]':
                    params.message = _.isUndefined(params.message)
                        ? "Please specify a valid Postal Code for your selected country. (US)"
                        : params.message;
                    return this.optional(element) ||
                    postal.match(/(^\d{5}(-\d{4})?$)/);
                    break;

                case '/Global/country[CA]':
                    params.message = _.isUndefined(params.message)
                        ? "Please specify a valid Postal Code for your selected country. (CA)"
                        : params.message;
                    return this.optional(element) ||
                    postal.match(/(^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$)/);
                    break;

                default:
                    return this.optional(element) ||
                    postal.match(/(^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$)|(^\d{5}(-\d{4})?$)/);
                    break;
            }

        }, function(params) {
            return params.message;
        });
    }
}