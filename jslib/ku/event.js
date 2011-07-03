ku.module('ku.event');

ku.event = function(e) {
    e = e || window.event;
    if (!e) return null;
    if (typeof e.clientX == 'undefined') e.clientX = e.pageX;
    if (typeof e.clientY == 'undefined') e.clientY = e.pageY;
    if (typeof e.target  == 'undefined') e.target  = e.srcElement;

    if (typeof e.layerX != 'number') {
        var x, y;
        if (typeof e.x == 'number') {
            x = e.x;
            y = e.y;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        e.layerX = x;
        e.layerY = y;
    }

    if (typeof e.pageX != 'number') {
        e.pageX = e.clientX + document.body.scrollLeft;
        e.pageY = e.clientY + document.body.scrollTop;
    }

    if (!e.stopPropagation) {
        e.stopPropagation = function() { this.cancelBubble = true };
        e.preventDefault  = function() { this.returnValue = false };
    }
    e.stop   = e.stopPropagation;
    e.cancel = e.preventDefault;
    return e;
};

ku.event.addListener = function(node, evname, func) {
    if (node.attachEvent) {
        node.attachEvent("on" + evname, func);
    } else {
        node.addEventListener(evname, func, false);
    }
};

ku.event.removeListener = function(node, evname, func) {
    if (node.detachEvent) {
        node.detachEvent("on" + evname, func);
    } else {
        node.removeEventListener(evname, func, false);
    }
};

