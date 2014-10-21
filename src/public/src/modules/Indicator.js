/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012. All rights reserved.
 */

Indicator = {

    spinner: function() {
        return $('<div data-role="spinner"><div class="spinner dashes spinner-large-blue"> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
            <div></div> \
         </div></div>');
    },

    config: function() {
        return {
            message: this.spinner(),
            css : {
                border : 'none',
                padding : '15px',
                backgroundColor : 'transparent',
                '-webkit-border-radius' : '10px',
                '-moz-border-radius' : '10px',
                centerX: true,
                centerY: true,
                opacity : 1.0,
                color : '#000',
                'font-family' : 'Sans-serif',
                'letter-spacing' : '.5px',
                'font-size' : '16px',
                'font-weight' : 'bold'
            },
            overlayCSS: { backgroundColor: '#fff' }
        };
    },

    block: function(element) {
        element.block(this.config());
    },

    unblock: function(element) {
        element.unblock();
    },

	start : function() {
		$.blockUI(this.config());
	},

	stop : function() {
		$.unblockUI();
	},
	
	alert: function(message) {
		if(!message || message == 'undefined') return;
		$.jGrowl(message, { life: 4000, color: 'blue' });
	},
	
	stickyAlert: function(message) {
		if(!message || message == 'undefined') return;
		$.jGrowl(message, { sticky: true, life: 4000, icon: 'glyphicon glyphicon-bell', color: 'blue' });
	},

    success: function(message) {
        if(!message || message == 'undefined') return;
        $.jGrowl('&nbsp;'+message, { life: 5000, icon: 'glyphicon glyphicon-ok', color: 'green' });
    },

    info: function(message) {
        if(!message || message == 'undefined') return;
        $.jGrowl('&nbsp;'+message, { life: 5000, icon: 'glyphicon glyphicon-info-sign', color: 'orange' });
    },

    danger: function(message) {
        if(!message || message == 'undefined') return;
        $.jGrowl('&nbsp;'+message, { life: 5000, icon: 'glyphicon glyphicon-bell', color: 'red' });
    }
};