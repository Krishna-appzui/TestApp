
App.config = {
    protocol : 'https',
    host: 'ldcloud-dev.liquidanalytics.com',
    hash : "/ls/external/",
    logLevel : 3
};

App.config.setData = function(data) {

    this.options = {};

    var self = this;

    Object.keys(data).forEach(function (key) {
        self[key] = data[key];
    });

    this.restUrl = App.config.protocol + '://' + App.config.host;
}

App.config.webSocketUrl = 'ws://' + App.config.host;
App.config.restUrl = App.config.protocol + '://' + App.config.host;