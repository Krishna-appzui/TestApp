/* 
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2012. All rights reserved.
 * @Author Bryan Nagle
 */

App.context = {
    
    arguments: {},
    
    items : {},
    
    setItem : function(item, type) {
        this.items[type] = item;
    },
    
    getItem : function(type) {
        return this.items[type];
    }
    
};


