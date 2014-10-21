/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

function DynamicTreeNode(el) {
    this.el = el;
}

DynamicTreeNode.prototype.showSpinner = function() {
    var spinner = $(this.el).find('[data-role="spinner"]');

    if (spinner.length === 0) {
        //spinner = $('<img src="images/spinnerSmall.gif" data-role="spinner" style="display: none;" />');
        //spinner.appendTo(this.el).fadeIn('slow');
        
        spinner = $('<div style="display:inline-block" data-role="spinner">&nbsp;&nbsp;<div class="spinner dashes spinner-mini-white"> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
         </div></div>');
        
        spinner.appendTo(this.el);
        
        
    }
};

DynamicTreeNode.prototype.removeSpinner = function() {
    var spinner = $(this.el).find('[data-role="spinner"]');

    if (spinner.length > 0) {
        $(spinner).remove();
    }
};

DynamicTreeNode.prototype.markLeaf = function () {
    var icon = $(this.el).closest('li').find('.glyphicon').removeClass('glyphicon-plus-sign').removeClass('glyphicon-minus-sign').addClass('glyphicon-leaf');
};

DynamicTreeNode.prototype.isLeaf = function () {
    return $(this.el).closest('li').find('.glyphicon').hasClass('glyphicon-leaf');
};

DynamicTreeNode.prototype.setExpanded = function(expanded) {
    
    if (this.isLeaf())
        return;
    
    var icon = $(this.el).closest('li').find('.glyphicon');
    
    var currentChildren = $(this.el).closest('li').find('> ul ');

    if (expanded === true) {
        icon.removeClass('glyphicon-plus-sign');
        icon.addClass('glyphicon-minus-sign');
        
        if (currentChildren.length > 0) {
            currentChildren.show('fast');
        }
    }
    else {
        icon.removeClass('glyphicon-minus-sign');
        icon.addClass('glyphicon-plus-sign');
        
        if (currentChildren.length > 0) {
            currentChildren.hide('fast');
        }
    }
};

DynamicTreeNode.prototype.toggleExpanded = function() {
    
    if (this.isLeaf())
        return;
    
    var icon = $(this.el).find('.glyphicon');
    var currentChildren = $(this.el).closest('li').find('> ul ');

    if (icon.hasClass('glyphicon-plus-sign')) {
        icon.removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign');
        if (currentChildren.length > 0) {
            currentChildren.show('fast');
        }
    }
    else {
        icon.removeClass('glyphicon-minus-sign').addClass('glyphicon-plus-sign');
        if (currentChildren.length > 0) {
            currentChildren.hide('fast');
        }
    }
};

DynamicTreeNode.prototype.isExpanded = function() {
    var icon = $(this.el).find('.glyphicon');
    return icon.hasClass('glyphicon-minus-sign');
};

DynamicTreeNode.prototype.isLoaded = function() {
    var currentChildren = $(this.el).closest('li').find('> ul ');
    return (currentChildren.length > 0);
};

DynamicTreeNode.prototype.setChildren = function(children) {
    this.removeSpinner();

    var currentChildren = $(this.el).closest('li').find('> ul ');

    if (currentChildren.length > 0) {
        currentChildren.replaceWith(children);
    }
    else {
        var e = $(children);
        e.css('display', 'none');
        $(this.el).closest('li').append(e);
        e.show('fast');
    }
};

var DynamicTreeView = Backbone.View.extend({
    nodePressedHandler: null,
    nodeSelectedHandler: null,
    events: {
        "click li .btn-expand": "nodePressed",
        "click li .btn-select": "nodeSelected"
    },
    initialize: function() {
    },
    render: function() {
        return this;
    },
    nodePressed: function(ev) {

        if (this.nodePressedHandler !== undefined && this.nodePressedHandler !== null) {
            this.nodePressedHandler(new DynamicTreeNode(ev.target));
        }
    },
    createNodeEntry: function(title) {
        return $('<li> <span><i class="glyphicon glyphicon-plus-sign"></i> ' + title + '</span> <input type="checkbox">  <a>test</a> </li>');
    },
    nodeSelected: function(ev) {
        if (this.nodeSelectedHandler !== undefined && this.nodeSelectedHandler !== null) {
            this.nodeSelectedHandler(ev);
        }
    }
});