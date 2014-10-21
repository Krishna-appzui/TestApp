/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013 2014. All rights reserved.
 */

/**
 * @module client.workflow
 */

/**
 * This class renders the form view for a workflow
 * @namespace client.workflow
 * @class WFFormView
 * @Author Bryan Nagle
 * @date 4/7/14
 */

var WFFormView = Backbone.View.extend({
    query: null,
    inputViews: null,
    forms: null,
    switches: null,
    schemasByType: null,
    disabled: false,
    validationRules: null,
    formType: null,
    events: {
        'click .remove-button': 'removeBtnPressed',
        'click .undo-button': 'undoBtnPressed',
        'click .block-add': 'addBtnPressed',
        'click .copyToButton': 'copyToButtonPressed',
        'click .check-btn': 'checkBtnPressed'
    },
    initialize: function() {
        this.inputViews = [];
        this.forms = [];
        this.switches = [];
    },
    willShow: function() {


    },
    didShow: function() {

    },
    willHide
        : function() {
    },
    didHide: function() {
    },
    render: function() {
    },

    load: function(data, callback) {
        this.prev = data.prev;
        this.curr = data.curr;
        this.diff = data.diff;
        this.approval = data.workflow;

        var self = this;

        App.socket.query('workflowValidation', {}, function(err, result) {
            self.validationRules = _.mapValues(result, function(validationRule) {
                return _.mapValues(validationRule, function(fieldValidation) {
                    return _.mapValues(fieldValidation, function(fieldProperty) {
                        if (_.isObject(fieldProperty)) {
                            fieldProperty.formView = self;
                        }
                        return fieldProperty;
                    });
                });
            });
            console.log('workflow validations loaded');
            callback(null, 'success');
        });
    },

    clearForm: function() {

        this.inputViews.forEach(function(view, index) {
            view.unbind();
        });

        this.inputViews = [];

        this.switches.forEach(function(swtichInput, index) {
            swtichInput.destroy();
        });

        this.switches = [];

        var self = this;

        $.each(this.forms, function(index, form) {
            self.unbindForm(form);
        });

        var form = $(this.el);
        form.hide();
        form.html('');
    },

    unbindForm: function(form) {
        form.data('validator', null);
        form.unbind('validate');
    },

    isFormValid: function(callback) {
        var valid = true;
        var messages = [];

        $.each(this.forms, function(index, form) {
            if (!form.valid()) {
                valid = false;
                return;
            }
        });

        var shipToAddress = Item.findBlock(this.curr.data.addresses, 'addressType', '/Data/communicationType[CustomerShipTo]');

        if (_.isUndefined(shipToAddress) || _.isNull(shipToAddress)) {
            valid = false;
            messages.push('At least one ShipTo Address is required.');
        }

        var billToAddress = Item.findBlock(this.curr.data.addresses, 'addressType', '/Data/communicationType[CustomerBillTo]');

        if (_.isUndefined(billToAddress) || _.isNull(billToAddress)) {
            valid = false;
            messages.push('At least one BillTo Address is required.');
        }

        var workPhone = Item.findBlock(this.curr.data.phones, 'phoneType', '/Data/communicationType[Work]');

        if (_.isUndefined(workPhone) || _.isNull(workPhone)) {
            valid = false;
            messages.push('At least one Work Phone number is required.');
        }

        var workFax = Item.findBlock(this.curr.data.phones, 'phoneType', '/Data/communicationType[WorkFax]');

        if (_.isUndefined(workFax) || _.isNull(workFax)) {
            valid = false;
            messages.push('At least one Work Fax number is required.');
        }

        callback(null, valid, messages);
    },

    renderForm: function() {

        var self = this;

        App.socket.query('workflowFormConfig', { formType: this.formType }, function(err, config) {

            self.schemasByType = config;

            var formTemplate = $('#wfForm').html();
            var form = $(ejs.render(formTemplate));
            $(self.el).append(form);

            self.renderFields(self.diff, self.curr, form.find('.panel-body'));
            self.forms.push(form);
            self.validation(form, self.validationRules.wfStep);
        });
    },

    validation: function(form, rules) {

        form.validate({
            rules: rules,
            highlight: function(element) {
                $(element).closest('.form-group').addClass('has-error');
            },
            unhighlight: function(element) {
                $(element).closest('.form-group').removeClass('has-error');
            },
            onkeyup: function(element) {$(element).valid()},
            errorElement: 'div',
            errorClass: 'help-block',
            errorPlacement: function(error, element) {
                if(element.parent('.input-group').length) {
                    error.insertAfter(element.parent());
                } else {
                    error.insertAfter(element);
                }
            }

        });

    },

    inputTypesForDataType: function(dataType) {

        var inputType;

        switch (dataType) {

            case 'phone':
                inputType = "tel";
                break;
            case 'email':
                inputType = "email";
                break;
            case undefined:
            case 'refnum':
            case 'string':
                inputType = "text";
                break;
        }

        return inputType;
    },

    dependenciesValid: function(dependencies) {

        if (_.isUndefined(dependencies) || _.isNull(dependencies)) {
            return true;
        }

        var self = this;
        var result = true;

        dependencies.forEach(function(dependency, index) {
            var value = DimensionManager.valueForComplexKey(self.curr, dependency);

            if (_.isUndefined(value) || _.isNull(value) || value.length === 0) {
                result = false;
                return;
            }
        });

        return result;
    },

    renderFields: function(doc, item, form) {

        var blockPanel = $('#BlockPanel').html();
        var addButton = $('#AddButton').html();
        var copyToButton = $('#CopyToButton').html();
        var switchInputTemplate = $('#SwitchInput').html();
        var dimensionFilterDisplayTemplate = $('#DimensionFilterDisplay').html();

        var schema = this.schemasByType[item.headers.type];

        if (typeof schema === "undefined")
            return;

        var self = this;

        $.each(schema.fields, function(index, schemaField) {
            var key = schemaField.name;
            var compare = doc[key];

            if (schemaField === undefined)
                return;

            console.log('Key: '+key);

            var value = item.data[key];

            if (value === undefined)
                value = '';

            switch (schemaField.dataType) {
                case undefined:
                case 'phone':
                case 'email':
                case 'refnum':
                case 'string':
                    var inputView = new TextInputView({ type:self.inputTypesForDataType(schemaField.dataType) });
                    inputView.data.item = item;
                    inputView.val(value);
                    inputView.label(schemaField.label);
                    inputView.name(key);
                    inputView.compare(compare);
                    inputView.enabled(!(self.disabled || compare === 'removed' || (!_.isUndefined(schemaField.readonly) && schemaField.readonly === true)));

                    inputView.textChangedCallback = function(err, view) {
                        var panel = $(view.el).closest('.input-panel');
                        var fieldValues = self.getDiff(panel);
                        var fieldName = view.name();
                        var oldValue = fieldValues.fieldPrev.data[fieldName];
                        oldValue = _.isUndefined(oldValue)
                            ? ''
                            : oldValue;
                        var compare = self.doesMatch(oldValue, view.val())
                            ? 'same'
                            : 'different';
                        view.compare(compare);

                        fieldValues.fieldDiff[fieldName] = compare;
                        fieldValues.fieldCurr.data[fieldName] = view.val();
                    };

                    form.append(inputView.el);
                    self.inputViews.push(inputView);
                    break;

                case 'boolean':
                    var input = $(ejs.render(switchInputTemplate, {
                        field:key,
                        label:schemaField.label,
                        value: (typeof value === 'undefined' ? false : value),
                        compare:compare,
                        disabled: self.disabled || compare === 'removed'
                    }));

                    form.append(input);
                    break;

                case 'dimension':

                    if (typeof schemaField.readonly !== 'undefined' && schemaField.readonly === true) {

                        var inputView = new DimensionTreeInputView();
                        inputView.data.item = item;
                        inputView.data.selectedPath = value;
                        inputView.data.blockType = item.headers.type;
                        inputView.data.schemaField = schemaField;
                        inputView.label(schemaField.label);
                        inputView.name(key);
                        inputView.compare(compare);
                        inputView.enabled(false);
                        inputView.readOnly = true;
                        inputView.val('N/A');
                        inputView.level(schemaField.dimensionLevel, DimensionManager.parseAttributes(item, schemaField), true);

                        form.append(inputView.el);
                        self.inputViews.push(inputView);
                    }
                    else if (schemaField.multilevel) {

                        var dependenciesAreValid = self.dependenciesValid(schemaField.dependencies);

                        var inputView = new DimensionTreeInputView();
                        inputView.data.item = item;
                        inputView.data.selectedPath = value;
                        inputView.data.blockType = item.headers.type;
                        inputView.data.schemaField = schemaField;
                        inputView.label(schemaField.label);
                        inputView.name(key);
                        inputView.compare(compare);
                        inputView.enabled(dependenciesAreValid);
                        inputView.readOnly = self.disabled || !dependenciesAreValid ||  compare === 'removed'
                            || (!_.isUndefined(schemaField.readonly) && schemaField.readonly === true);
                        inputView.level(schemaField.dimensionLevel, DimensionManager.parseAttributes(item, schemaField));

                        inputView.dimensionSelectedCallback = function(err, view, dimension) {
                            self.dimensionSelected(err, view, dimension);
                        }

                        form.append(inputView.el);
                        self.inputViews.push(inputView);

                    } else {

                        var dependenciesAreValid = self.dependenciesValid(schemaField.dependencies);

                        var inputView = new DimensionInputView();
                        inputView.data.item = item;
                        inputView.data.selectedPath = value;
                        inputView.data.blockType = item.headers.type;
                        inputView.data.schemaField = schemaField;
                        inputView.label(schemaField.label);
                        inputView.name(key);
                        inputView.compare(compare);
                        inputView.enabled(dependenciesAreValid);
                        //inputView.enabled(false);
                        inputView.readOnly = self.disabled || !dependenciesAreValid || compare === 'removed' || (!_.isUndefined(schemaField.readonly) && schemaField.readonly === true);
                        inputView.level(schemaField.dimensionLevel, DimensionManager.parseAttributes(item, schemaField));

                        inputView.dimensionSelectedCallback = function(err, view, dimension) {
                            self.dimensionSelected(err, view, dimension);
                        }

                        form.append(inputView.el);
                        self.inputViews.push(inputView);
                    }

                    break;

                case 'list':

                    if (schemaField.listElementType !== 'block' || !_.isObject(compare))
                        break;

                    var blockids = Object.keys(compare).sort();

                    $.each(blockids, function(index, blockid) {
                        var _comp = compare[blockid];
                        var _block;

                        if (_comp.compare === 'removed')
                            _block = self.blockForid(self.prev.data[key], blockid);

                        else
                            _block = self.blockForid(value, blockid);

                        if (_block == undefined)
                            return;

                        var enabled = self.disabled;

                        if(!self.disabled)
                        {
                            if(schemaField.display === false){
                                enabled = true
                            }
                        }
                        var html = ejs.render(blockPanel, {
                            label:schemaField.label,
                            blockfield:key,
                            blockindex:_block.index,
                            blockid:blockid,
                            compare:_comp.compare ,
                            disabled: enabled
                        });
                        var form = $(html);

                        self.renderFields(_comp.fields, _block.block, form.find('.panel-body'));
                        $(self.el).append(form);

                        self.forms.push(form);
                        self.validation(form, self.validationRules[key]);
                    });

                    if (!self.disabled) {
                        if(schemaField.display){
                            var buttonHtml = ejs.render(addButton, { label:schemaField.label, field:key, blocktype:schemaField.blockType });
                            $(self.el).append(buttonHtml);
                        }
                    }
                    break;

                case 'copyToButton':

                    if (!_.isUndefined(schemaField.visible)) {
                        if (!App.condition.test(schemaField.visible, item)) {
                            break;
                        }
                    }

                    var buttonHtml = ejs.render(copyToButton, { itemType:schemaField.itemType, field:schemaField.name, label:schemaField.label });
                    form.append(buttonHtml);
                    break;
            }

        });

        $(this.el).show();
        Indicator.stop();
    },

    copyToButtonPressed: function(ev)
    {
        ev.preventDefault();
        var button = $(ev.target);
        var itemType = button.data('itemtype');
        var field = button.data('field');

        var schema = this.schemasByType[itemType];
        var schemaField = _.where(schema.fields, { name :field })[0];

        var source = _.find(this.curr.data[field], function(block) {
            return App.condition.test(schemaField.visible, block)
        });

        var target = _.find(this.curr.data[field], function(block) {
            return App.condition.test(schemaField.target, block)
        });

        var sourceInputViews = _.filter(this.inputViews, function(sourceInputView) {
            return sourceInputView.data.item === source && schemaField.copyFields.indexOf(sourceInputView.name()) > -1;
        });

        var targetInputViews = _.filter(this.inputViews, function(targetInputView) {
            return targetInputView.data.item === target && schemaField.copyFields.indexOf(targetInputView.name()) > -1;
        });

        var self = this;

        sourceInputViews.forEach(function(sourceInputView, index) {
            var targetInputView = targetInputViews[index];

            if (!_.isUndefined(sourceInputView.selectedDimension)) {

                targetInputView.selectedDimension = sourceInputView.selectedDimension;
                targetInputView.data.selectedPath = sourceInputView.data.selectedPath;

                targetInputView.val(sourceInputView.val());
                targetInputView.data.selectedPath = sourceInputView.data.selectedPath;

                if (!_.isUndefined(targetInputView.dimensionSelectedCallback)) {
                    targetInputView.dimensionSelectedCallback(null, targetInputView, targetInputView.selectedDimension);
                }

            }
            else {
                targetInputView.val(sourceInputView.val());
                if (!_.isUndefined(targetInputView.textChangedCallback)) {
                    targetInputView.textChangedCallback(null, targetInputView);
                }
            }
        });
    },

    dimensionSelected: function(err, view, dimension) {
        view.val(_.isEmpty(dimension.display) ? dimension.path : dimension.display);
        var panel = $(view.el).closest('.input-panel');
        var fieldValues = this.getDiff(panel);
        var fieldName = view.name();
        var oldValue = _.isUndefined(fieldValues.fieldPrev) || _.isUndefined(fieldValues.fieldPrev.data)
            ? undefined
            : fieldValues.fieldPrev.data[fieldName];

        view.data.selectedPath = dimension.path;

        oldValue = _.isUndefined(oldValue)
            ? ''
            : oldValue;
        var compare = this.doesMatch(oldValue, dimension.path)
            ? 'same'
            : 'different';
        view.compare(compare);

        fieldValues.fieldDiff[fieldName] = compare;
        fieldValues.fieldCurr.data[fieldName] = dimension.path;
        fieldValues.fieldCurr.data[fieldName+'Country'] = dimension.country;
        var self = this;

        if (!_.isUndefined(view.data.schemaField.update)) {

            view.data.schemaField.update.forEach(function(chain, index) {

                var chainField = chain.field;
                var chainLevel = chain.level;

                var depth = DimensionManager.depthForPathOrLevel(chainLevel);
                var chainValue = DimensionManager.parentPathForDepth(dimension.path, depth);

                var targetInputViews = _.filter(self.inputViews, function(targetInputView) {
                    return targetInputView.data.item === view.data.item && targetInputView.name() === chainField;
                });

                targetInputViews.forEach(function(targetInputView, index) {

                    if (_.isUndefined(chainLevel)) {
                        targetInputView.data.attributes = DimensionManager.parseAttributes(fieldValues.fieldCurr, targetInputView.data.schemaField);
                        targetInputView.reload(!self.dependenciesValid(targetInputView.data.schemaField.dependencies));
                    } else {
                        DimensionManager.dimensionForPath(chainValue, function(dimensionsByPath) {
                            var dimension = dimensionsByPath[chainValue];
                            var display = dimension.display;

                            if (_.isUndefined(display))
                                display = 'N/A';

                            fieldValues.fieldCurr.data[chainField] = dimension.path;
                            targetInputView.val(display);
                            targetInputView.compare(view.compare());
                            targetInputView.data.path = chainValue;
                        });
                    }
                });
            });
        }
    },
    blockForid: function(blocks, blockid) {
        var self = this;
        var output;

        var components = blockid.split(':');

        $.each(blocks, function(index, block) {

            self.fixHeaders(block);

            if (block.headers.parent_id === components[0] && block.headers.parent_sequence === parseInt(components[1]))
                output = {
                    block:block,
                    index:index
                };
        });

        return output;
    },

    removeBlockForId: function(blocks, blockid) {

        var self = this;
        var output = [];

        var components = blockid.split(':');

        $.each(blocks, function(index, block) {

            self.fixHeaders(block);

            if (block.headers.parent_id === components[0] && block.headers.parent_sequence === parseInt(components[1])) {
                return;
            }

            output.push(block);

        });

        return output;
    },

    fixHeaders: function(object) {

        if (object.headers === undefined)
            return;

        if (object.headers.rent_id !== undefined)
            object.headers.parent_id = object.headers.rent_id;

        if (object.headers.rent_sequence !== undefined)
            object.headers.parent_sequence = object.headers.rent_sequence;
    },

    getDiff: function(panel) {

        if (panel.length !== 0) {
            var blockfield = panel.data('blockfield');
            var blockid = panel.data('blockid');
            var fieldDiff = this.diff[blockfield][blockid];

            var p = this.blockForid(this.prev.data[blockfield], blockid);
            var c = this.blockForid(this.curr.data[blockfield], blockid);

            if (c === undefined && p !== undefined) {
                c = p.block;
            } else {
                c = c.block;
            }

            if (p === undefined && c !== undefined) {
                //p = c;
                p = {};
            } else {
                p = p.block;
            }

            return { fieldDiff:fieldDiff.fields, fieldPrev:p, fieldCurr: c};
        }

        return { fieldDiff:this.diff, fieldPrev:this.prev, fieldCurr: this.curr};
    },

    doesMatch: function(valueA, valueB) {
        if (valueA === valueB)
            return true;

        if (typeof valueA !== 'undefined' && valueA.length === 0 && valueB === false)
            return true;

        return false;
    },

    removeBtnPressed: function(ev) {

        var form = $(ev.target).closest('form');
        var blockPanel = $(ev.target).closest('.block-panel');
        var fieldValues = this.getDiff(blockPanel);
        var blockfield = blockPanel.data('blockfield');
        var blockid = blockPanel.data('blockid');

        fieldValues.fieldDiff.compare = "removed";

        for (var field in fieldValues.fieldDiff.fields) {
            fieldValues.fieldDiff.fields[field] = 'removed';
        }

        var panelBody = blockPanel.find('.panel-body');
        blockPanel.removeClass('panel-info').addClass('panel-danger');
        blockPanel.find('.block-message').html(' (Deleted)');

        var button = blockPanel.find('.block-button');
        button.removeClass('remove-button').addClass('undo-button');
        button.html('Undo');
        panelBody.html('');

        this.curr.data[blockfield] = this.removeBlockForId(this.curr.data[blockfield], blockid);
        var block = this.blockForid(this.prev.data[blockfield], blockid);
        this.forms = _.reject(this.forms, function(aForm) { return aForm[0] === form[0] });
        this.unbindForm(form);

        if (block === undefined) {
            blockPanel.remove();
        } else {
            this.renderFields(fieldValues.fieldDiff, block.block, panelBody);
        }
    },
    undoBtnPressed: function(ev) {

        var form = $(ev.target).closest('form');
        var blockPanel = $(ev.target).closest('.block-panel');
        var fieldValues = this.getDiff(blockPanel);
        var blockfield = blockPanel.data('blockfield');
        var blockid = blockPanel.data('blockid');

        fieldValues.fieldDiff.compare = "same";

        for (var field in fieldValues.fieldDiff.fields) {
            fieldValues.fieldDiff.fields[field] = 'same';
        }

        var panelBody = blockPanel.find('.panel-body');
        blockPanel.removeClass('panel-danger').addClass('panel-info');
        blockPanel.find('.block-message').html('');

        var button = blockPanel.find('.block-button');
        button.removeClass('undo-button').addClass('remove-button');
        button.html('Remove');
        panelBody.html('');

        var block = this.blockForid(this.prev.data[blockfield], blockid);
        this.curr.data[blockfield].push(_.cloneDeep(block.block));

        this.renderFields(fieldValues.fieldDiff, block.block, panelBody);

        this.forms.push(form);
        this.validation(form, this.validationRules[blockfield]);
    },
    addBtnPressed: function(ev) {

        var button = $(ev.target);
        var blocktype = button.data('blocktype');
        var blockfield = button.data('field');
        var blockPanel = $('#BlockPanel').html();
        var self = this;

        var schema = self.schemasByType[blocktype];

        var item = { headers:{}, data:{} };
        var compare = {};

        for (var fdx = 0; fdx < schema.fields.length; fdx++) {
            var field = schema.fields[fdx];

            item.data[field.name] = '';
            compare[field.name] = 'added';

        }

        var accounthId = this.approval.data.accounthId;

        item.headers.id = accounthId+':'+(this.curr.data[blockfield].length);
        item.headers.parent_id = accounthId;
        item.headers.parent_sequence = this.curr.data[blockfield].length;
        item.headers.parent_fieldname = blockfield;
        item.headers.parent_type = this.curr.headers.type;
        item.headers.type = blocktype;

        var html = ejs.render(blockPanel, { label:blocktype, blockfield:blockfield, blockindex:item.headers.parent_sequence, blockid:item.headers.id, compare:'added' });
        var form = $(html);

        this.curr.data[blockfield].push(item);
        this.diff[blockfield][item.headers.id] = { compare:'added', fields:compare };

        this.renderFields(compare, item, form.find('.panel-body'));
        button.parent().before(form);

        self.forms.push(form);
        self.validation(form, self.validationRules[blockfield]);
    },
    checkBtnPressed: function(ev) {

        var button = $(ev.target).closest('button');
        var control = button.closest('.switchInput');
        var icon = button.find('.glyphicon');
        var value = button.data('value');
        var field = button.data('field');
        var input = control.find('input[type=text]');

        var panel = control.closest('.input-panel');
        var indicator = control.find('.input-group-addon i');

        var fieldValues = this.getDiff(panel);

        value = (value) ? false : true;
        button.data('value', value);
        input.val(value);
        var oldValue = fieldValues.fieldPrev.data[field];
        fieldValues.fieldCurr.data[field] = value;

        if (!this.doesMatch(oldValue, value)) {

            fieldValues.fieldDiff[field] = 'different';

            indicator.
                removeClass('glyphicon-ok').
                removeClass('glyphicon-darkgray').
                addClass('glyphicon-exclamation-sign').
                addClass('glyphicon-orange');
        }
        else {

            fieldValues.fieldDiff[field] = 'same';

            indicator.
                removeClass('glyphicon-exclamation-sign').
                removeClass('glyphicon-orange').
                addClass('glyphicon-ok').
                addClass('glyphicon-darkgray');
        }

        console.log('Field: '+field+' value: '+value);

        if (value === true) {
            button.removeClass('btn-default').addClass('btn-primary');
            icon.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
        } else {
            button.removeClass('btn-primary').addClass('btn-default');
            icon.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
        }
    }
});