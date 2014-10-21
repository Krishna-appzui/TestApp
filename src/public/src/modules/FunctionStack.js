/**
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 * @Author Bryan Nagle
 * FunctionStack
 * 4/3/14
 */

function FunctionStack(parameters) {
    this.arr = [];
}

FunctionStack.prototype.push = function(func) {

    if (this.arr.length === 0) {
        this.arr.push(func);
        func();
        return;
    }

    this.arr.push(func);
}

FunctionStack.prototype.callNext = function() {

    if (this.arr.length === 0)
        return;

    this.arr.shift();

    if (this.arr.length === 0)
        return;

    typeof this.arr[0] == 'function' && this.arr[0]();
}
