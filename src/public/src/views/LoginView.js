/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013 2014. All rights reserved.
 */

var LoginView = Backbone.View.extend({
    spinner: null,
    events: {
        "click #signInButton": "attemptLogin",
        'keypress input[type=text]': 'filterOnEnter',
        'keypress input[type=password]': 'filterOnEnter',
        'click #communityList a': 'communitySelected',
        'click #resetBtn': 'reset'
    },
    init: function() {
    },
    willShow: function() {
        this.reset();
    },
    didShow: function() {
    },
    willHide: function() {
    },
    didHide: function() {
    },
    render: function() {
    },
    filterOnEnter: function(e) {
        if (e.keyCode !== 13)
            return;

        var id = $(e.currentTarget).attr('id');

        if (id === 'userNameTextField') {
            $(this.el).find('#passwordTextField').focus();
        } else {
            this.attemptLogin();
        }
    },
    attemptLogin: function()
    {
        $('#userNameTextField').prop('disabled', true);
        $('#passwordTextField').prop('disabled', true);
        $('#signInButton').prop('disabled', true);
        var userName = $(this.el).find('#userNameTextField').val();
        var password = $(this.el).find('#passwordTextField').val();

        var self = this;

        Indicator.start();

        App.socket.query('auth', {userId:userName, password:password}, function(err, result) {

            if (typeof err === "undefined" || err === null) {
                App.auth.communities = result.communities;
                App.auth.setUserId(result.userId);
                App.auth.setToken(result.token);
                App.auth.setSid(result.sid);
                self.loginSuccess();
                self.showCommunities();
            } else {
                self.loginFailure("Authentication Failed:  Invalid Credentials");
            }

        });
    },
    loginSuccess: function()
    {
        Indicator.stop();
    },
    loginFailure: function(errorMessage) {
        Indicator.danger(errorMessage);
        Indicator.stop();
        this.reset();
    },
    reset: function() {
        $('#communityBtn').prop('disabled', true);
        $('#userNameTextField').prop('disabled', false).val("");
        $('#passwordTextField').prop('disabled', false).val("");
        $('#signInButton').prop('disabled', false);
        $(this.el).find('#userNameTextField').focus();
    },
    showCommunities: function() {

        var communitiesListData = '';
        for (var i = 0; i < App.auth.communities.length; i++) {
            var community = App.auth.communities[i];
            communitiesListData +=
                    '<li><a>' + community + '</a></li>';
        }

        $('#communityList').html(communitiesListData);
        $('#communityBtn').prop('disabled', false).dropdown('toggle');
    },
    communitySelected: function(ev) {

        var communityName = $(ev.target).text();
        var sid = App.auth.getSid();
        var self = this;

        App.socket.query('setCommunity', { community:communityName, sid: sid}, function(err, result) {

            if (typeof err === "undefined" || err === null) {
                App.auth.setCommunity(result.community);
                window.location.href = "/";
            } else {
                self.loginFailure("Authentication Failed:  Invalid Credentials");
            }

        });
    }
});
