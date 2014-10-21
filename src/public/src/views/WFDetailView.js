/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013 2014. All rights reserved.
 */

/**
 * @module client.workflow
 */

/**
 * This class renders the detail view for a workflow
 * @namespace client.workflow
 * @class WFDetailView
 * @Author Bryan Nagle
 * @date 4/1/14
 */

var WFDetailView = Backbone.View.extend({
    adminMode: false,
    spinner: null,
    steps: [],
    activeStep: null,
    activeStepElement: null,
    wfFormView: null,
    events: {
        "click #closeBtn": "closeBtnPressed",
        "click #submitBtn": "submitBtnPressed",
        "click #rejectBtn": "rejectBtnPressed",
        "click #stepList li": "stepSelected",
        "click #rejectBtnBottom": "rejectBtnPressed",
        "click #submitBtnBottom": "submitBtnPressed"
    },

    initialize: function(options) {
        var self = this;
        $('#detailValidationMessage').hide();
        this.data = options.data;

        if (_.isUndefined(this.data) || (_.isUndefined(this.data.param) && _.isUndefined(this.data.item))) {
            App.loadPage('WFListView');
        } else {

            if (_.isUndefined(this.data.item) && !_.isUndefined(this.data.param)) {

                SocketStream.fetchAll({
                    namespace:"dc",
                    category: "workflow",
                    itemType:"wfApproval",
                    sortBy:"updatedAt",
                    faultBlocks: false,
                    pageSize: 20,
                    queryFilter: [
                        [
                            {
                                field: 'approvalId',
                                value: this.data.param,
                                comparison: 'e'
                            }
                        ]
                    ]
                }, function(items, last) {

                    if (_.isUndefined(items) || items.length === 0) {
                        App.loadPage('WFListView');
                        return;
                    }

                    self.data.item = items[0];
                    self.initSteps();

                });
            }
            else if (!_.isUndefined(this.data.item)) {
                self.initSteps();
            }
            else {
                App.loadPage('WFListView');
            }
        }
    },
    initSteps: function() {

        this.stepQuery = new SocketStreamQuery({
            namespace:"dc",
            category: "workflow",
            itemType:"wfStep",
            sortBy:"steporder",
            faultBlocks: true,
            pageSize: 20,
            queryFilter: [
                [
                    {
                        field: 'workflowId',
                        value: this.data.item.data.approvalId,
                        comparison: 'e'
                    }
                ]
            ]
        });

        Indicator.start();

        this.wfFormView = new WFFormView({ el: $('#DetailWorkflowFormView')});
        this.wfFormView.formType = _.isUndefined(this.data.item.data.accountId) || _.isNull(this.data.item.data.accountId) ? 'create' : 'edit';
        var self = this;

        this.stepQuery.next(function(items, last) {
            self.steps = _.union(self.steps, items);

            var activeIndex = _.findIndex(self.steps, function(step) {
                return step.data.stepState === 'Active';
            });

            activeIndex = activeIndex === -1
                ? 1
                : activeIndex;

            self.activeStep = self.steps[activeIndex];

            self.loadSteps(items, last);

            if (activeIndex > 0) {
                self.compare(self.steps[activeIndex - 1], self.steps[activeIndex]);
            }

            Indicator.stop();
        });
    },
    willShow: function() {

        if (App.config.embedded) {
            $('#mainNavBar').hide();
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
    compare: function(prev, curr) {

        Indicator.start();
        var self = this;

        self.wfFormView.clearForm();

        App.socket.query('compareSteps', { prev:prev, curr:curr }, function(err, result) {

            if (typeof err === "undefined" || err === null) {

                self.wfFormView.load(result, function(loadErr, loadResult) {

                    if ((!self.adminMode) && (self.wfFormView.curr.data.approver.toLowerCase() !== App.auth.getUserId().toLowerCase()
                        || (self.data.item.data.state === 'Submit')
                        || (self.data.item.data.state === 'Processed')
                        || (self.data.item.data.state === 'Rejected'))) {
                        self.wfFormView.disabled = true;
                        $('#rejectBtn').prop("disabled",true);
                        $('#submitBtn').prop("disabled",true);
                        // Modified by @Krishna
                        // Date @10/10/2014
                        $('#rejectBtnBottom').prop("disabled",true);
                        $('#submitBtnBottom').prop("disabled",true);
                    } else {
                        self.wfFormView.disabled = false;
                        $('#rejectBtn').prop("disabled",false);
                        $('#submitBtn').prop("disabled",false);
                        // Modified by @Krishna
                        // Date @10/10/2014
                        $('#rejectBtnBottom').prop("disabled",false);
                        $('#submitBtnBottom').prop("disabled",false);
                    }

                    self.wfFormView.approval = self.data.item;
                    var name = result.prev.data.name;

                    if (_.isUndefined(result.prev.data.accountId) || _.isNull(result.prev.data.accountId || result.prev.data.accountId.length === 0)) {
                        $('#workflowTypeTitle').text('New Workflow:');
                    } else {
                        $('#workflowTypeTitle').text('Change Workflow:');
                    }

                    if (!_.isUndefined(name) && !_.isNull(name) && name.length > 0) {
                        $('#detailWorkflowTitle').text(self.data.item.data.approvalId.substr(0, 8)+' - '+name);
                    } else {
                        $('#detailWorkflowTitle').text(self.data.item.data.approvalId.substr(0, 8));
                    }

                    self.wfFormView.renderForm();
                });
            }

        });

    },
    fetchMoreSteps: function() {
        Indicator.start();

        var self = this;
        this.stepQuery.next(function(items, last) {
            self.steps = _.union(self.steps, items);
            self.loadSteps(items, last);
        });
    },
    loadSteps: function(steps, last) {

        var stepCell = $('#StepCell').html();
        var self = this;

        steps.forEach(function(step, index) {

            if (step.data.stepOrder === 0)
                return;

            var html = ejs.render(stepCell, { item: step });
            var element = $(html);

            if ((_.isUndefined(self.activeStep) && index === 1) || (step === self.activeStep)) {
                element.addClass('active').addClass('text-white');
                self.activeStepElement = element;
            }
            $('#stepList').append(element);

        });
    },
    closeBtnPressed: function() {
        App.loadPage('WFListView');
    },
    submitBtnPressed: function() {

        var self = this;
        this.wfFormView.isFormValid(function(err, valid, messages) {

            if (!valid) {

                var validationMessages = $('#detailValidationMessage');
                validationMessages.show();
                var messagesView = validationMessages.find('#validationMessages');
                messagesView.html('');

                if (!_.isUndefined(messages) && messages !== null && messages.length > 0) {
                    messages.forEach(function(message, index) {
                        messagesView.append(message+'<br />');
                    });
                }
                window.scrollTo(0,0);
                return;
            }

            $('#detailValidationMessage').hide();
            Indicator.start();

            App.socket.query('submitWorkflow', {
                workflow: self.data.item,
                curr: self.wfFormView.curr
            }, function(err, result) {

                if (typeof err === "undefined" || err === null) {
                    console.log('Workflow success!');
                    App.loadPage('WFListView');
                } else {
                    console.log('Workflow failure!');

                    var validationMessages = $('#detailValidationMessage');
                    validationMessages.show();
                    var messagesView = validationMessages.find('#validationMessages');
                    messagesView.html('');

                    result.forEach(function(validationMessage, index) {
                        messagesView.append(validationMessage+'<br />');
                    });
                }

                Indicator.stop();

            });
        });
    },
    rejectBtnPressed: function(ev) {

        var self = this;

        bootbox.confirm("Are you sure?", function(result) {

            if (result) {
                App.socket.query('rejectWorkflow', {
                    workflow: self.data.item,
                    curr: self.wfFormView.curr
                }, function(err, result) {

                    Indicator.stop();
                    App.loadPage('WFListView');
                });
            }

        });

    },
    stepSelected: function(ev) {

        var element = $(ev.target).closest('li');

        var steporder = element.data('steporder');
        var curr = this.steps[steporder];

        if (curr.data.stepState === 'Waiting')
            return;

        if (this.activeStepElement !== null) {
            this.activeStepElement.removeClass('active').removeClass('text-white');
        }

        this.activeStepElement = element;

        element.addClass('active').addClass('text-white');
        var prev = this.steps[steporder - 1];


        if (curr.data.stepState === 'Waiting') {
            curr = this.activeStep;
        }

        this.compare(prev, curr);
    }

});