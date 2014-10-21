/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013 2014. All rights reserved.
 */

/**
 * @module client.workflow
 */

/**
 * This class renders the create view for a workflow
 * @namespace client.workflow
 * @class WFCreateView
 * @Author Bryan Nagle
 * @date 4/5/14
 */

var WFCreateView = Backbone.View.extend({
    spinner: null,
    prev: null,
    curr: null,
    diff: null,
    approval: null,
    wfFormView: null,
    events: {
        "click #closeBtn": "closeBtnPressed",
        "click #verifyBtn": "verifyBtnPressed",
        "click #submitBtnBottom": "submitBtnPressed",
        "click #verifyBtnBottom": "verifyBtnPressed",
        "click #submitBtn": "submitBtnPressed"
    },

    initialize: function(options) {
        this.data = options.data;
        $('#createValidationMessage').hide();

        this.wfFormView = new WFFormView({ el: $('#WorkflowFormView')});

        Indicator.start();

        var accountId = App.config.options.itemId;

        // Backwards compatiblity...
        if (typeof App.config.accountId !== 'undefined') {
            accountId = App.config.accountId;
        }

        /*
        if (accountid === undefined || accountid === null) {
            accountid = $.cookie("accountId");
        }*/

        if (accountId === undefined || accountId === null) {
            //accountId = '300628001';
            //accountId = '486342001';
            //accountId = '223867001';
            //accountId = '553624001';
            //accountId = '001F000000hjzkRIAQ';
            //accountId = '491318001';
            //accountId = '231562001';
        }


        this.wfFormView.formType = _.isUndefined(accountId) || _.isNull(accountId) ? 'create' : 'edit';

        var self = this;

        App.socket.query('createWorkflow', {
            accountId: accountId
        }, function(err, result) {

            self.wfFormView.load(result, function(loadErr, loadResult) {

                var name = result.prev.data.name;

                if (name.length > 0) {
                    $('#createWorkflowTitle').text(result.workflow.data.approvalId.substr(0, 8)+' - '+name);
                } else {
                    $('#createWorkflowTitle').text(result.workflow.data.approvalId.substr(0, 8));
                }

                if (result.prev.data.accountId.length === 0) {
                    $('#workflowTypeTitle').text('New Workflow:');
                } else {
                    $('#workflowTypeTitle').text('Change Workflow:');
                }

                self.wfFormView.renderForm();
            });
        });
    },
    willShow: function() {

        if (App.config.embedded) {
            $('#mainNavBar').hide()
        }
        else {
            App.navBar.setNavBtnActive('WFListView');
        }

    },
    didShow: function() {
    },
    willHide: function() {
    },
    didHide: function() {
    },
    render: function() {
    },

    loadSteps: function(approvers, last) {

        $('#stepList').html('<li class="list-group-item list-group-item-info">Steps:</li>');

        for (var sdx = 0; sdx < approvers.length; sdx++) {
            var approver = approvers[sdx];

            var html = '<li class="list-group-item">'+approver.userid+'<br />'+approver.positiontype + '</li>'
            $('#stepList').append(html);
        }
    },

    resetValidationMessages: function() {
        var validationMessages = $('#createValidationMessage');
        validationMessages.show();
        var messagesView = validationMessages.find('#validationMessages');
        messagesView.html('');
        return messagesView;
    },

    verifyBtnPressed: function() {

        var self = this;

        if (!this.hasChanges(this.wfFormView.diff)) {

            $('#createValidationMessage').show();
            var messagesView = $('#validationMessages');
            messagesView.html('<p>Cannot Verify without modifications</p>');
            window.scrollTo(0,0);
            return;
        }

        this.wfFormView.isFormValid(function(err, valid, messages) {

            if (!valid) {

                var messagesView = self.resetValidationMessages();

                if (typeof messages != undefined && messages !== null && messages.length > 0) {
                    messages.forEach(function(message, index) {
                        messagesView.append(message+'<br />');
                    });
                }

                window.scrollTo(0,0);
                return;
            }

            $('#createValidationMessage').hide();
            Indicator.start();

            App.socket.query('verifyWorkflow', {
                workflow: self.wfFormView.approval,
                prev: self.wfFormView.prev,
                curr: self.wfFormView.curr
            }, function(err, result) {

                if (_.isNull(err)) {
                    self.loadSteps(result.approvers);
                } else {
                    console.log(err);
                    var messagesView = self.resetValidationMessages();

                    result.forEach(function(validationMessage, index) {
                        messagesView.append(validationMessage+'<br />');
                    });
                }

                Indicator.stop();
            });
        });
    },

    closeBtnPressed: function() {

        delete App.config.options.itemId;
        delete App.config.accountId;

        var fromPage = _.isUndefined(this.data) || _.isUndefined(this.data.fromPage)
            ? false
            : true;

        if (!_.isUndefined(App.config.embedded) && App.config.embedded === true && !fromPage) {
            window.location.href = "inapp://close";
        }
        else {
            App.loadPage('WFListView');
        }
    },

    hasChanges: function(diff) {

        var changed = false;
        var keys = Object.keys(diff);

        for (var index = 0; index < keys.length; index++) {

            var key = keys[index];
            var value = diff[key];

            if (key === 'stepId' || key === 'stepOrder')
                continue;

            if (_.isObject(value)) {
                var blockDiffKeys = Object.keys(value);
                for (var bdx = 0; bdx < blockDiffKeys.length; bdx++) {

                    var blockDiff = value[blockDiffKeys[bdx]];
                    //changed = blockDiff.compare === 'same' ? false : true;
                    changed = this.hasChanges(blockDiff.fields);

                    if (changed === true)
                    {
                        break;
                    }
                }
            }
            else if (_.isString(value)) {
                if (value !== 'same') {
                    changed = true;
                }
            }

            if (changed === true)
                break;
        }

        return changed;
    },

    submitBtnPressed: function() {

        if (!this.hasChanges(this.wfFormView.diff)) {

            $('#createValidationMessage').show();
            var messagesView = $('#validationMessages');
            messagesView.html('<p>Cannot Submit without modifications</p>');
            window.scrollTo(0,0);
            return;
        }

        var self = this;

        this.wfFormView.isFormValid(function(err, valid, messages) {

            if (!valid) {
                $('#createValidationMessage').show();
                var messagesView = $('#validationMessages');
                messagesView.html('');

                if (typeof messages != undefined && messages !== null && messages.length > 0) {
                    messages.forEach(function(message, index) {
                        messagesView.append('<p>'+message+'</p>');
                    });
                }
                window.scrollTo(0,0);
                return;
            }

            $('#createValidationMessage').hide();
            Indicator.start();

            App.socket.query('submitWorkflow', {
                workflow: self.wfFormView.approval,
                prev: self.wfFormView.prev,
                curr: self.wfFormView.curr,
                create: true
            }, function(err, result) {

                Indicator.stop();

                if (_.isNull(err)) {
                    console.log('Workflow success!');
                    delete App.config.options.itemId;
                    delete App.config.accountId;
                    App.loadPage('WFListView');
                } else {
                    console.log(err);
                    var messagesView = self.resetValidationMessages();

                    result.forEach(function(validationMessage, index) {
                        messagesView.append(validationMessage+'<br />');
                    });

                    //messagesView.append(err.toString().substr(7));
                }
            });
        });
    }
});