ku = { compile : function(s, c) { try { return (new Function('def', s+'\nreturn '+c))() } catch(ex) {
        throw new Error('['+c+'-'+(ex.lineNumber ? ex.lineNumber : ex.line)+'] '
            +ex.name+': '+ex);
        };
    },
    TOP_Z_INDEX : 0,
    DEBUG : true,
    debug : function() { },
    models : { }
};

ku.XMLHttpRequest = function() {
    if (self.ActiveXObject) {
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
    return new XMLHttpRequest;
};

ku.LOADED = { };
ku.BASE = "";
if (!ku.BASE) {
    var head = document.documentElement.getElementsByTagName("head")[0];
    var scrpts = head.getElementsByTagName("script");
    for (var x = 0; x < scrpts.length; x++) {
        if (/^(.*)\/jslib\/ku\/core\.js$/.test(scrpts[x].getAttribute("src"))) {
            ku.BASE = RegExp.$1;
        }
    }
}

ku.request = function() { return new ku.XMLHttpRequest };
ku.require = function(c) {
    if (typeof c == 'function') return c;
    if (typeof c == 'object'  ) {
        return c.prototype ? c.prototype.constructor : c.constructor;
    }

    var p;
    if (/\.js$/.test(c)) {
        p = c;
        c = p.replace(/^[^.]+js(lib)?\/?/, '')
            .replace(/\//g, '.').replace(/\.js/, '');
    } else {
        p = (ku.BASE + '/./jslib/' + c.replace(/\./g, '/'))+'.js';
    }
    if (!ku.LOADED[c]) {
        var r = ku.request();
        r.open('GET', p, false);
        r.send(null);
        ku.LOADED[c] = true;
        if (/^file:\/\//.test(location) || (r.status == 200 || r.status == 304)) {
            var o;
            try {
                o = ku.compile(r.responseText, c);
                ku.LOADED[c] = o;
            } catch(ex) {
                throw new Error("failed to compile : "+c+" reason: "+ex.message);
            }
            return o;
        } else {
            throw new Error("failed to load "+c+": "+r.statusText);
        }
    } else {
	return ku.LOADED[c];
    }
};

ku.module = function(str) {
    var nms = str.split('.');
    var sym = nms[nms.length-1];
    var ns = self;
    for (var x = 0; x < nms.length-1; x++) {
        if (typeof ns[nms[x]] == 'undefined') { ns[nms[x]] = { } }
        ns = ns[nms[x]];
    }
    if (typeof ns[sym] == 'undefined') {
        ns[sym] = function() { };
        ns[sym].toString = function() { return str };
    }
    ku.LOADED[str] = ns[sym];
    return ns[sym];
};


ku.is = function(klass, base) {
    klass.prototype = new base(arguments[2]);
    return klass;
};

ku.does = function(klass, role) {
    for (var p in role.prototype) {
        if (p == 'constructor') continue;
        klass.prototype[p] = role.prototype[p];
    }
    return klass;
};

ku.bless = function(proto, klass) {
    for (var p in klass.prototype) { proto[p] = klass.prototype[p] }
    proto.implementor = klass;
    return proto;
};

Function.prototype.is   = function(that) { return ku.is(this, that)   };
Function.prototype.does = function(that) { return ku.does(this, that) };

ku.delegate = function(o, f) {
    var delg = function() {
        return arguments.callee.func.apply(arguments.callee.that, arguments)
    };
    delg.func = f; delg.that = o;
    return delg;
};

ku.get = function(that) {
    if (typeof that == 'string') {
        if (that.indexOf('.') != -1) {
            var bits = that.split('.');
            that = self;
            for (var x = 0; x < bits.length; x++) {
                that = that[bits[x]];
            }
            return that;
        } else if (self[that]) {
            return self[that];
        } else {
            return document.getElementById(that);
        }
    }
    return that;
};

ku.map = function(a,f) {
    var out = [ ];
    for (var x = 0, l = a.length; x < l; x++) out[x] = f(a[x]);
    return out;
};
ku.grep = function(a,f) {
    var out = [ ], ret;
    for (var x = 0, l = a.length; x < l; x++) {
        if (ret = f(a[x])) out[out.length] = a[x];
    }
    return out;
};

ku.deps = [
    'ku.xml',
    'ku.util',
    'ku.json',
    'ku.event',
    'ku.query',
    'ku.broker',
    'ku.console',
    'ku.useragent',
    'ku.watch',
    //'ku.session',
    //'ku.history',
    //'ku.skin',
    'ku.view',
    'ku.data',
    'ku.form',
    'ku.ajax'
];

for (var x = 0; x < ku.deps.length; x++) ku.require(ku.deps[x]);

