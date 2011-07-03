ku.module('ku.query');

ku.require('ku.xml');

ku.query   = function(node) { return new ku.query.Node(ku.get(node)) };
ku.query.$ = function(expr) { return ku.query(document).select(expr) };

var rxIden = "[a-zA-Z0-9\\-:_]+|\\*";
var rxItem = "\\[((-?\\d+)|(\\d+\\s*\\.\\.\\s*-?\\d+))\\]";
var rxFunc = "\\b(parent|document|id)\\b\\(\\)";
var rxType = "#(text|processing-instruction|comment|cdata|node)";
var rxFilt = "\\(.+?\\)("+rxItem+")?(?=(\\.|$))";
var rxAttr = "@("+rxIden+")("+rxItem+")?";
var rxElmt = "("+rxIden+")("+rxItem+")?";
var rxTerm = "("+rxType+")("+rxItem+")?|("+rxFunc+")("+rxItem+")?";
var rxFrag = "("+rxAttr+")|("+rxTerm+")|("+rxElmt+")|("+rxFilt+")";
var rxChld = "\\.("+rxFrag+")";
var rxDesc = "\\.\\.("+rxFrag+")";
var rxExpr = rxDesc+"|"+rxChld;

ku.query.RX_TEST = new RegExp("^("+rxExpr+")+$", 'g');
ku.query.RX_EXEC = new RegExp(rxExpr, 'g');
ku.query.RX_ITEM = /\[(-?\d+)\]$/;
ku.query.RX_SLCE = /\[(-?\d+)\s*\.\.\s*(-?\d+)\]$/;

ku.query.Node = function(node) {
    this.node = node;
};
def = ku.query.Node.prototype;
def.compile = function(expr) {
    if (expr.substr(0,1) != '.') expr = '.'+expr;
    if (!expr.match(ku.query.RX_TEST))
        throw new Error("failed to parse: "+expr);

    var exec = [ ];
    var toks = expr.match(ku.query.RX_EXEC);
    //ku.debug("TOKENS: "+toks);
    var t, i, s, e;
    for (var x = 0, l = toks.length; x < l; x++) {
        // chop off the first '.'
        t = toks[x].substr(1);

        i = s = e = null;
        if (ku.query.RX_ITEM.test(t)) {
            t = t.replace(ku.query.RX_ITEM,'');
            i = RegExp.$1;
        } else if (ku.query.RX_SLCE.test(t)) {
            t = t.replace(ku.query.RX_SLCE, '');
            s = RegExp.$1;
            e = RegExp.$2;
        }

        if (t.substr(0,1) == '.')
            exec.push(['descendants', t.substr(1)]);
        else if (t == '#node')
            exec.push(['children']);
        else if (t == '*')
            exec.push(['children', 1]);
        else if (t == '#text')
            exec.push(['children', 3]);
        else if (t == '#cdata')
            exec.push(['children', 4]);
        else if (t == '#processing-instruction')
            exec.push(['children', 7]);
        else if (t == '#comment')
            exec.push(['children', 8]);
        else if (t == '@*')
            exec.push(['attributes']);
        else if (t.substr(0,1) == '@')
            exec.push(['attribute', t.substr(1)]);
        else if (t.substr(0,1) == '(')
            exec.push(['filter', t.substr(1,t.length-2)]);
        else if (t == 'parent()')
            exec.push(['parent']);
        else if (t == 'document()')
            exec.push(['document']); 
        else
            exec.push(['child', t]);

        if (i)
            exec.push(['item', parseInt(i)]);
        else if (s && e)
            exec.push(['slice', parseInt(s), parseInt(e)]);
    }
    return exec;
};

def.select = function(expr) {
    var exec = this.compile(expr);
    //ku.debug("exec: "+exec);
    var list = [this.node], meth, temp, arg0, arg1;
    for (var x = 0, l = exec.length; x < l; x++) {
        temp = [ ], meth = exec[x].shift(), arg0 = exec[x][0], arg1 = exec[x][1];
        switch (meth) {
            case 'item':
                temp[0] = list[arg0 < 0 ? list.length + arg0 : arg0];
                break;
            case 'slice':
                temp = list.slice(arg0, arg1);
                break;
            case 'filter':
                this.methods.filter.call(list, temp, arg0);
                break;
        default:
            for (var y = 0, m = list.length; y < m; y++) {
                this.methods[meth].call(list[y], temp, arg0, arg1);
            }
        }
        list = temp;
    }
    return new ku.query.NodeList(list);
};
def.$ = def.select;
def.methods = {
    'document' : function(list) { list.push(this.ownerDocument) },
    'parent'   : function(list) { list.push(this.parentNode)    },
    'children' : function(list, type) {
        if (this.childNodes) {
            for (var x = 0, l = this.childNodes.length; x < l; x++) {
                if (type && this.childNodes[x].nodeType != type) continue;
                if (this.childNodes[x].nodeType == 3 &&
                    this.childNodes[x].nodeValue.match(/^[ \t\r\n]+$/)) continue;
                list.push(this.childNodes[x]);
            }
        }
    },

    'child' : function(list, ename) {
        var child;
        if (this.childNodes) {
            for (var x = 0, l = this.childNodes.length; x < l; x++) {
                child = this.childNodes[x];
                if (ku.xml.getNodeName(child) == ename) list.push(child);
            }
        }
    },

    'attributes' : function(list) {
        // stupid IE doesn't make the distinction between attributes and properties
        if (/*@cc_on!@*/false && (typeof this.outerHTML != 'undefined')) {
            var m = this.outerHTML.match(
                /^(?:<\?xml:[^>]+>)?[^<]*<[^ >]+(?: ([^>]+))?>/
            );
            if (m) {
                var n, c = m[1].split(/=/);
                for (var x = 0; x < c.length - 1; x++) {
                    n = c[x].substr(c[x].lastIndexOf(' ')).replace(/^ /,'');
                    if (!n) continue;
                    if (!this.attributes[n]) continue;
                    if (!this.attributes[n].nodeValue) continue; // style
                    list.push(this.attributes[n]);
                }
            }
        } else {
            for (var x = 0, l = this.attributes.length; x < l; x++) {
                list.push(this.attributes[x]);
            }
        }
    },

    'attribute' : function(list, aname) {
        var attr;
        if (this.getAttribute(aname)) list.push(this.attributes.getNamedItem(aname));
        /*
        for (var x = 0, l = this.attributes.length; x < l; x++) {
            attr = this.attributes[x];
            if (attr.nodeName == aname) list.push(attr);
        }
        */
    },

    'descendants' : function(list, cname) {
        if (!cname) cname = '*';
        if (this.childNodes) {
            var stack = [ ];
            var count = 0;
            for (var x = this.childNodes.length - 1; x >= 0; x--) {
                stack[count++] = this.childNodes[x];
            }
            while (--count >= 0) {
                var n = stack[count];
                if (cname == '*' && n.nodeType == 1) {
                    list.push(n);
                } else if (ku.xml.getNodeName(n) == cname) {
                    list.push(n); 
                }
                if (n.childNodes) {
                    for (var x = n.childNodes.length - 1; x >= 0; x--) {
                        stack[count++] = n.childNodes[x];
                    }
                }
            }
        }
    },

    'filter' : function(list, test) {
        //test = test.replace(/@class/g, 'className');
        test = test.replace(/@([a-zA-Z\-:_]+)/g, '$node.getAttribute("$1")');
        try {
            test = new Function('ctx','with(ctx){return '+test+'}');
        } catch (ex) {
            throw new Error("ERROR: "+ex.message+" filter: "+test);
        }
        var fctx = new ku.query.FilterContext(this);
        for (var x = 0, l = this.length; x < l; x++) {
            fctx.$iter = x; fctx.$node = this[x];
            try { if (Boolean(test(fctx))) list.push(this[x]) } catch (ex) { }
        }
    }
};


ku.query.FilterContext = function(list) {
    this.$list = list;
    this.$node = null;
    this.$iter = null;
};
def = ku.query.FilterContext.prototype;
def.count = function(name) {
    var count = 0;
    for (var x = 0; x < this.$node.childNodes.length; x++) {
        if (ku.xml.getNodeName(this.$node.childNodes[x]) == name) count++;
    }
    return count;
};
def.substring = function(value) {
    if (value) {
        return value.substr.apply(
            value, Array.prototype.slice.call(arguments, 1)
        );
    }
    return '';
};


ku.query.NodeList = function(list) {
    return ku.bless(list, arguments.callee);
};
def = ku.query.NodeList.prototype;

def.map  = function(f) { return new ku.query.NodeList(ku.map(this, f))  };
def.grep = function(f) { return new ku.query.NodeList(ku.grep(this, f)) };
def.item = function(i) { return this[i] };
def.each = function(f) {
    for (var x = 0, l = this.length; x < l; x++) f(this[x])
};
def.union = function(l) {
    return new ku.query.NodeList(this.concat(l));
};
def.clone = function(d) {
    return this.map(function(n) { return n.cloneNode(Boolean(d)) });
};

