/*
 *  Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012 2013. All rights reserved.
 */

App.media = {
    restURL: App.config.protocol + "://" + App.config.host + App.config.hash,
    websocketURL: "ws://" + App.config.host,
    requestCommand: function() {
        this.url = "";          //'mcRest'
        this.verb = "";         //'GetItemsByCategoryType'
        this.payloadText = "";  //
        this.callBack = "";     // callBack function
        this.errorHandler = ""; // error handler function
    },
    sendPayload: function(createPayload, updatePayload, deletePayload, verb) {
        console.warn("Sending Payload");
        createPayload = JSON.stringify({payloadText: createPayload});
        updatePayload = JSON.stringify({payloadText: updatePayload});
        deletePayload = deletePayload.replace(/"/g, '\\"');

        if (!verb)
            var verb = 'SubmitTransactions';
        var token = App.auth.getToken();
        var data = '{\
		        "application": "LD Analyst",\
		        "version": "1",\
		        "community": "' + App.auth.getCommunity() + '",\
		        "loginToken": "' + token + '",\
		        "verb": "' + verb + '",\
		        "isResponse": false,\
		        "connectionType": "Wifi",\
		        "instance": 1,\
		        "itemCount": 0,\
                        "timestamp": ' + App.utils.newTimeStamp() + ',\
		        "guid": "' + App.utils.newUUID() + '",\
		        "payloads": [\
		            {\
		                "payload": {\
		                    "isZipped": false,\
		                    "mimetype": "application/json",\
		                    "name": "create",\
		                    "isBase64Encoded": false,\
		                    ' + createPayload.substr(1, createPayload.length - 2) + '\
		                }\
		            },\
		            {\
		                "payload": {\
		                    "isZipped": false,\
		                    "mimetype": "application/json",\
		                    "name": "update",\
		                    "isBase64Encoded": false,\
		                    ' + updatePayload.substr(1, updatePayload.length - 2) + '\
		                }\
		            },\
		            {\
		                "payload": {\
		                    "isZipped": false,\
		                    "mimetype": "application/json",\
		                    "name": "delete",\
		                    "isBase64Encoded": false,\
		                    "payloadText": "' + deletePayload + '"\
		                }\
		            }\
		        ]\
		    }';

        $.ajax({
            type: 'POST',
            url: App.media.restURL + 'mcRest',
            data: {data: data}
        }).success(function(data, textStatus, xhr) {
            console.log("item saved on server: " + xhr.responseText);

            if (typeof data != 'object')
                var ret = JSON.parse(App.auth.toUTF8(data));
            else
                var ret = data;

            for (var i = 0; i < ret.payloads.length; i++) {
                if (ret.payloads[i].payload.payloadText)
                    ret.payloads[i].payload.payloadData = JSON.parse(ret.payloads[i].payload.payloadText);
            }

            Mediator.publish('payloadSubmitted');
        }).error(function(jqXHR, textStatus, errorThrown) {
            var message;
            if (jqXHR.status == 0) {
                message = "We're sorry, your item was not submitted. Please make sure that you're connected to the internet and try again.";
            } else if (jqXHR.status == 500) {
                message = "We're sorry, the server encounted an error while processing your item. Please try again.";
            } else if (jqXHR.status == 503) {
                message = "We're sorry, the server is currently unavailable. Please wait a moment and try submitting your item again.";
            } else {
                message = "We're sorry, an unknown error has occured while saving your item.";
            }

            Mediator.publish('payloadFailed', message);
        });
    },
    saveMedia: function(mediaAbstract, file) {

        if (mediaAbstract.data.name !== undefined && mediaAbstract.data.name !== null) {
            if (mediaAbstract.data.name.indexOf(".mp4") !== -1)
                mediaAbstract.data.contentType = "video/mp4";
            if (mediaAbstract.data.name.indexOf(".pdf") !== -1)
                mediaAbstract.data.contentType = "application/pdf";
            if (mediaAbstract.data.name.indexOf(".txt") !== -1)
                mediaAbstract.data.contentType = "text/plain";
            if (mediaAbstract.data.name.indexOf(".png") !== -1)
                mediaAbstract.data.contentType = "image/png";
            if (mediaAbstract.data.name.indexOf(".jpg") !== -1)
                mediaAbstract.data.contentType = "image/jpeg";
        }

        if (mediaAbstract.headers.id !== undefined && mediaAbstract.headers.id !== null) {
            //Update

            // BN:  Do we really have to do this?
            if (file !== null && file !== undefined) {
                //If there is a file we delete the old doc and create a new one
                this.sendPayload("[]", "[]", JSON.stringify([mediaAbstract.headers.id]));

                mediaAbstract.headers = {
                    clientId: App.utils.newUUID(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    action: "Create"
                };

                console.log("Resaving Document");
                this.saveMedia(mediaAbstract, file);
            }
            else {
                // Else do a regular update
                mediaAbstract.data.updatedAt = App.utils.isoTimestamp();
                mediaAbstract.data.updatedBy = App.auth.getUserId();
                mediaAbstract.headers.revisionId = App.utils.newUUID();
                mediaAbstract.headers.action = "Update";
                mediaAbstract.headers.updatedAt = App.utils.longTimestamp();

                if (typeof mediaAbstract.headers.createdAt === 'undefined') {
                    mediaAbstract.headers.createdAt = App.utils.longTimestamp();
                }

                var desc = _.isEmpty(mediaAbstract.data.description)
                    ? _.isEmpty(mediaAbstract.data.fileName)
                    ? mediaAbstract.headers.mediaId
                    : mediaAbstract.data.fileName
                    : mediaAbstract.data.description;

                App.socket.query('liquidServer', {
                    command: 'upsert',
                    items: [mediaAbstract]
                }, function(err, result) {
                    if (err !== null) {
                        Indicator.danger('Failed to save Media '+desc+': '+err.toString());
                    } else {
                        Indicator.stop();
                        console.log('Media Abstract Saved');
                        Indicator.success('Media '+desc+' was saved successfully.');
                    }
                });
            }

        }
        else {
            // Create
            mediaAbstract.data.updatedAt = (new Date()).getTime();
            mediaAbstract.data.updatedBy = App.auth.getUserId();
            mediaAbstract.data.createdBy = App.auth.getUserId();
            //this.pending.push(mediaAbstract.headers.clientId);
            this.createMediaOnServer(JSON.stringify(mediaAbstract.data), file);
        }
    },
    createMediaOnServer: function(payload, file) {
        var fd = new FormData();
        fd.append("community", App.auth.getCommunity());
        fd.append("loginToken", App.auth.getToken());
        fd.append("media", file);
        fd.append("mediaAbstract", payload);

        $.ajax({
            url: App.config.restUrl + '/ls/external/media',
            type: 'POST',
            data: fd,
            cache: false,
            contentType: false,
            processData: false

        }).success(function(data) {
            console.log("Media Sent to Server - fetching documents");
            Indicator.stop();
            Indicator.success('Media was successfully uploaded to Liquid Server');
            return;

        }).error(function(jqXHR, textStatus, errorThrown) {
            var message;
            if (jqXHR.status == 0) {
                message = "We're sorry, your document was not submitted. Please make sure that you're connected to the internet and try again.";
            } else if (jqXHR.status == 500) {
                message = "We're sorry, the server encounted an error while processing your document. Please try again.";
            } else if (jqXHR.status == 503) {
                message = "We're sorry, the server is currently unavailable. Please wait a moment and try submitting your document again.";
            } else {
                message = "We're sorry, an unknown error has occured while saving your document.";
            }
            Mediator.publish('documentFailed', message);
            console.log(message + jqXHR.status);
            Indicator.stop();
            Indicator.danger('Media was not uploaded to Liquid Server '+ message);
        });
    }
};
