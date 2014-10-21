/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * appCondition
 * @author Bryan Nagle
 * @date 9/11/14
 * @namespace
 * @module
 */

App.condition = {

    test: function(list, item) {

        for (var idx = 0; idx < list.length; idx++) {
            var test = list[idx];

            var actual = item.data[test.field];

            if (actual !== test.value) {
                return false;
            }
        }

        return true;
    }

}