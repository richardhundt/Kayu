ku.module("ku.ui.Component");

ku.require("ku.util");
ku.require("ku.drag");

ku.ui.Component = function() {
    return 'ku.ui.Component';    
};
ku.ui.Component.is(ku.util.Observable);

def = ku.ui.Component.prototype;

def.DEBUG = false;
def.debug = function(mesg) {
    if (this.DEBUG) ku.debug(this.className+':'+mesg);
};
def.error = function(mesg) {
    throw new Error(this.className+':'+mesg);
};

def.init = function() {
    this.initProperties();
};
def.initProperties = function() {
    var attr;
    for (var prop in this.implementor.prototype) {
        if (!(prop in ku.ui.Component.prototype)) {
            if (prop.indexOf('set_') == 0) {
                attr = prop.substr(4);
                if (this.getAttribute(attr) == null || this.getAttribute(attr) == '')
                    continue;
                var v = this.getAttribute(attr);
                if (/^[-+]?\d+(\.\d+)?$/.test(v)) {
                    if (RegExp.$1) {
                        v = parseFloat(v);
                    } else {
                        v = parseInt(v);
                    }
                }
                var o = null;
                (typeof this['set_'+attr] == 'function') && this['set_'+attr](v, o);
                this[attr] = this.getAttribute(attr);
                this.dispatchSignal('change', {
                    propName : attr,
                    newValue : v,
                    oldValue : o
                });
            }
        }
    }
    for (var x in ku.drag.EVENTS) {
        var h = ku.drag.EVENTS[x];
        if (this.getAttribute(h)) {
            this.addObserver(h, this.getAttribute(h));
        }
    }
};

def.get = function(k) {
    return typeof this['get_'+k] == 'function' ? this['get_'+k]() : this[k];
};
def.set = function(k, v) {
    var o = this[k];
    if (v === o) return;
    if (typeof this['set_'+k] == 'function') {
        this['set_'+k](v, o);
    }
    this[k] = v;
    this.dispatchSignal('change', {
        propName : k,
        newValue : v,
        oldValue : o
    });
};

