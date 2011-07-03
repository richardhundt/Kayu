ku.module('ku.ui.Engine');

ku.require('ku.query');

ku.ui.Engine = function(templates) {
    this.templates = templates || { };
    this.stack = [ ];
    this.stash = { };
};

def = ku.ui.Engine.prototype;

def.template = function(name, func) {
    if (arguments.length == 1) {
        return this.templates[name] || this.templates['*'];
    } else {
        this.templates[name] = func;
    }
};

def.thunk = function(prnt, desc) {
    this.stack.push(prnt);
    this.stack.push(desc);
};

def.render = function(desc) {
    if (typeof desc.nodeType == 'number' && desc.ownerDocument != document) {
        desc = document.importNode(desc, true);
    }

    var frag = document.createDocumentFragment();
    this.thunk(frag, desc);

    var stack = this.stack;
    var queue = [ ];

    while (stack.length) {
        var desc = stack.pop(), prnt = stack.pop();
        if (typeof desc == 'string' || desc instanceof String) {
            prnt.appendChild(ku.text(desc));
        }
        else if (typeof desc == 'function') {
            desc(prnt);
        }
        else if (typeof desc.nodeType == 'number') {
            this.process(desc)(prnt);
        }
        else {
            var name = desc[0], atts = desc[1], kids = 2;
            if (typeof desc[1] == 'object' && !(desc[1] instanceof Array)) {
                atts = desc[1];
            } else {
                atts = { }; kids = 1;
            }

            var elmt = ku.elmt(name, atts);
            if (this.template(name.toLowerCase())) {
                this.thunk(prnt, elmt);
            } else {
                prnt.appendChild(elmt);
                if (elmt.init) queue.push(elmt);
            }

            for (var x = desc.length - 1; x >= kids; x--) {
                this.thunk(elmt, desc[x]);
            }
        }
    }

    for (var x = queue.length - 1; x >= 0; x--) queue[x].init.call(queue[x]);
    return frag;
};

def.create = function(name, atts) {
    atts = atts || { };
    var desc = [ name, atts ];
    var elmt = this.render(desc).firstChild;
    for (var p in atts) {
        if (typeof atts[p] == 'function') elmt[p] = atts[p];
    }
    if (elmt.init) elmt.init();
    return elmt;
};

def.process = function(node) {
    var tmpl = this.template(ku.xml.getNodeName(node));
    return new ku.ui.Engine.Context(tmpl, this, node);
};


//========================================================================
// rendering context object
//========================================================================
ku.ui.Engine.Context = function(tmpl, engine, node) {
    this.engine = engine;
    this.node = node;
    var func = function(prnt) {
        var ctx = arguments.callee.context;
        ctx.parent = ctx.prnt = prnt;
        tmpl.call(ctx.self(ctx.node), ctx, ctx.node);
    };
    func.context = this;
    this.stash = engine.stash;
    return func;
};

def = ku.ui.Engine.Context.prototype;

def.select = function(expr) {
    if (!this.query) this.query = ku.query(this.node);
    return this.query.select(expr);
};
def.$ = def.select;

def.process = function(node) { return this.engine.process(node) };

def.apply = function(desc, list) {
    if (typeof desc.nodeType == 'number') {
        for (var x = list.length - 1; x >= 0; x--) {
            this.engine.thunk(desc, list[x]);
        }
    } else {
        for (var x = 0; x < list.length; x++) desc.push(list[x]);
    }
    return desc;
};

def.put = function(desc) {
    if (typeof desc.nodeType == 'number') {
        this.prnt.appendChild(desc);
    } else {
        this.engine.thunk(this.prnt, desc);
    }
    return desc;
};

def.set = function(key, val) { this.stash[key] = val };
def.get = function(key) { return this.stash[key] };

def.self = function(node, atts) {
    var self = this.atts2obj(node);
    if (typeof atts != 'undefined') {
        for (var p in atts) self[p] = atts[p];
    }
    if (node.style) {
        if (node.style.cssText != null) self.style = node.style.cssText;
        else self.style = node.style.styleText;
    }
    return self;
};

def.atts2obj = function(node) {
    if (node.nodeType != 1) return null;
    var atts = { }, key, val;
    var list = ku.query(node).$('.@*');
    for (var x = 0; x < nlist.length; x++) {
        if (!list[x].nodeValue) continue;
        key = list[x].nodeName; val = list[x].nodeValue;
        atts[key] = key.substr(0, 2) == 'on' ? new Function('event', val) : val;
    }
    return atts;
};

