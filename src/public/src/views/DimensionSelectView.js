/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * DimensionSelectView
 * 4/7/14
 */

var DimensionSelectView = Backbone.View.extend({
    spinner: null,
    treeView: null,
    events: {

    },

    initialize: function(options) {
        this.data = options.data;

        var treeRoot = $('#TreeRoot').html();
        var html = ejs.render(treeRoot, { label: this.data.label });
        $(this.el).find('#dimensionTree').html(html);
    },
    willShow: function() {
    },
    didShow: function() {
        var content = $(this.el).find('#dsContent');

        var self = this;

        this.treeView = new DimensionTreeView({
            el: '#dimensionTree',
            level:this.data.level,
            attributes:this.data.attributes,
            expanded:true,
            schemaField:this.data.schemaField,
            selectedHandler: function(dimension) {
                if (self.data.selectedHandler !== undefined)
                    self.data.selectedHandler(dimension);
                $(self.el).modal('hide');
            }
        });

        content.show('fast');
    },
    willHide: function() {
    },
    didHide: function() {
    },
    render: function() {
    }
});