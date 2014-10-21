/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 */

var Edit = {
    
    MediaAbstract: {
        
        fields: [
            {
                field: "description",
                label: "Title",
                type: "text"
            },
            {
                field: "tags",
                label: "Tags",
                type: "text"
            },
            {
                field: "link",
                label: "Link",
                type: "text"
            },
            {
                nameField: "name",
                otherNameField: "fileName",
                sizeField: "fileSize",
                type: "file"
            },
            {
                field: "mediaType",
                label: "Media Type",
                type: "dimension",
                dimensionLevel: "/Data/mediaType"
            }
        ]
    }
};


