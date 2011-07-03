ku.module('ku.skin');

ku.require('ku.ui.Component');
ku.require('ku.ui.Engine');
ku.require('ku.xml');

ku.ui.engine = new ku.ui.Engine();

ku.ui.init = function(nid) {
    var node = ku.get(nid);
    var xstr = '<?xml version="1.0"?>'+
    '<ku:view xmlns:ku="kudu">'+
        ku.util.unentityfy(node.innerHTML)+
    '</ku:view>';
    var xdoc = (new ku.xml.Parser).parseFromString(xstr,'text/xml');
    var frag = this.engine.render(xdoc.documentElement);
    node.parentNode.insertBefore(frag, node);
};

ku.ui.create = function(name, atts) {
    return this.engine.create(name, atts);
};
ku.ui.render = function(desc, func) {
    return this.engine.render(desc, func);
};
ku.ui.template = function(name, func) {
    return this.engine.template(name, func);
};

ku.ui.template('ku:view', function(ctx, node) {
    ctx.apply(ctx.parent, node.childNodes);
});

ku.ui.template('*', function(ctx, node) {
    if (this['ku:if']) {
        ctx.engine.templates['ku:if'].call(this, ctx, node);
    } else if (this['ku:repeat']) {
        ctx.engine.templates['ku:repeat'].call(this, ctx, node);
    } else if (this['ku:repeatchildren']) {
        ctx.engine.templates['ku:repeatchildren'].call(this, ctx, node);
    } else {
        ctx.apply([node.nodeName, this], node.childNodes);
        //ctx.put(node);
        //ctx.apply(node, node.childNodes);
    }
});

ku.ui.template('#text', function(ctx, node) {
    //ku.debug("#text: "+node.nodeValue+" parent: "+ctx.parent);
    ctx.put(node.nodeValue);
});

ku.ui.template('ku:if', function(ctx, node) {
    var expr = this['ku:if'];
    ku.debug("EXPR: "+expr);
    if (eval(expr)) {
        ku.debug("true");
        ctx.apply([node.nodeName, this], node.childNodes);
    } else {
        ku.debug("false");
    }
});

ku.ui.template('ku:repeat', function(ctx, node) {
    var model = self[this['ku:repeat']];
    var row = model.first();
    while (row) {
        var copy = node.cloneNode(true);
        var cqry = ku.query(copy);
        cqry.$('.@*').union(cqry.$('..*.@*')).each(function(a) {
            a.nodeValue = ku.util.supplant(a.nodeValue, row);
        });
        cqry.$('..#text').each(function(t) {
            t.nodeValue = ku.util.supplant(t.nodeValue, row);
        });
        ctx.apply([node.nodeName, ctx.state(node)], cqry.$('.#node'));
        row = model.next();
    }
});

ku.ui.template('ku:repeatchildren', function(ctx, node) {
    var model = self[this['ku:repeatchildren']];
    var row = model.first();
    var list = [ ];
    while (row) {
        var elts = ctx.$('.*').clone(true);
        for (var x = 0; x < elts.length; x++) {
            var cqry = ku.query(elts[x]);
            cqry.$('.@*').union(cqry.$('..*.@*')).each(function(a) {
                a.nodeValue = ku.util.supplant(a.nodeValue, row);
            });
            cqry.$('..#text').each(function(t) {
                t.nodeValue = ku.util.supplant(t.nodeValue, row);
            });
            var that = ctx.state(elts[x]);
            var desc = [elts[x].nodeName, that].concat(cqry.$('.#node'));
            list.push(desc);
        }
        row = model.next();
    }
    ctx.apply([node.nodeName, this], list);
});


ku.ui.template('ku:block', function(ctx, node) {
    ctx.apply(['div', this], node.childNodes);
});

ku.ui.template('ku:include', function(ctx, node) {
    var req = ku.request();
    req.open('GET', this.source, false);
    req.send(null);
    if (req.status == 200 || req.status == 304) {
        if (req.responseXML) {
            var desc = req.responseXML.documentElement;
            ctx.apply(ctx.parent, [desc]);
        } else {
            throw new Error("not an XML document: "+this.source);
        }
    } else {
        var err = document.createElement('div');
        err.innerHTML = req.responseText;
        ctx.put(err);
    }
});

ku.ui.template('ku:model', function(ctx, node) {
    ku.require('ku.model');
    var data = node.firstChild ? node.firstChild.nodeValue : null;
    if (data) {
        // safe to eval here
        var json = ku.util.unentityfy(data.replace(/[\r\n\t]/g, ''));
        var data = (new Function('', 'return '+json))();
        self[this.id] = new ku.model.DataSet(data);
    } else {
        // external, so decode
        ku.require('ku.json');
        var req = ku.request();
        req.open('GET', this.source, false);
        req.send(null);
        if (req.status == 200 || req.status == 304) {
            var data = ku.json.decode(req.responseText);
            self[this.id] = new ku.model.DataSet(data);
        } else {
            var err = document.createElement('div');
            err.innerHTML = req.responseText;
            ctx.put(err);
        }
    }
});

ku.ui.template('ku:button', function(ctx, node) {
    ku.require('ku.ui.Button');
    ku.bless(this, ku.ui.Button);
    if (!this.style.width) this.style.width = this.width || '100px';
    var desc = (
        [ 'div', this,
            [ 'div', {
                'class' : 'ku-button-cap',
                'style' : "width:"+this.style.width },
                [ 'a', {
                    'class' : 'ku-button-label',
                    'href'  : "javascript:void('"+this.label+"')",
                    'style' : "width:"+this.style.width
                }, this.label ]
            ]
        ]
    );
    ctx.put(desc);
});

ku.ui.template('ku:hbox', function(ctx, node) {
    this.cellpadding = 0; this.cellspacing = 0; this.border = 1;
    var trow = [ 'tr' ];
    var kids = ctx.$('.*');
    for (var x = 0; x < kids.length; x++) {
        trow.push([ 'td', kids[x] ]);
    }
    ctx.put([ 'table', this, [ 'tbody', trow ] ]);
});

ku.ui.template('ku:vbox', function(ctx, node) {
    this.cellpadding = 0; this.cellspacing = 0; this.border = 1;
    var tbody = [ 'tbody' ];
    var kids = node.childNodes;
    for (var x = 0; x < kids.length; x++) {
        tbody.push([ 'tr', [ 'td', kids[x] ] ]);
    }
    ctx.put([ 'table', this, tbody ]);
});

ku.module('ku.ui.Region');

ku.ui.Region = function(node) {
    node.style.display = 'none';
    this.node = node;
    this.output = ku.ui.render(node).firstChild;
    node.parentNode.insertBefore(this.output, node);
    this.output.style.display = '';
    this.model = self[node.getAttribute('ku:region')];
    this.model.addObserver(this);
};

def = ku.ui.Region.prototype;
def.modelChanged = function(data) {
    var invalid = this.output;
    var $this = this;
    ku.ui.render(this.node, function(frag) {
        $this.output = frag.firstChild;
        invalid.parentNode.replaceChild($this.output, invalid);
        $this.output.style.display = '';
    })
};

