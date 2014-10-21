/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 *
 * @namespace client.library
 * @module client.library
 * @class LibraryView
 */

var LibraryView = Backbone.View.extend({
    query: null,
    items: [],
    events: {
        "click #libraryLoadMoreBtn": "loadMore",
        'click #mediaList li a': 'actionSelected',
        'click .imageLink': 'imagePressed',
        "click img": 'imagePressed',
        "click #newMediaBtn": 'newMediaBtnPressed',
        "click #librarySearchBtn": "searchBtnPressed",
        'keyup #librarySearchInput[type=text]': 'searchKeyPressed'
    },
    /**
     * @method initialize
     */
    initialize: function() {
        this.defineQuery();
    },

    defineQuery: function(searchText) {
        this.query = new SocketStreamQuery({
            namespace:"daltile",
            category: "content",
            itemType:"MediaAbstract",
            sortBy:"updatedat",
            pageSize: 96,
            search: searchText,
            queryFilter: [
                [
                    {
                        field: 'mediatype',
                        value: '/Data/mediaType[Thumbnail]',
                        comparison: 'ne'
                    },
                    {
                        field: 'mediatype',
                        comparison: 'in'
                    }
                ]
            ]
        });
    },

    /**
     * @method willShow
     */
    willShow: function() {

        App.navBar.setNavBtnActive('LibraryView');
        this.loadMore();
    },
    /**
     * @method didShow
     */
    didShow: function() {
    },
    willHide
            : function() {
            },
    didHide: function() {
    },
    render: function() {
    },
    loadMore: function() {
        Indicator.start();

        var self = this;
        this.query.next(function(results, last) {
            self.loadResults(results, last);
        });
    },
    loadResults: function(results, last) {

        if (results === undefined || results === null || results.length === 0) {
            Indicator.stop();
            return;
        }

        var mediaCellView = $('#MediaCellView').html();
        var mediaUrl = App.config.protocol + "://" + App.config.host + "/ls/external/media?community=" + App.auth.getCommunity();
        var mediaList = $('#mediaList');
                
        $.merge(this.items, results);

        $.each(results, function(index, mediaAbstract) {

            var imageUrl = mediaUrl + "&mediaId=" + mediaAbstract.data.mediaId;
            var thumbnailUrl = mediaUrl + "&mediaId=" + mediaAbstract.data.mediaId + "&thumbnail=true";
            var rel;

            if (mediaAbstract.data.mediaType === '/Data/mediaType[Video]') {
                rel = 'lightvideo[|width:840px; height:700px;]';
            }

            var updatedString;

            if (typeof mediaAbstract.data.updatedAt !== 'undefined') {
                var dayWrapper = moment(mediaAbstract.data.updatedAt);
                updatedString = dayWrapper.format('MMMM Do YYYY, h:mm a');
            } else {
                updatedString = 'N/A';
            }

            var cell = $(ejs.render(mediaCellView, {
                mediaAbstract:mediaAbstract,
                fileSize: App.utils.fileSizeString(mediaAbstract.data.fileSize),
                updatedAt: updatedString,
                thumbnailUrl: thumbnailUrl,
                imageUrl: imageUrl,
                rel: rel,
                description: _.isEmpty(mediaAbstract.data.description)
                    ? _.isEmpty(mediaAbstract.data.name)
                    ? mediaAbstract.data.fileName
                    : mediaAbstract.data.Name
                    : mediaAbstract.data.description
            }));

            cell.data('index', index);
            mediaList.append(cell);
        });

        Indicator.stop();
    },
    actionSelected: function(ev) {
        var option = $(ev.target).text();
        var cell = $(ev.target).closest('div[data-role="view"]');
        var index = cell.data('index');
        var item = this.items[index];
        App.context.currentItem = item;

        switch (option) {

            case 'Edit':
                App.presentModalPage('EditFormView');
                break;

            case 'Delete':
                var desc = _.isEmpty(item.data.description)
                    ? _.isEmpty(item.data.fileName)
                        ? item.headers.mediaId
                        : item.data.fileName
                    : item.data.description;
                bootbox.confirm('Are you sure you want to delete ' + desc + '?', function(result) {
                    if (result) {
                        App.socket.query('liquidServer', {
                            command: 'delete',
                            itemIds: [item.headers.id]
                        }, function(err, result) {
                            if (err !== null) {
                                console.log('Error Deleting Media Abstract: '+err);
                                Indicator.danger('Failed to delete Media '+desc+': '+err.toString());
                            } else {
                                console.log('Media Abstract Deleted');
                                Indicator.success('Media '+desc+' was deleted successfully.');
                            }
                        });
                    }
                });
                break;
            default:
                break;
        }
    },
    imagePressed: function(ev) {

        var image = $(ev.target);
        var mediaType = image.data('mediatype');

        switch (mediaType) {

            case '/Data/mediaType[Quote]':
            case '/Data/mediaType[PDF]':
                window.open(image.data('remote'),"_self");
                break;

            case '/Data/mediaType[Video]':
                window.open(image.data('remote'),"_self");
                break;

            default:
                $(ev.target).ekkoLightbox({type: 'image'});
                break;
        }
    },
    newMediaBtnPressed: function(ev) {
        App.context.currentItem = null;
        App.presentModalPage('EditFormView', {
            itemType: 'MediaAbstract'
        });
    },
    /**
     * Triggered when the user taps the search button.  Re-creates the StreamQuery with the
     * text in the search box as the search parameter.
     * @method searchBtnPressed
     * @param ev
     */
    searchBtnPressed: function(ev) {

        var searchText = $('#librarySearchInput').val();

        if (searchText.length === 0)
            searchText = undefined;

        console.log(searchText);
        this.defineQuery(searchText);

        $('#mediaList').html('');
        this.items = [];
        this.loadMore();
    },
    /**
     * Fires on keyup event on the search input box;
     * Auto triggers the search (by calling searchBtnPressed) when needed.
     * @method searchKeyPressed
     * @param ev
     */
    searchKeyPressed: function(ev) {
        // If they hit return, search
        if (ev.keyCode === 13) {
            this.searchBtnPressed();
        } else if (ev.keyCode === 8 || ev.keyCode === 46) {
            // If they hit backspace or delete and the search text
            // is empty, search
            var value = $(ev.target).val();

            if (value.length === 0) {
                this.searchBtnPressed();
            }
        }
    }
});
