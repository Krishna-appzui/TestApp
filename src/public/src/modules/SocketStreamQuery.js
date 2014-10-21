/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * SocketSocketStreamQuery
 * 4/3/14
 */

var SocketStream = {
    fetchAll: function(parameters, completionHandler) {

        var streamQuery = new SocketStreamQuery(parameters);

        streamQuery.fetchAll(function(results) {
            completionHandler(results);
        });
    }
};

function SocketStreamQuery(parameters) {
    this.parameters = parameters;
    this.first = null;
    this.last = null;
    this.stack = new FunctionStack();

    if (this.parameters["pageSize"] === undefined || this.parameters["pageSize"] === null) {
        this.parameters["pageSize"] = 500;
    }

    if (this.parameters.maxResults === undefined || this.parameters.maxResults === null) {
        this.parameters.maxResults = -1;
    }

    if (this.parameters["itemType"] === undefined || this.parameters["pageSize"] === null) {
        console.log('Attempt to create SocketStreamQuery with no item type');
    }
}

SocketStreamQuery.prototype.sendQueryRequest = function(startsWith, completionHandler) {

    if (completionHandler === null || completionHandler === undefined) {
        return;
    }

    var options = _.cloneDeep(this.parameters);

    if (startsWith !== undefined && startsWith !== null) {
        options.startWith = startsWith;
    }

    App.socket.query('query', options, function(err, result) {
        completionHandler(result);
    });
};

SocketStreamQuery.prototype._fetchAll = function(allResults, completionHandler) {

    var limit = this.parameters.maxResults;

    if (limit !== -1 && allResults.length >= limit) {
        completionHandler(allResults);
        return;
    }

    var self = this;
    this.next(function(results, last) {

        if (results === undefined || results === null /* || last === true*/) {
            completionHandler(allResults);
        }
        else
        {
            for (var idx = 0; idx < results.length; idx++) {
                allResults.push(results[idx]);
            }

            if (last === true) {
                completionHandler(allResults);
            }
            else {
                self._fetchAll(allResults, completionHandler);
            }
        }

    });
};

SocketStreamQuery.prototype.fetchAll = function(completionHandler) {
    this._fetchAll([], completionHandler);
};

SocketStreamQuery.prototype.next = function(completionHandler) {

    if (completionHandler === null || completionHandler === undefined) {
        return;
    }

    var self = this;

    this.stack.push(function() {
        self.sendQueryRequest(self.last, function(data) {

            if (data === null || data === undefined || data.items === undefined) {
                completionHandler(null);
                return;
            }

            self.last = { key: data.lastKey, id: data.lastId };
            self.first = { key: data.firstKey, id: data.firstId };

            var last = false;

            if (data.items.length === 0 || data.items.length < self.parameters.pageSize)
                last = true;

            completionHandler(data["items"], last);
            self.stack.callNext();
        });
    });


};

/*
SocketStreamQuery.prototype.previous = function(completionHandler) {

    if (completionHandler === null || completionHandler === undefined) {
        return;
    }

    var self = this;
    this.sendQueryRequest(this.first, function(data) {

        self.last = { key: data.lastKey, id: data.lastId };
        self.first = { key: data.firstKey, id: data.firstId };
        completionHandler(data["items"]);
    });
};*/