/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

var EditFormView = Backbone.View.extend({
    itemType: null,
    item: null,
    file: null,
    elementsByField: {},
    dimensionsByLevel: {},
    events: {
        "change #fileSelect": "fileSelected",
        "click #SelectCell a": "optionSelected",
        "click #editSaveButton": "saveBtnPressed"
    },
    initialize: function(options) {
        
        if (App.context.currentItem !== null && App.context.currentItem !== undefined) {
            this.item = App.context.currentItem;
            this.itemType = this.item.headers.type;
        }

        if (typeof options !== 'undefined' && typeof options.data !== 'undefined') {
            this.itemType = options.data.itemType;
        }
        
    },
    willShow: function() {
    },
    didShow: function() {
        $('#editFormLabel').html('Edit ' + this.itemType);
        this.buildForm();
    },
    willHide: function() {
    },
    didHide: function() {
    },
    render: function() {
    },
    textInput: function(field, label) {
        
        var template = App.templates.TextInputCell.clone();
        var inputId = 'textInput-' + label;
        var labelElement = template.find('label');
        var textField = template.find('input[type=text]');
        
        labelElement.text(label);
        labelElement.prop('for', inputId);
        textField.attr('id', inputId);
        textField.prop('placeholder', label);

        if (typeof this.item !== 'undefined' && this.item !== null) {
            var value = this.item.data[field];

            if (value !== undefined && value !== null && value.length > 0) {
                textField.val(value);
            }
        }

        return template;
    },
    fileInput: function() {
        
        var template = App.templates.FileInputCell.clone();
        
        return template;
    },
    dimensionInput: function(field, label) {
        
        var template = App.templates.SelectCell.clone();
        var buttonTitle = template.find('button #btnTitle');
        buttonTitle.text(label);

        if (typeof this.item !== 'undefined' && this.item !== null) {
            var value = this.item.data[field];

            if (value !== undefined && value !== null && value.length > 0) {
                template.data('selected', value);
            }
        }

        return template;
    },
    loadDimensions: function(select, level) {

        var button = $(select).find('button');
        button.prop('disabled', true);
        var selected = select.data('selected');
        var list = $(select).find('ul');

        DimensionManager.dimensionsAtLevel(level, null, function(result) {

            var dimensions = _.values(result);
            var html = '';
            var selectedDimension = null;

            dimensions.forEach(function(dimension, index) {
                html += '<li data-path='+dimension.path+'><a>' + dimension.display + '</a></li>';

                if (selected !== undefined && selected !== null && selected.length > 0 && selected === dimension.path) {
                    selectedDimension = dimension;
                }

                if (selectedDimension !== null) {
                    var textInput = select.find('input[type=text]');
                    textInput.val(selectedDimension.display);
                }

                list.html(html);
                button.prop('disabled', false);
            });

        });

    },
    buildForm: function() {
        var edit = Edit[this.itemType];
        var fields = edit.fields;
        var self = this;
        var content = $(self.el).find('#editFormContent');

        $.each(fields, function(index, field) {

            var formElement = null;

            if (field.type === "text") {
                formElement = self.textInput(field.field, field.label);
            }
            else if (field.type === "file") {
                formElement = self.fileInput();
            }
            else if (field.type === "dimension") {
                var dimensionInput = self.dimensionInput(field.field.toLowerCase(), field.label);
                var formElement = dimensionInput;
                self.loadDimensions(dimensionInput, field.dimensionLevel);
            }

            if (formElement !== null) {
                self.elementsByField[field.field] = formElement;
                content.append(formElement);
            }
        });

        content.show('fast');

    },
    fileSelected : function(event) {
        
        this.file = event.target.files[0];
        
        $('#fileSelectText').val(this.file.name);
    },
    optionSelected: function(ev) {

        var option = $(ev.target).text();
        var view = $(ev.target).closest('#SelectCell');
        var path = $(ev.target).closest('li').data('path');

        var textInput = view.find('input[type=text]');
        textInput.val(option);
        textInput.data('path', path);
    },
    saveBtnPressed: function(ev) {
        
        var edit = Edit[this.itemType];
        var fields = edit.fields;
        var self = this;

        if (typeof this.item === 'undefined' || this.item === null) {
            var uuid = App.utils.newUUID;
            this.item = {
                headers: {
                    type: this.itemType,
                    //id: uuid,
                    clientId: uuid
                },
                data :{}
            }
        }
        
        $.each(fields, function(index, field) {
            
            var template = self.elementsByField[field.field];
            
            if (template === undefined || template === null)
                return;
            
            var value = null;
            
            if (field.type === "text") {
                
                var textField = template.find('input[type=text]');
                value = textField.val();
            }
            else if (field.type === "file" && self.file !== null) {
                
                if (field.nameField !== undefined) {
                    self.item.data[field.nameField] = self.file.name;
                }
                
                if (field.otherNameField !== undefined) {
                    self.item.data[field.otherNameField] = self.file.name;
                }
                
                if (field.sizeField !== undefined) {
                    self.item.data[field.sizeField] = self.file.size;
                }
            }
            else if (field.type === "dimension") {
                var textInput = template.find('input[type=text]');
                var path = textInput.data('path');
                value = path;
            }
            
            if (value !== null && value !== undefined && value.length > 0) {
                self.item.data[field.field] = value;
            }
            
        });

        if (typeof this.item.headers.clientId === 'undefined') {
            this.item.headers.clientId = App.utils.newUUID();
        }

        Indicator.start();

        //this.item.headers.createdat = new Date();
        //this.item.headers.updatedat = new Date();
        
        if (this.item.headers.type === 'MediaAbstract') {
            App.media.saveMedia(this.item, this.file);
        }
        else {
            // TODO:  Implement generic item save.
        }
        
        $(this.el).modal('hide');
    }

});
