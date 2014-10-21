/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013 2014. All rights reserved.
 */

/**
 * @module client.workflow
 */

/**
 * This class renders an html list of all current workflows, with options to filter and search.  Tapping
 * on a workflow brings the user to the detail for the tapped workflow.
 * @namespace client.workflow
 * @class WFListView
 * @Author Bryan Nagle
 * @date 4/1/14
 */

var WFListView = Backbone.View.extend({
    items: null,
    query: null,
    spinner: null,
    filterBtnGroup: null,
    config: null,wfListId:[],
    events: {
        "click #workflowList li":  "workflowPressed",
        "click #loadMoreBtn": "loadMore",
        "click #wfListCloseBtn": "closeBtnPressed",
        "click #wfSearchBtn": "searchBtnPressed",
        'keyup #wfSearchInput[type=text]': 'searchKeyPressed',
        'click #newWorkflowBtn': 'newWorkflowBtnPressed',
        'click #filterBtnGroup li': 'filterSelected',
        'click #refreshBtn': 'refreshBtnPressed',
        'click #massApprovalBtn':'massApprovalBtnPressed'
    },

    initialize: function(options) {
        this.data = options.data;
        this.items = [];

        $(this.el).hide();
        this.defineQuery();
        $('#workflowMessagesModal').hide();
        var header = $('#WorkflowHeader').html();
        var html = ejs.render(header, {
            column1: '',
            column2: 'Type',
            column3: 'Account Name',
            column4: 'id',
            column5: 'Status',
            column6: 'Requestor',
            column7: 'State'
        });
        $('#workflowList').append(html);

        this.filterBtnGroup = $('#filterBtnGroup');
        var filterDropDown = this.filterBtnGroup.find('ul');
        var filterBtn = this.filterBtnGroup.find('button');

        if (_.isUndefined(App.config.wfFilterIndex)) {
            App.config.wfFilterIndex = 0;
        }

        var self = this;
        App.socket.query('workflowListConfig', {}, function(err, result) {
            self.config = result;

            self.config.predefinedFilters.forEach(function(predefinedFilter, index) {
                var filterOption = $('<li><a>'+predefinedFilter.label+'</a></li>').data('id', predefinedFilter.id);
                filterDropDown.append(filterOption);

                if (!_.isUndefined(self.data) && !_.isUndefined(self.data.param)) {

                    if (predefinedFilter.id === self.data.param)
                    {
                        App.config.wfFilterIndex = index;
                    }
                }

                if (index === App.config.wfFilterIndex) self.applyFilter(filterOption);
            });

            filterBtn.removeClass('disabled');
            self.loadMore();
        });
    },

    refreshBtnPressed: function(ev) {
        $('#workflowMessagesModal').hide();
        this.applyCurrentFilter($(ev.target));
        this.clear();
        this.items = [];
        $('#wfSearchInput').val('');
        this.loadMore();
    },

    filterSelected: function(ev) {
        $('#workflowMessagesModal').hide();
        this.applyFilter($(ev.target));
        this.clear();
        this.items = [];
        $('#wfSearchInput').val('');
        this.loadMore();
    },

    applyCurrentFilter: function() {

        var index = App.config.wfFilterIndex;
        index = _.isUndefined(index)
            ? 0
            : index;

        var filterDropDown = this.filterBtnGroup.find('ul');
        var li = filterDropDown.find('li:nth-child('+(index + 1)+')');
        this.applyFilter(li);
    },

    applyFilter: function(filterOption) {
        var li = filterOption.closest('li');
        var id = li.data('id');
        var index = li.index();
        var text = filterOption.text();
        App.config.wfFilterIndex = index;

        var filterBtn = this.filterBtnGroup.find('button');
        filterBtn.find('.btn-title').text(text);
        filterBtn.removeClass('disabled');

        var predefinedFilterConfig = _.find(this.config.predefinedFilters, function(predefinedFilter) {
            return predefinedFilter.id === id;
        });

        Backbone.history.navigate('#WFListView:'+predefinedFilterConfig.id, { trigger: false });
        this.defineQuery(null, predefinedFilterConfig.sort, predefinedFilterConfig.queryFilter);
    },

    clear: function() {
        var header = $('#WorkflowHeader').html();
        var html = ejs.render(header, {
            column1: '',
            column2: 'Type',
            column3: 'Account Name',
            column4: 'id',
            column5: 'Status',
            column6: 'Requestor',
            column7: 'State'
        });
        $('#workflowList').html('');
        $('#workflowList').append(html);
    },

    defineQuery: function(searchText, sort, queryFilter) {

        searchText = _.isNull(searchText)
            ? undefined
            : searchText;

        sort = _.isNull(sort) || _.isUndefined(sort)
            ? { value: 'h_createdat', desc: true }
            : sort;

        this.query = new SocketStreamQuery({
            namespace:"dc",
            category: "workflow",
            itemType:"ActiveApprovals",
            baseItemType: "wfApproval",
            sortBy:sort.value,
            faultBlocks: true,
            pageSize: 20,
            caseInsensitive: true,
            desc: sort.desc,
            search: searchText,
            queryFilter: queryFilter
        });
    },

    willShow: function() {
        if (App.config.embedded) {
            $('#mainNavBar').hide()
        }
        else {
            App.navBar.setNavBtnActive('WFListView');
        }

        if (typeof App.config.options.hideCloseBtn !== 'undefined' && App.config.options.hideCloseBtn === true) {
            $('#wfListCloseBtn').hide();
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
    loadMore: function() {
        Indicator.start();

        var self = this;
        this.query.next(function(items, last) {
            self.loadResults(items, last);
        });
    },
    loadResults: function(results, last) {
        this.items = _.union(this.items, results);

        var cell = $('#WorkflowCell').html();

        for (var rdx = 0; rdx < results.length; rdx++) {
            var item = results[rdx];

            var accountName = item.data.accountName;

            if (accountName === undefined || accountName === null || accountName.length === 0)
                accountName = item.data.newName;

            console.log(item.data);
            console.log(item.data.h_type);
            var massApprovalEnabled = false;
            if(item.data.status.toLowerCase() != "closed" && item.data.approver.toLowerCase() == App.auth.getUserId().toLowerCase() ){
                    massApprovalEnabled = true;
            }
            var html = ejs.render(cell, {
                column1: massApprovalEnabled,
                column2: item.data.workflowType,
                column3a:accountName,
                column3b:moment(item.headers.createdat).format('MMMM Do YYYY, h:mm:ss a'),
                column4:item.data.approvalId.substr(0, 8),
                column5:item.data.status,
                column6:item.data.requestor,
                column7:item.data.state,
                column8:item.data.approvalId
            });
            $('#workflowList').append(html);
        }

        $(this.el).show();
        Indicator.stop();
    },

    workflowPressed: function(ev) {

        var row = $(ev.target).closest('li');
        var index = $('#workflowList').find('li').index(row) - 1;
        var item = this.items[index];

        var checkbox  = $(ev.target).closest('input[type=checkbox]');

        var checkboxChecked = false;
        var massApprovalListUpdate = false;
        var checkboxId = '';
        if(typeof checkbox[0] === 'undefined'){
            checkboxChecked = false;
        }
        else{
            massApprovalListUpdate = checkbox[0].checked;
            checkboxChecked = true;
            checkboxId = checkbox[0].id;
        }

        if (typeof item === 'undefined') {
            return;
        }

        if(!checkboxChecked) {
            App.loadPage('WFDetailView:' + item.data.approvalId, { item: item });
            //Backbone.history.navigate('#WFDetailView:'+item.data.approvalId, { trigger: false });
        }
        else{
            this.massApprovalEnabled(massApprovalListUpdate,checkboxId);
        }
    },
    closeBtnPressed: function(ev) {

        if (App.config.embedded) {
            window.location.href = "inapp://close";
        }
    },

    /**
     * Triggered when the user taps the search button.  Re-creates the StreamQuery with the
     * text in the search box as the search parameter.
     * @method searchBtnPressed
     * @param ev
     */
    searchBtnPressed: function(ev) {

        $('#workflowMessagesModal').hide();
        var searchText = $('#wfSearchInput').val();

        if (searchText.length === 0)
            searchText = undefined;


        this.applyCurrentFilter();
        this.query.parameters.search = searchText;

        this.clear();
        this.items = [];
        this.loadMore();
    },

    /**
     * Fires on keyup event on the search input box;
     * Auto triggers the search (by calling searchBtnPressed) when needed.
     * @method searchKeyPressed
     * @param ev
     */
    searchKeyPressed: function(ev) {
        // If they hit return, search
        if (ev.keyCode === 13) {
            this.searchBtnPressed();
        } else if (ev.keyCode === 8 || ev.keyCode === 46) {
            // If they hit backspace or delete and the search text
            // is empty, search
            var value = $(ev.target).val();

            if (value.length === 0) {
                this.searchBtnPressed();
            }

        }
    },

    /**
     * Fires when any one of the checkbox for the mass-approval is checked
     * @method massApprovalEnabled
     */
    massApprovalEnabled:function(massApprovalListUpdate,checkboxId){
        if(massApprovalListUpdate)
        {
            this.wfListId.push(checkboxId);
        }
        else{
            if (this.wfListId.indexOf(checkboxId) > -1) {
                this.wfListId.splice(this.wfListId.indexOf(checkboxId), 1);
            }
        }
        if(this.wfListId.length > 0){
            $("#massApprovalBtn").removeAttr('disabled');
        }
        else{
            $("#massApprovalBtn").attr('disabled','disabled');
        }
    },

    newWorkflowBtnPressed: function(ev) {
        App.loadPage('WFCreateView', { fromPage: 'WFListView' });
    },

    /***
     * fires when the mass approval button is pressed
     * @author : Krishna Teja
     * @date   : 15-10-2014
     * @methodName : massApprovalBtnPressed
     */
    massApprovalBtnPressed:function(){

        $("#workflowErrors").html('');
        // check if
        if(this.wfListId.length == 0)
        {
            $('#workflowMessagesModal').show();
            $("#workflowErrors").html('Please choose atleast one workflow to approve');
            return;
        }
        //submit it to server here.
        this.massApprovalSubmit();
    },
    massApprovalSubmit: function() {
        var self = this;

        var wfIdList = this.wfListId;
        $('#workflowMessagesModal').hide();
        Indicator.start();
        var queryFilterData = [];
        var filters = [];
        var filtersForSteps = [];
        var stepsQueryFilter =[];
        for(id in wfIdList){
            filters.push({
                field: 'approvalId',
                value: wfIdList[id],
                comparison: 'e'
            });
            filtersForSteps.push({
                field: 'workflowId',
                value: wfIdList[id],
                comparison: 'e'
            });
        }
        queryFilterData.push(filters);
        stepsQueryFilter.push(filtersForSteps);
        var currentApproverFilter = [{
            field: 'approver',
            value: App.auth.getUserId(),
            comparison: 'e'
        }];
        stepsQueryFilter.push(currentApproverFilter);
        var wfItems = {};

        SocketStream.fetchAll({
            namespace:"dc",
            category: "workflow",
            itemType:"wfApproval",
            sortBy:"approvalId",
            faultBlocks: false,
            pageSize: self.items.length+1,
            queryFilter: queryFilterData
        }, function(items, last) {
            if (_.isUndefined(items) || items.length === 0) {
                $('#workflowMessagesModal').show();
                $("#workflowErrors").html('Error occurred while submitting the workflows try again later');
                Indicator.stop();
            }
            else{
                wfItems = items;
                SocketStream.fetchAll({
                    namespace:"dc",
                    category: "workflow",
                    itemType:"wfStep",
                    sortBy:"steporder",
                    faultBlocks: true,
                    pageSize: self.items.length,
                    queryFilter: stepsQueryFilter
                },function(items,last){
                    console.log(items);
                    console.log(wfItems);
                   App.socket.query('submitMultipleWorkflow', {
                        workflows: wfItems,
                        curr: items,
                        userId:App.auth.getUserId()
                    }, function(err, result) {

                            var validationMessages = $('#workflowMessagesModal');
                            validationMessages.show();
                            var messagesView = validationMessages.find('#workflowErrors');
                            messagesView.html('');


                            result.forEach(function(validationMessage, index) {

                                if(typeof validationMessage.msg !== 'undefined')
                                {
                                    messagesView.append("<div class='alert alert-danger'>"+validationMessage.id.substr(0,8)
                                        +" is not submitted.<ul class='nav' id='messageList"+validationMessage.id.substr(0,8)
                                        +"'></ul></div>");
                                    var internalMessagesView = messagesView.find('#messageList'+validationMessage.id.substr(0,8));
                                    validationMessage.msg.forEach(function(message,index)
                                        {
                                            internalMessagesView.append("<li>"+message+"</li>");
                                        });
                                }
                                else
                                {
                                    messagesView.append("<div class='alert alert-success'>"+validationMessage.id.substr(0,8)+" &nbsp; is successfully submitted. <br/></div>")
                                }
                            });
                            Indicator.stop();
                            self.applyCurrentFilter();
                               self.clear();
                               self.items = [];
                               $('#wfSearchInput').val('');
                            self.loadMore();
                    });
                });
            }

        });

    }
});
