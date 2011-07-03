ku.module('ku.drag');

ku.require('ku.useragent');
ku.require('ku.event');

ku.drag.DataTransfer = function() {
    this.data  = { };
    this.proxy = null;
    this.offsetX = 10;
    this.offsetY = 15;
};

def = ku.drag.DataTransfer.prototype;
def.className = 'ku-data-transfer';

def.init = function(x, y) {
    this.startX = x;
    this.startY = y;
};

def.setData = function(fmt, data) { this.data[fmt] = data };
def.getData = function(fmt) { return this.data[fmt] };
def.clearData = function(fmt) { delete( this.data[fmt] ) };

def.setDragProxy = function(proxy, x, y) {
    proxy.style.position = 'absolute';
    this.proxy = proxy;
    if (typeof x == 'number') this.offsetX = x;
    if (typeof y == 'number') this.offsetY = y;
};

def.addElement = function(elemt) {
    throw 'ku.drag.DataTransfer.addElement NYI';
    this.appendChild(elemt);
};

def.moveTo = function(x, y) {
    try {
        this.proxy.style.top  = (this.startY+(y-this.startY)+this.offsetY)+'px';
        this.proxy.style.left = (this.startX+(x-this.startX)+this.offsetX)+'px';
    } catch (ex) {
        // FIXME - the whole draggable stuff for IE isn't working yet
        ku.debug("ku.drag.DataTransfer.moveTo("+x+", "+y+") failed with: "+ex.message);
    }
};

def.updateEnd = function() {
    this.endX = parseInt(this.proxy.style.left);
    this.endY = parseInt(this.proxy.style.top );
};

ku.drag = {
    INITIAL : 1, STARTED : 2, DROPPED : 3,
    EVENTS  : [ 'dragstart', 'dragenter', 'dragleave', 'drop', 'dragend' ],
    dataTransfer : null,
    state : 0
};

ku.drag.cancel = ku.drag.reset = function() {
    ku.drag.dataTransfer = null;
    ku.drag.state = 0;
};

ku.drag.enable = function(node) {
    node.setAttribute('draggable', 'true');
    node.draggable = true;

    for (var i = 0; i < ku.drag.EVENTS.length; i++) {
        var type = ku.drag.EVENTS[i];
        if (ku.userAgent.is_ie) node['on'+type] = function() { return false };
        if (node.getAttribute(type) && typeof node[type] != 'function') {
            node[type] = new Function('signal', node.getAttribute(type));
        }
    }

    var body = node.ownerDocument.body;
    var move = ku.delegate(node, function(e) {
        e = ku.event.fetch(e);
        if (ku.drag.state < ku.drag.STARTED) {
            ku.drag.state = ku.drag.STARTED;

            var data = ku.drag.dataTransfer = new ku.data.DataTransfer;

            data.init(e.clientX+ku.util.getScrollX(), e.clientY+ku.util.getScrollY());
            ku.drag.dispatch(this, 'dragstart', { dataTransfer : data }, e);

            if (!data.proxy) {
                data.setDragProxy(this.cloneNode(true));
                ku.util.setOpacity(data.proxy, 75);
            }

            ku.util.setSelectable(body, false);

            body.style.cursor = "move";
            data.moveTo(e.clientX+ku.util.getScrollX(), e.clientY+ku.util.getScrollY());

            if (!data.proxy.parentNode) {
                data.isAutoProxy = true;
                body.appendChild(data.proxy);
            }
        } else {
            var data = ku.drag.data;
            ku.drag.dataTransfer.moveTo(
                e.clientX+ku.util.getScrollX(), e.clientY+ku.util.getScrollY()
            );
            ku.drag.dispatch(this, 'drag', { dataTransfer : data }, e);
        }
    });

    var over = ku.delegate(node, function(e) {
        e = ku.event.fetch(e);
        ku.drag.dispatch(e.target, 'dragenter');
    });

    var out = ku.delegate(node, function(e) {
        e = ku.event.fetch(e);
        ku.drag.dispatch(e.target, 'dragleave');
    });

    var up = ku.delegate(node, function(e) {
        ku.drag.state = ku.drag.DROPPED;
        ku.event.removeListener(body, 'mouseup',   up  );
        ku.event.removeListener(body, 'mousemove', move);
        ku.event.removeListener(body, 'mouseover', over);
        ku.event.removeListener(body, 'mouseout',  out );

        e = ku.event.fetch(e);
        if (!e || !ku.drag.dataTransfer) return ku.drag.reset();

        var data = ku.drag.dataTransfer;
        data.updateEnd();
        ku.drag.dispatch(e.target, 'drop', { dataTransfer: data }, e);
        if (data.isAutoProxy) body.removeChild(data.proxy);

        body.style.cursor = "auto";
        ku.util.setSelectable(body, true);

        ku.drag.dispatch(this, 'dragend', { dataTransfer : data });
        ku.drag.state = 0;
        ku.drag.cancel = ku.drag.reset;
        ku.drag.dataTransfer = null;
        ku.drag.delegates = { };
    });

    var down = delegate(node, function(e) {
        e = ku.event.fetch(e);
        e.preventDefault();

        ku.drag.state = ku.drag.INITIAL;

        ku.event.addListener(body, 'mousemove', move);
        ku.event.addListener(body, 'mouseup',   up  );
        ku.event.addListener(body, 'mouseover', over);
        ku.event.addListener(body, 'mouseout',  out );

        ku.drag.delegates = {
            mouseup : up, mouseover : over, mousemove : move, mouseout : out
        };

        ku.drag.cancel = up;
    });

    ku.event.addListener(node, 'mousedown', down);
};

ku.drag.delegateMouseEvent = function(e) {
    if (ku.drag.state < ku.drag.STARTED) return;
    if (!ku.drag.delegates[e.type]) return;
    ku.drag.delegates[e.type](e);
};

ku.drag.dispatch = function(node, type, sig, evt) {
    sig = sig || { };
    if (evt) {
        sig.offsetX = evt.layerX;
        sig.offsetY = evt.layerY;
    }
    try {
        if (node[type]) node[type](sig);
    } catch (ex) {
        window.setTimeout(function() { throw ex }, 1);
    }
    try {
        if (node.isObservable) {
            node.notifyObservers(type, sig, true);
        } else {
            ku.util.callUp(node, 'notifyObservers', type, sig, true);
        }
    } catch (ex) {
        window.setTimeout(function() { throw ex }, 1);
    }
};

