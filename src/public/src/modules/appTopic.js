/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * Topic
 * @author Bryan Nagle
 * @date 6/10/14
 * @namespace
 * @module
 */

App.Topic = function Topic(topic) {
    this.topic = topic;
    App.socket.emit('subscribe', { topic: this.topic, userId: App.auth.getUserId(), token:App.auth.getToken() });
};

App.Topic.prototype.subscribe = function(callback) {
    var self = this;

    App.socket.on('message', function(data) {
        var err = (typeof data.err !== "undefined" && data.err !== null)
            ? new Error(data.err)
            : null;
        callback(err, data);
    });
};

App.Topic.prototype.publish = function(data) {
    data.topic = this.topic;
    data.userId = App.auth.getUserId();
    data.token = App.auth.getToken();
    App.socket.emit('publish', data);
};

App.Topic.prototype.onJoin = function(callback) {
    var self = this;

    App.socket.on('join', function(data) {
        var err = (typeof data.err !== "undefined" && data.err !== null)
            ? new Error(data.err)
            : null;
        callback(err, data);
    });
};

App.Topic.prototype.onLeave = function(callback) {
    var self = this;

    App.socket.on('leave', function(data) {
        var err = (typeof data.err !== "undefined" && data.err !== null)
            ? new Error(data.err)
            : null;
        callback(err, data);
    });
};