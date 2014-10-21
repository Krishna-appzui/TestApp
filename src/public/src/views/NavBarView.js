/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

var NavBarView = Backbone.View.extend({
    query: null,
    events: {
        "click #logoutButton": "logoutBtnPressed",
        "click .navbar-left li": "navBtnPressed"
    },
    init: function() {
        
        var self = this;
        
        Mediator.subscribe('CredentialsUpdated', function() {
            self.updateUserInfo();
        }, this);
        
    },
    willShow: function() {
        this.updateUserInfo();
    },
    didShow: function() {
    },
    willHide: function() {
    },
    didHide: function() {
    },
    render: function() {
    },
    navBtnPressed: function(ev) {
        var button = $(ev.target).closest('li');

        button.closest('ul').find('li').each(function(index, element) {
            $(element).removeClass('active');
        });

        button.addClass('active');
    },
    logoutBtnPressed: function() {
        App.auth.logout();
    },
    updateUserInfo: function() {
        $('#navMessage').text(App.auth.getUserId()+' ('+App.auth.getCommunity()+')' );
    },
    setNavBtnActive: function(page) {

        $('.navbar-left li').each(function(index, element) {

            var button = $(element);

            if (button.data('page') === page) {

                if (!button.hasClass('active'))
                    button.addClass('active');
            }
            else {
                button.removeClass('active');
            }
        });

    }

});
