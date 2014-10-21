/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013. All rights reserved.
 */

App = {
    navBar: null,
    templates: {},
    currentPage: null,
    currentPageId: null,
    modalPage: null,
    views: {},
    router: null,
    presentModalPage: function(pageId, data) {

        var template = this.templates[pageId].clone();

        if (template === null || template === undefined)
            return;
        
        template.modal({backdrop: true, keyboard: true, show: false});
        
        var instance = null;
        var viewName = null;

        try {
            viewName = eval(pageId);
        }
        catch (e) {
        }
        
        if (viewName === null || viewName === undefined)
            return;
        
        instance = new viewName({ el: template, data:data });
        
        if (instance === null || instance === undefined)
            return;

        if (typeof instance.init === 'function') {
            instance.init();
        }

        this.modalPage = instance;

        template.modal('show');
        
        template.on('show.bs.modal', function(e) {
            if (typeof instance.willShow === 'function') {
                instance.willShow();
            }
        });
        
        template.on('shown.bs.modal', function(e) {
            if (typeof instance.didShow === 'function') {
                instance.didShow();
            }
        });

        template.on('hide.bs.modal', function(e) {
            if (typeof instance.willHide === 'function') {
                instance.willHide();
            }
        });

        template.on('hidden.bs.modal', function(e) {
            if (typeof instance.didHide === 'function') {
                instance.didHide();
            }
            
            template.remove();
            template.unbind();
        });
    },
    loadPage: function(pageParams, data) {

        var components = pageParams.split(':');
        var pageId = components[0];
        var param = components.length > 1
            ? components[1]
            : null;

        if (this.currentPageId === pageId)
            return;

        if (!App.auth.hasCredentials()) {
            pageId = "LoginView";
        }

        if (this.currentPage !== null) {
            if (typeof this.currentPage.willHide === 'function') {
                this.currentPage.willHide();
            }

            $('#RootView').hide();

            $(this.currentPage.el).remove();
            $(this.currentPage.el).unbind();

            if (typeof this.currentPage.didHide === 'function') {
                this.currentPage.didHide();
            }
        }

        var template = this.templates[pageId];
                
        if (template === null || template === undefined)
            return;

        Backbone.history.navigate('#'+pageParams, { trigger: false });

        $('#RootView').html(template.clone());
        var page = $('#RootView #' + pageId);
        $('#RootView').show();

        page.show();
        
        var instance = null;
        var viewName = null;
        
        try {
            viewName = eval(pageId);
        }
        catch (e) {
            console.log('Unknown Page: '+e);
        }
        
        if (viewName === null || viewName === undefined)
            return;

        data = _.isUndefined(data)
            ? { param: param }
            : _.extend(data, { param: param });

        try {
            instance = new viewName({ el: page, data:data });
        }
        catch (e) {
            console.log('Page does not exist: '+pageId);
        }

        if (instance === null || instance === undefined)
            return;

        this.currentPage = instance;
        this.currentPageId = pageId;

        if (typeof instance.willShow === 'function') {
            instance.willShow();
        }

        if (typeof instance.didShow === 'function') {
            instance.didShow();
        }

    },
    setupSocket: function() {
        App.socket = io.connect();
        App.socket.query = function(query, data, callback) {

            if (data.community === undefined)
                data.community = App.auth.getCommunity();

            if (data.token === undefined)
                data.token = App.auth.getToken();

            if (data.userId === undefined)
                data.userId = App.auth.getUserId();

            if (data.sid === undefined)
                data.sid = App.auth.getSid();

            data.queryKey = App.utils.newUID();
            var callbackKey = query+':callback'+':'+data.queryKey;

            App.socket.once(callbackKey, function(data) {
                var err = (typeof data.err !== "undefined" && data.err !== null)
                    ? new Error(data.err)
                    : null;
                callback(err, data.result);
            });

            App.socket.emit(query, data);
        };
    },

    initSignIn: function() {
        console.log('Signin Init');

        App.config.options = {};

        window.location.hash = "";
        var page = $('#RootView #LoginView');
        var instance = new LoginView({ el: page });

        this.currentPage = instance;

        if (typeof instance.willShow === 'function') {
            instance.willShow();
        }

        if (typeof instance.didShow === 'function') {
            instance.didShow();
        }

        $('body').show();
        this.setupSocket();
    },

    init: function(config) {
        this.setupSocket();
        console.log('Application Init');

        App.config.setData(config);

        if (!App.auth.hasCredentials()) {
            window.location.href = "/signin";
            return;
        }


        this.startRouter();
    },
    startRouter: function() {
        var self = this;

        $('div[data-role="page"]').each(function(index, element) {
            var pageId = $(element).attr('id');
            self.templates[pageId] = $(element).detach();
        });

        $('div[data-role="view"]').each(function(index, element) {
            var viewId = $(element).attr('id');
            self.templates[viewId] = $(element).detach();
        });

        App.auth.init();
        this.scrollViews = [];

        var AppRouter = Backbone.Router.extend({
            routes: {
                "*actions": "defaultRoute"
            }
        });

        var self = this;
        this.router = new AppRouter;

        this.router.on('route:defaultRoute', function(actions) {

            if (_.isUndefined(actions) || _.isNull(actions)) {
                actions = _.isUndefined(App.config.page)
                    ? 'LibraryView'
                    : App.config.page;
            }

            if (_.isUndefined(App.config.page) || App.config.page.length === 0) {
                App.config.page = "LibraryView";
            }

            self.loadPage(actions);
        });

        this.navBar = new NavBarView({el: $('#mainNavBar')});
        this.navBar.init();
        this.navBar.willShow();
        
        if (!Backbone.History.started) {
            Backbone.history.start();
        }
        
        $('body').show();
        this.navBar.didShow();
    }
};

$(document).ready(function() {
    Validation.extend();





});

