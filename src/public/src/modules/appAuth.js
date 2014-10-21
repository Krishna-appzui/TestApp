/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013. All rights reserved.
 */

App.auth = {
    lib: null,
    communities: null,
    rolesByCommunity: null,
    userInfo: null,
    init: function() {

    },
    setSid: function(sid) {
        $.cookie("sid", sid);
    },
    getSid: function() {
        return $.cookie("sid");
    },
    setUserId: function(user) {
        $.cookie("userId", user);
    },
    getUserId: function() {
        return $.cookie("userId");
    },
    setToken: function(token) {
        $.cookie("token", token);
    },
    getToken: function() {
        return $.cookie("token");
    },
    setCommunity: function(community) {
        $.cookie("community", community);
    },
    getCommunity: function() {
        return $.cookie("community");
    },
    setCredential: function(user, token) {
        this.setUser(user);
        this.setToken(token);
    },
    hasCredentials: function() {
        var user = $.cookie("userId");
        var token = $.cookie("token");
        var community = $.cookie("community");

        if (user !== null && user !== undefined && token !== null && token !== undefined && community !== null && community !== undefined) {
            return true;
        }
        
        return false;
    },
    logout: function() {

        $.cookie("user", null);
        $.cookie("token", null);
        $.cookie("community", null);
        window.location.href = "/signin";
    },
    toUTF8: function(arg) {
        var responseText = arg,
                responseTextUTF8 = '';

        for (var i = 0; i < responseText.length; i++) {
            if (responseText.charCodeAt(i) != 0)
                responseTextUTF8 += responseText.charAt(i);
        }

        return responseTextUTF8;
    }
};
