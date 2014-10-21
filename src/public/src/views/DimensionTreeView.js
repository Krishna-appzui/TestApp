/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

function DimensionTreeView(options) {

    this.attributes = options.attributes;
    this.dimensionsByPath = {};
    var self = this;
    this.schemaField = options.schemaField;
    
    var tree = new DynamicTreeView({ el:options.el }).render();
    tree.nodePressedHandler = function(node) {
        
        if (node.isLeaf())
            return;
        
        if (node.isLoaded()) {
            node.toggleExpanded();
        }
        else {
            node.setExpanded(true);
            self.loadNodeChildren(node);
        }
    };

    tree.nodeSelectedHandler = function(ev) {
        var button = $(ev.target);
        var li = button.closest('li');
        var path = li.data('path');

        if (!_.isUndefined(options.selectedHandler)) {

            var dimension = self.dimensionsByPath[path];
            options.selectedHandler(dimension);
            //options.selectedHandler(path, button.text());
        }
    }
    
    var el = $('.tree-root');

    if (options.path !== undefined) {
        el.closest('li').data('path', options.path);
    } else if (options.level !== undefined) {
        el.closest('li').data('level', options.level);
    }

    this.rootNode = new DynamicTreeNode(el);
    
    if (options.expanded === true) {
        this.rootNode.setExpanded(true);
    this.loadNodeChildren(this.rootNode);
    } else {
        this.rootNode.setExpanded(false);
    }
};

DimensionTreeView.prototype.loadNodeChildren = function(node) {

    node.showSpinner();
    var path = $(node.el).closest('li').data('path');
    var level = $(node.el).closest('li').data('level');
    var self = this;

    if (node === this.rootNode) {
        if (path !== undefined) {
            DimensionManager.childDimensionsForPath(path, this.attributes, function(dimensions) {
                node.removeSpinner();
                self.loadDimensions(node, _.values(dimensions));
            });
        } else if (level != undefined) {

            if (!_.isUndefined(this.schemaField) && !_.isUndefined(this.schemaField.function) && !_.isUndefined(this.schemaField.function)) {
                console.log('Testing');
                //TODO: Implement custom function handling

                App.socket.query('customFunction', { name: this.schemaField.function, args:{ level: level, attributes: this.attributes }}, function(err, result) {
                    //console.log(result);
                    node.removeSpinner();
                    self.loadDimensions(node, result);
                });


            } else {
                DimensionManager.dimensionsAtLevel(level, this.attributes, function(dimensions) {
                    node.removeSpinner();
                    self.loadDimensions(node, _.values(dimensions));
                });
            }
        }

    } else {
        if (path !== undefined) {
            DimensionManager.childDimensionsForPath(path, this.attributes, function(dimensions) {
                node.removeSpinner();
                self.loadDimensions(node, _.values(dimensions));
            });
        } else if (level != undefined) {
            DimensionManager.childDimensionsForLevel(level, this.attributes, function(dimensions) {
                node.removeSpinner();
                self.loadDimensions(node, _.values(dimensions));
            });
        }
    }
};

DimensionTreeView.prototype.loadDimensions = function(parent, dimensions) {
    
    if (dimensions.length === 0) {
        parent.markLeaf();
        return;
    }

    var self = this;
    var children = $('<ul></ul>');

    dimensions.forEach(function(dimension, index) {
        if (_.isNull(dimension) || _.isUndefined(dimension))
            return;

        var display = dimension.display;

        if (_.isNull(display) || display.trim().length === 0) {
            display = dimension.path;
        }

        if (_.isNull(display) || display.trim().length === 0)
            return;

        var node = self.createNodeEntry(display, dimension.path);

        self.dimensionsByPath[dimension.path] = dimension;
        node.data('path', dimension.path);
        children.append(node);
    });

    parent.setChildren(children);
};

DimensionTreeView.prototype.createNodeEntry = function(title) {

    var treeNode = $('#TreeNode').html();
    var node = $(ejs.render(treeNode, { label: title }));
    //this.loadNodeChildren(node);
    return node;
};

