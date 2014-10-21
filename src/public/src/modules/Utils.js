/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012. All rights reserved.
 */

App.utils = {
    newUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    newUID: function() {
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4)
    },
    newTimeStamp: function() {
        return "" + new Date().getTime();
    },
    isoTimestamp: function() {
        return moment(new Date()).format();
    },
    longTimestamp: function() {
        return (new Date()).getTime();
    },
    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    fileSizeString: function(fileSize) {

        if (fileSize === undefined || fileSize === null || fileSize.length === 0) {
            return "N/A";
        }

        var filesize = fileSize.valueOf();
        if (filesize > 1048576) {
            return Math.round(filesize / 1048576 * 100) / 100 + " Mbytes";
        }
        else if (filesize > 1024) {
            return Math.round(filesize / 1024 * 100) / 100 + " Kbytes";
        }
        else {
            return this.numberWithCommas(filesize) + " bytes";
        }
    },
    unCamelCase: function(string) {
        return string
            // insert a space before all caps
            .replace(/([A-Z])/g, ' $1')
            // uppercase the first character
            .replace(/^./, function(str){ return str.toUpperCase(); });
    }
};
