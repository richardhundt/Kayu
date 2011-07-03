ku.module('ku.xpath');

ku.require('ku.query');

ku.xpath = function(node) { return new ku.xpath.Query(node) };

ku.xpath.rxMain = /^(\/?(?:@(?:[\w-_]+:)?[\w-_]+|@\*|\*|[\w-]+\(\)|(?:[\w-_]+:)?[\w-_]+|\.\.|\.))(\[[^\]]+\])?$/;
ku.xpath.rxExpr = /(?:\[|"[^"]+"|'[^']+'|@\w+|@\*|\band\b|\bor\b|\bdiv\b|\bmod\b|\w+\(\)|\w+\(|\)|[+-]?[0-9]+(?:\.[0-9]+)?|\w+|\*|\+|\-|!=|>=|<=|=|>|<|\.|\]$)(?!\[)/g;

ku.xpath.fnMain = function(a, m, e) {
    var s = '';
    if (this.desc-- > 0) { 
        if (m.charAt(0) == '@') s = '.descendants().attribute("'+m.substr(1)+'")';
        else s = '.descendants("'+m+'")';
    }
    else if (m == '.' ) s += '';
    else if (m == '..') s += '.parent()';
    else if (m == '@*') s += '.attributes()';
    else if (m == '*' ) s += '.elements()';
    else if (m == 'node()') s += '.children()';
    else if (m == 'text()') s += '.text()';
    else if (m == 'comment()') s += '.comment()';
    else if (m == 'processing-instruction()') s += '.processingInstruction()';
    else if (m.charAt(0) == '@') s += '.attribute("'+m.substr(1)+'")';
    else if (m.charAt(0) == "'") s += '"'+m.slice(1, -1)+'"';
    else if (m.charAt(0) == '"') s += m;
    else s += '.child("'+m+'")';

    if (!e) return s;
    if (/^\[(\d+)\]$/.test(e)) return s + '.node('+(parseInt(RegExp.$1)-1)+')';

    var f = e.replace(ku.xpath.rxExpr, ku.xpath.fnExpr);
    return s+'.filter(function(node,list){return '+f+'})';
};

ku.xpath.fnExpr = function(n) {
    switch (n) {
    case ']': case '[' : return '';
    case ')': case '>' : case '<' : case '+':
    case '-': case '>=': case '<=': case '!=': return n;
    case '=': return '==';
    case '.': return 'node.firstChild.nodeValue';
    case 'or' : return '||';
    case 'and': return '&&';
    case 'mod': return '%';
    case 'div': return '/';
    case '@*' : return 'node.attributes.length';
    default:
        if (n.charAt(0) == '@') return 'node.getAttribute("'+n.substr(1)+'")';
        if (n.indexOf('(') != -1) {
            var fname = n.slice(0,n.indexOf('('));
            var sfunc = 'func["'+fname+'"].call(list';
            if (!ku.xpath.xFuncs[fname]) throw("XPath function not supported: "+fname);
            if (ku.xpath.xFuncs[fname].length > 0) sfunc += ',';
            else sfunc += ')';
            return sfunc;
        }
        if (/^[+-]?[0-9]+(?:\.[0-9]+)?/.test(n)) return n;
        if (n.charAt(0) == "'") return '"'+n.slice(1, -1)+'"';
        if (n.charAt(0) == '"') return n;
        return '"'+n+'"';
    }
};

ku.xpath.xFuncs = {
    id : function(i) {
        return this[this.iter].ownerDocument.getElementById(i);
    },
    not : function(v) { return !Boolean(v) },
    last : function() { return this.length },
    count : function(cname) {
        var kids = this.children();
        if (cname == '*') return kids.length;
        var count = 0;
        for (var x = 0; x < kids.length; x++) {
            if (kids[x].nodeName == cname) count++;
        }
        return count;
    },
    position : function() {
        for (var x = 0; x < this.length; x++) {
            if (this[this.iter] == this[x]) return x+1;
        }
    },
    substring : function(s, o) {
        if (arguments.length == 3) return String(s).substr(o, arguments[2]);
        return String(s).substr(o);
    }
};

ku.xpath.Query = function(node) {
    this.node = node.nodeType == 9 ? node.documentElement : node;
    this.desc = 0;
    this.seen = { };
};

def = ku.xpath.Query.prototype;

def.compile = function(expr) {
    if (this.seen[expr]) return this.seen[expr];

    var frags = expr.split('/');
    var xqstr = 'ku.query(node)';
    var xpctx = this;
    for (var x = 0; x < frags.length; x++) {
        if (x == 0 && frags[x] == '') { xqstr += '.document()'; continue }
        if (frags[x] == '') { xpctx.desc = 1; continue; }
        xqstr += frags[x].replace(ku.xpath.rxMain, function(a,m,e) {
            return ku.xpath.fnMain.call(xpctx, a, m, e);
        });
    }

    ku.debug(xqstr);
    var func;
    try {
        func = new Function('node,func', 'return '+xqstr);
    } catch (ex) {
        throw "XPath syntax error in expresssion: "+expr+', compiled to: '+xqstr;
    }

    func.query = xqstr;
    this.seen[expr] = func;
    return func;
};

def.select = function(expr) { return this.compile(expr)(this.node, ku.xpath.xFuncs) };

// UTILS
ku.xpath.getPosition = function(node) {
    if (!node.parentNode) return null;
    var s = 1;
    for (var c = 0; c < node.parentNode.childNodes.length; c++) {
        if (node.parentNode.childNodes[c] == node) break;
        else if (node.nodeType == Node.ELEMENT_NODE) {
            if (node.parentNode.childNodes[c].nodeName == node.nodeName) s++;
        }
        else if (node.parentNode.childNodes[c].nodeType == node.nodeType) s++;
    }
    return s;
};

ku.xpath.getXPath = function(node, root) {
    if (!node || node.nodeType == undefined || !node.nodeType) return "";
    if (node == root) return "";
    var parent = node.parentNode;
    switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            var nodeName = ku.xml.getNodeName(node);
            if (node.ownerDocument && node.ownerDocument.documentElement == node)
                return "/"+ nodeName +"[1]";
            else return ku.xpath.getXPath(parent, root) 
                +"/"+ nodeName +"["+ ku.xpath.getPosition(node) +"]";

        case Node.ATTRIBUTE_NODE:
            if (!parent) parent = node.ownerElement;
            return ku.util.getXPath(parent, root) +"/@"+ node.nodeName;

        case Node.TEXT_NODE:
            if (node == this._lastNode && root == this._lastRoot)
                return this._lastXPath;

            var xpath = ku.xpath.getXPath(parent, root) 
                +"/text()["+ ku.xpath.getPosition(node) +"]";

            this._lastNode = node;
            this._lastRoot = root;
            this._lastXPath = xpath;
            return xpath;

        case Node.COMMENT_NODE:
            return ku.util.getXPath(parent, root) 
                +"/comment()["+ ku.xpath.getPosition(node) +"]";

        default:
            if (parent) return ku.xpath.getXPath(parent, root);
            else return "";
    }
};

