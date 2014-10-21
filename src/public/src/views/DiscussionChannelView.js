/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * DiscussionChannelView
 * @author Bryan Nagle
 * @date 6/10/14
 * @namespace
 * @module
 */

var DiscussionChannelView = Backbone.View.extend({
    messageList: null,
    messageInput: null,
    topic: null,
    events: {
        'keypress #messageInput': 'keypressed',
        'click #sendBtn': 'sendBtnPressed'
    },

    initialize: function() {

        this.messageList = $(this.el).find('#messageList');
        this.messageInput =$(this.el).find('#messageInput');
        this.scrollToBottom();

        this.topic = new App.Topic('TestTopic');

        var self = this;
        this.topic.subscribe(function(err, data) {
            self.renderMessage(data);
        });

        this.topic.onJoin(function(err, data) {
            self.renderInfo(data.userId + ' has joined ' + data.topic + '.');
        });

        this.topic.onLeave(function(err, data) {
            self.renderInfo(data.userId + ' has left ' + data.topic + '.');
        });

    },
    scrollToBottom: function() {
        $("html, body").animate({ scrollTop: $(document).height() }, 10);
    },
    keypressed: function(e) {
        if (e.keyCode !== 13)
            return;

        this.sendBtnPressed();
    },
    renderMessage: function(data) {
        var messageTemplate = $('#DiscussionMessage').html();
        var html = ejs.render(messageTemplate, data);
        this.messageList.append($(html));
        this.scrollToBottom();
    },

    renderInfo: function(message) {
        var infoTemplate = $('#DiscussionInfo').html();
        var html = ejs.render(infoTemplate, { message: message });
        this.messageList.append($(html));
        this.scrollToBottom();
    },

    sendBtnPressed: function(ev) {

        var message = this.messageInput.val();
        this.topic.publish({ message: message });
        this.messageInput.val('');

    }

});