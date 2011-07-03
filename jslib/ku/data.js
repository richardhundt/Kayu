ku.module('ku.data');

ku.require('ku.util.Observable');

var def = null;

ku.data.selectGroups = { };
ku.data.setSelected = function(node, klass, model) {
    var groupName;
    if (node.getAttribute('selectgroup')) {
        groupName = node.getAttribute('selectgroup');
    } else {
        groupName = '$DefaultSelectGroup';
    }

    var group = this.selectGroups[groupName];
    if (!group) this.selectGroups[groupName] = group = { };
    if (group.selectedElement) {
        if (group.selectedElement == node) return;
        ku.util.removeClassName(group.selectedElement, group.selectedClass);
    }

    group.selectedElement = node;
    group.selectedClass = klass;
    ku.util.addClassName(node, klass);

    self[model].setCurrentRow(node.getAttribute('rowid'));
    return true;
};

ku.data.eval = function($ctx, code) {
    var retv = '', orig = unescape(code);
    code = orig.replace(/\{([^}]+)\}/g, function(m, v) { return $ctx.get(v) });
    try {
        retv = eval(code);
    } catch (ex) {
        ex.message += " in expression: `"+orig+"'";
        throw ex;
    };
    return retv;
};


//========================================================================
// ku.data.Template - cheap and fast templating
//========================================================================
ku.data.Template = function(source) {
    this.code = "";
    this.exec = function() {
        throw new Error("cannot process an uncompiled template");
    };
    if (source) {
        if (source.nodeType) source = source.nodeValue;
        this.compile(source);
    }
};
def = ku.data.Template.prototype;

def.process = function($ctx) {
    var $out = [ ];
    if (!$ctx) $ctx = new ku.data.Context;
    this.exec.call(self, $out, $ctx);
    return $out.join("");
};
def.compile = function(s) {
    s = s.replace(/^\s+/, '').replace(/\s+$/, '');
    this.source = s;
    var list = this.parse(ku.util.unentityfy(String(s)));
    var buff = [ ];
    var frag;
    for (var x = 0; x < list.length; x++) {
        frag = list[x];
        if (frag.substr(0, 4) == '<?js') {
            buff[buff.length] = frag.substring(4, frag.length - 2);
        } else {
            buff[buff.length] = '$out.push("'+
                frag.replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")
            +'");';
        }
    }
    var code = buff.join("\n");
    try {
        this.exec = new Function('$out, $ctx', code);
    } catch(ex) {
        throw new Error(ex.message+'\n while compiling: '+this.source);
    }
};

def.parse = function(source) {
    return source
    .replace(/^<!\[CDATA\[(.|[\r\n])*\]\]>$/, '$1')
    .replace(/<!--(?:.|[\r\n])*?-->/g, '')
    .replace(/#\{([^}]+)\}/g, '<?js $out.push($ctx.get("$1")); ?>')
    .match(/<\?js(\?>|[\n\r\t ][^?]*\?+([^>?][^?]*\?+)*>)|(<(?!\?js)|[^<]*)*/g);
};

// =======================================================================
// ku.data.Scope - nestable template processing stash
// =======================================================================
ku.data.Scope = function(stash, outer) {
    this.stash = stash || { };
    this.outer = outer;
};
def = ku.data.Scope.prototype;

def.get = function(key) {
    if (key in this.stash) {
        return this.stash[key];
    } else if (this.outer) {
        if (this.name == this.outer.name) return '';
        return this.outer.get(key);
    }
    return '';
};
def.set = function() {
    if (arguments.length == 1) {
        for (var key in arguments[0]) this.stash[key] = arguments[0][key];
    } else {
        this.stash[arguments[0]] = arguments[1];
    }
};

// =======================================================================
// ku.data.Context - template processing context
// =======================================================================
ku.data.Context = function() {
    this.scopes = { };
    this.scopes['$global'] = new ku.data.Scope(self, null);
    this.scopes['$global'].name = '$global';
    this.enter('$global');
};

def = ku.data.Context.prototype;

def.addScope = function(name, stash, outer) {
    if (!outer) outer = '$global';
    this.scopes[name] = new ku.data.Scope(stash, this.scopes[outer]);
    this.scopes[name].name = name;
};
def.getScope = function(name) {
    return this.scopes[name];
};
def.setScope = function(name, scope) {
    this.scopes[name] = scope;
    scope.name = name;
};
def.enter = function(name) {
    if (!this.scopes[name]) {
        throw "No scope named: "+name
    }
    this.scopes[name].outer = this.current;
    this.current = this.scopes[name];
};
def.leave = function() {
    this.current = this.current.outer;
};
def.get = function(sym) {
    var key = sym.split(/::/), pre;
    if (key.length == 1) return this.current.get(key[0]);
    pre = key[0], key = key[1];
    if (pre == 'function') {
        return typeof self[key] == 'function' ? self[key].call(this) : sym;
    } else {
        if (pre in this.scopes) {
            return this.scopes[pre].get(key);
        } else if (pre in self && self[pre] instanceof ku.data.Scope) {
            return self[pre].get(key);
        } else {
            return sym;
        }
    }
    return sym;
};
def.set = function() {
    if (arguments.length == 1) {
        this.current.set(arguments[0]);
    } else {
        this.current.set(arguments[0], arguments[1]);
    }
};
def.call = function(meth, a1, a2, a3) {
    if (typeof this.current[meth] != 'function') return '';
    if (arguments.length < 5) return this.current[meth](a1, a2, a3);
    return this.current[meth].apply(
        this.current, Array.prototype.slice.call(arguments, 1)
    );
};


// =======================================================================
// ku.data.Model - model abstraction
// =======================================================================
ku.data.Model = function(data) {
    ku.data.Scope.call(this);
    this.state = null;
    if (data && data instanceof Array) this.importDataArray(data);
};

ku.data.Model.is(ku.data.Scope).does(ku.util.Observable);
def = ku.data.Model.prototype;

def.init = function() {
    this.setState('ready');
};
def.reset = function() {
    this.iter = -1;
    this.stash = {
        '$RowNumber' : this.iter,
        '$RowIsOdd'  : null
    };
};
def.next = function() {
    if (!(this.rows && this.rows.length)) return;
    if (++this.iter >= this.rows.length) {
        this.reset();
    } else {
        var rowData = this.getRowDataAt(this.iter);
        this.stash = rowData;
        return rowData;
    }
};
def.setState = function(state) {
    this.state = state;
    this.notifyObservers('onStateChanged', state);
};
def.importDataArray = function(data) {
    this.columns = data[0];
    this.columnIndexes = { };
    for (var x = 0; x < data[0].length; x++) {
        this.columnIndexes[data[0][x]] = x;
    }
    this.rows = data.slice(1);
    this.iter = -1;
    this.idgen = 0;
    this.index = { };
    for (var x = 0, l = this.rows.length; x < l; x++) {
        this.rows[x].$RowID = '_'+(this.idgen++);
        this.index[this.rows[x].$RowID] = this.rows[x];
    }
    this.notifyObservers('onModelChanged');
};
def.createRow = function(row) {
    if (typeof row == 'object' && !(row instanceof Array)) {
        var obj = row;
        row = [ ];
        for (var x = 0; x < this.columns.length; x++) {
            row[x] = obj[this.columns[x]];
        }
    }
    return row;
};
def.insertRow = function(row, quiet) {
    row = this.createRow(row);
    row.$RowID = '_'+(this.idgen++);
    this.rows[this.rows.length] = row;
    this.index[row.$RowID] = row;
    if (!quiet) this.notifyObservers('onModelChanged', row);
};
def.getRowDataAt = function(rowIndex) {
    if (rowIndex < 0) return null;
    var rowData = this.getRowDataFromRow(this.rows[rowIndex]);
    rowData.$RowIndex = rowIndex;
    rowData.$RowIsOdd = rowIndex % 2 == 1;
    return rowData;
};
def.getRowDataFromRow = function(row) {
    var data = { };
    for (var x = 0; x < this.columns.length; x++) {
        data[this.columns[x]] = row[x];
    }
    data.$RowID = row.$RowID;
    return data;
};
def.setCurrentRow = function(rowID, quiet) {
    var row = this.index[rowID];
    this.currentRow = row;
    if (!quiet) this.notifyObservers(
        'onRowSelected', this.getRowDataFromRow(row)
    );
};
def.getCurrentRowID = function() {
    if (!this.currentRow) return null;
    return this.currentRow.$RowID;
};
def.getRowsMatching = function(spec) {
    var tmpl = [ ];
    var x, c = this.columns.length;
    for (x = 0; x < c; x++) {
        if (this.columns[x] in spec) {
            tmpl[x] = spec[this.columns[x]];
        } else {
            tmpl[x] = null;
        }
    }
    var y, r, rows = this.rows, skip, found = [ ], m, v;
    for (y = 0, r = rows.length; y < r; y++) {
        skip = false;
        for (x = 0; x < c; x++) {
            m = tmpl[x], v = rows[y][x];
            if (m == null) continue;
            if (m == rows[y][x]) continue;
            if (m instanceof RegExp && m.test(v)) continue;
            if (typeof m == 'function' && m(v)) continue;
            skip = true;
        }
        if (!skip) found[found.length] = this.getRowDataAt(y);
    }
    return found;
};

//========================================================================
// ku.data.HttpModel
//========================================================================
ku.data.HttpModel = function(source) {
    ku.data.Model.call(this);
    this.source = source;
};

ku.data.HttpModel.is(ku.data.Model);
def = ku.data.HttpModel.prototype;

def.init = function() {
    var uri = this.source;
    var req = ku.request();
    var $this = this;
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            var json, data, model;
            if (req.status == 200 || req.status == 304 || (
                req.status == 0 && uri.search(/^file:\/\//))) {
                var type = req.getResponseHeader('Content-Type');
                if (type == 'text/x-json' || uri.search(/\.json$/)) {
                    json  = req.responseText;
                    data  = ku.json.decode(json);
                    try {
                        $this.importDataArray(data);
                        $this.setState('ready');
                    } catch (ex) {
                        $this.setState('error');
                        ku.debug('ERROR: '+ex.message);
                    }
                } else {
                    $this.setState('error');
                }
            } else {
                $this.setState('error');
            }
        }
    };
    this.setState('loading');
    req.open('GET', uri, true);
    req.send(null);
};

//========================================================================
// ku.data.LinkedModel
//========================================================================
ku.data.LinkedModel = function(source) {
    var m = source.match(/^\{([^}]+)\}$/);
    var l = m[1].split(/::/);
    this.master = self[l[0]];
    this.column = l[1];
    this.master.addObserver(this);
};

ku.data.LinkedModel.is(ku.data.Model);

def = ku.data.LinkedModel.prototype;

def.onRowSelected = function(model, rowData) {
    var uri = rowData[this.column];
    var req = ku.request();
    var $this = this;
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            var json, data, model;
            if (req.status == 200 || req.status == 304 || (
                req.status == 0 && uri.search(/^file:\/\//))) {
                var type = req.getResponseHeader('Content-Type');
                if (type == 'text/x-json' || uri.search(/\.json$/)) {
                    json  = req.responseText;
                    data  = ku.json.decode(json);
                    $this.importDataArray(data);
                    $this.setState('ready');
                } else {
                    $this.setState('error');
                    //throw "Unhandled content type: "+type;
                }
            } else {
                $this.setState('error');
                //throw "Server said: "+req.responseText;
            }
        }
    };
    this.setState('loading');
    req.open('GET', uri, true);
    req.send(null);
};

//========================================================================
// ku.data.Compiler
//========================================================================
ku.data.Compiler = function() {
    this.stack = [ ];
    this.directives = {
        'ku:if' : 1,
        'ku:case' : 1,
        'ku:each' : 1,
        'ku:eachinner' : 1,
        'ku:state' : 1
    };
};

def = ku.data.Compiler.prototype;

def.EMPTY_TAGS = { 'hr' : 1, 'img' : 1, 'br' : 1 };

def.compile = function(node) {
    var atts = this.getAttributesAsString(node);
    var name = node.nodeName.toLowerCase();

    var jstl = this.mkTagOpen(name, atts);
    for (var x = 0; x < node.childNodes.length; x++) {
        jstl += this.mkNode(node.childNodes[x]);
    }
    jstl += this.mkTagClose(name);

    var tmpl = new ku.data.Template();
    tmpl.compile(jstl);
    //alert(jstl);
    return tmpl;
};

def.setDirectives = function(dobj) {
    this.directives = dobj;
};
def.mkNode = function(node) {
    if (node.nodeType == 1) {
        var tmpl = this.mkDirective(node);
        if (tmpl) return tmpl;
        return this.mkTag(node, this.mkChildren(node));
    }
    else if (node.nodeType == 3 || node.nodeType == 4) {
        return this.mkNodeValue(node.data);
    }
    else {
        return '';
    }
};
def.mkDirective = function(node) {
    if (this.directives['ku:if'] &&
        node.attributes.getNamedItem('ku:if')) {
        return this.mkIf(node);
    }
    if (this.directives['ku:case'] &&
        node.attributes.getNamedItem('ku:case')) {
        return this.mkCase(node);
    }
    if (this.directives['ku:each'] &&
        node.attributes.getNamedItem('ku:each')) {
        return this.mkEach(node);
    }
    if (this.directives['ku:eachinner'] &&
        node.attributes.getNamedItem('ku:eachinner')) {
        return this.mkEachInner(node);
    }
    if (this.directives['ku:state'] &&
        node.attributes.getNamedItem('ku:state')) {
        return this.mkState(node);
    }
};
def.mkLoop = function(model, body) {
    return this.mkLoopStart(model) + body + this.mkLoopEnd();
};
def.mkLoopStart = function(model) {
    return '<?js '+this.mkContextEnter(model)+' while ($ctx.call("next")) { ?>';
};
def.mkLoopEnd = function() {
    return '<?js } '+this.mkContextLeave()+' ?>';
};

def.mkContextEnter = function(model) {
    return '$ctx.enter("'+model+'");';
};
def.mkContextLeave = function() {
    return '$ctx.leave();';
};
def.mkEach = function(node) {
    var model = node.getAttribute('ku:each');
    node.removeAttribute('ku:each');
    this.stack.push(model);
    var jstl = this.mkLoop(model, this.mkTag(node, this.mkChildren(node)));
    this.stack.pop();
    return jstl;
};
def.mkEachInner = function(node) {
    var model = node.getAttribute('ku:eachinner');
    node.removeAttribute('ku:eachinner');
    this.stack.push(model);
    var jstl = this.mkTag(node, this.mkLoop(model, this.mkChildren(node)));
    this.stack.pop();
    return jstl;
};
def.mkCase = function(node) {
    var cond = node.getAttribute('ku:case');
    var jstl = '<?js switch ('+this.mkCondTest(cond)+') { ?>';
    node.removeAttribute('ku:case');

    var list;
    if (node.getAttribute('ku:when')) {
        list = [ node ];
        var next = node.nextSibling;
        while (next) {
            if (next.nodeType == 1) {
                if (next.getAttribute('ku:when') || next.getAttribute('ku:else')) {
                    list[list.length] = next;
                } else {
                    break;
                }
            }
            next = next.nextSibling;
        }
        return jstl+this.mkCaseLadder(list, true)+'<?js } ?>';
    }

    list = ku.query(node).$('.*');
    return this.mkTag(node, jstl+this.mkCaseLadder(list)+'<?js } ?>');
};
def.mkCaseLadder = function(list, remove) {
    var jstl = '';
    for (var x = 0; x < list.length; x++) {
        if (remove) list[x].parentNode.removeChild(list[x]);
        if (x == list.length - 1) {
            if (list[x].attributes.getNamedItem('ku:else')) {
                jstl += '<?js default: ?>'+this.mkNode(list[x]);
                break;
            }
        }
        if (list[x].attributes.getNamedItem('ku:when')) {
            jstl += this.mkCaseBlock(list[x]);
        } else {
            throw "Syntax error in case";
        }
    }
    return jstl;
};
def.mkCaseBlock = function(node) {
    var cond, test, name;
    test = this.mkCondTest(node.getAttribute('ku:when'));
    node.removeAttribute('ku:when');
    return '<?js case '+test+': ?>'+this.mkNode(node)+'<?js break; ?>';
};
def.mkIf = function(node) {
    var jstl = '';
    var list = [ node ];
    var next = node.nextSibling;
    while (next) {
        if (next.nodeType == 1) {
            if (next.getAttribute('ku:elsif') || next.getAttribute('ku:else')) {
                list[list.length] = next;
            } else {
                break;
            }
        }
        next = next.nextSibling;
    }
    for (var x = 0; x < list.length; x++) {
        jstl += this.mkCondBlock(
            list[x], x == 0 ? 0 : x - list.length
        );
        list[x].parentNode.removeChild(list[x]);
    }
    return jstl;
};
def.mkCondBlock = function(node, indx) {
    var cond, test, name;
    if (indx == 0) {
        test = this.mkCondTest(node.getAttribute('ku:if'));
        node.removeAttribute('ku:if');
        cond = 'if ('+test+')';
    } else if (indx == -1) {
        node.removeAttribute('ku:else');
        cond = 'else';
    } else {
        test = this.mkCondTest(node.getAttribute('ku:elsif'));
        node.removeAttribute('ku:elsif');
        cond = 'else if ('+test+')';
    }
    return '<?js '+cond+' { ?>'+this.mkNode(node)+'<?js } ?>';
};
def.mkCondTest = function(cond) {
    return 'ku.data.eval($ctx,"'+escape(cond)+'")';
};
def.mkChildren = function(node) {
    var tmpl = this.mkDirective(node);
    if (tmpl) return tmpl;
    var kids = '';
    for (var x = 0; x < node.childNodes.length; x++) {
        kids += this.mkNode(node.childNodes[x]);
    }
    return kids;
};
def.mkState = function(node) {
    var state = node.getAttribute('ku:state');
    node.removeAttribute('ku:state');
    return '<?js if ($ctx.state == "'+state+'") { ?>'+
        this.mkNode(node)+
    '<?js } ?>';
};
def.mkTag = function(node, body) {
    var name = node.nodeName.toLowerCase();
    var atts = this.mkAttributes(node);
    return this.mkTagOpen(name, atts)+body+this.mkTagClose(name);
};
def.mkTagOpen = function(name, atts) {
    if (this.EMPTY_TAGS[name]) {
        return '<'+name+' '+atts+' />';
    } else {
        return '<'+name+' '+atts+'>';
    }
};
def.mkTagClose = function(name) {
    if (this.EMPTY_TAGS[name]) {
        return '';
    } else {
        return '</'+name+'>';
    }
};

def.mkAttributes = function(node) {
    return this.mkNodeValue(this.getAttributesAsString(node));
};

def.mkNodeValue = function(data) {
    return data.replace(/\{(([^:}]+::[^:}]+?)|([^}]+))}/g, '#{$1}');
};

def.getAttributesAsString = function(node) {
    var list = ku.query(node).$('.@*');
    var atts = { }, attr;
    for (var x = 0; x < list.length; x++) {
        attr = list[x];
        if (/^ku:/.test(attr.nodeName)) continue;
        if (attr.nodeName == 'style' ||
            attr.nodeName == 'class' ||
            attr.nodeName == 'for'    ) continue;
        atts[attr.nodeName] = attr.nodeValue;
    }

    if (/*@cc_on!@*/false && node.style.cssText) {
        atts['style'] = node.style.cssText;
    } else if (/*@cc_on!@*/true && node.getAttribute('style')) {
        atts['style'] = node.getAttribute('style');
    }

    if (node.className) atts['class'] = node.className;
    if (node.htmlFor)   atts['for']   = node.htmlFor;

    if (node.attributes.getNamedItem('ku:hover')) {
        var className = node.getAttribute('ku:hover');
        atts['onmouseover'] = (
            "ku.util.addClassName(this, '"+className+"');"+
            (atts['onmouseover'] || '')
        );
        atts['onmouseout'] = (
            "ku.util.removeClassName(this, '"+className+"');"+
            (atts['onmouseout'] || '')
        );
    }
    if (node.attributes.getNamedItem('ku:select')) {
        var className = node.getAttribute('ku:select');
        var currModel = this.stack[this.stack.length-1]
        atts['onclick'] = (
            "ku.data.setSelected(this, '"+className+"', '"+currModel+"');"+
            (atts['onclick'] || '')
        );
        atts['rowid'] = '{$RowID}';
    }
    if (node.attributes.getNamedItem('ku:selectgroup')) {
        var groupName = node.getAttribute('ku:selectgroup');
        atts['selectgroup'] = groupName;
    }
    var buff = [ ];
    for (var n in atts) {
        buff[buff.length] = (n+'="'+atts[n].replace(/"/g, "&#34;")+'"');
    }
    return buff.join(' ');
};

//========================================================================
// ku.data.Region
//========================================================================
ku.data.Region = function(node) {
    this.context  = new ku.data.Context();
    this.compiler = new ku.data.Compiler();

    if (!node) return this;
    node.style.display = 'none';

    this.descriptor = node;
    this.descriptorParentNode = node.parentNode;
    this.init(node);
};

def = ku.data.Region.prototype;

def.init = function(node) {
    var snames = node.getAttribute('ku:data').split(' ');
    this.compile(node);
    for (var x = 0; x < snames.length; x++) {
        var match, model, alias;
        if (match = snames[x].match(/^\{([^}]+)\}/)) {
            alias = match[1];
            model = self[alias];
        }
        else if (match = snames[x].match(/^([^:]+):(.+)$/)) {
            alias = match[1];
            var source = match[2];
            if (source.match(/^\{([^}]+)\}$/)) {
                model = new ku.data.LinkedModel(source);
            } else {
                model = new ku.data.HttpModel(source);
            }
            self[alias] = model;
        }
        else {
            throw "malformed source name: `"+snames[x]+"'";
        }

        try {
            model.addObserver(this);
            this.context.setScope(alias, model);
            model.init();
        } catch (ex) {
            ku.debug("data: invalid model `"+alias+"' reason: "+ex.message);
        }
    }
};

def.compile = function(node) {
    this.template = this.compiler.compile(node);
};
def.update = function() {
    var invalid = this.output;
    this.process();
    if (invalid) {
        invalid.parentNode.replaceChild(this.output, invalid);
    } else {
        this.descriptorParentNode.replaceChild(this.output, this.descriptor);
    }
};
def.onStateChanged = function(model, state) {
    this.context.state = state;
    this.update();
};
def.onModelChanged = function(model, data) {
    this.update();
};
def.process = function() {
    var html = this.template.process(this.context);
    var frag = ku.util.html2frag(this.descriptorParentNode, html);
    this.output = ku.query(frag).$('.*')[0];
    this.output.style.display = '';
};

//========================================================================
// ku.data.RowRegion
//========================================================================
ku.data.RowRegion = function(node) {
    ku.data.Region.call(this, node);
};

ku.data.RowRegion.is(ku.data.Region);
def = ku.data.RowRegion.prototype;

def.init = function(node) {
    var modelIdent = this.model = node.getAttribute('ku:rowdata');
    var model = self[modelIdent];
    try {
        model.addObserver(this);
        this.context.setScope(modelIdent, model);
    } catch (ex) {
        ku.debug("rowdata: invalid model `"+modelIdent+"' reason: "+ex.message);
    }

    this.compiler.setDirectives({ 'ku:if' : 1, 'ku:case' : 1 });
    this.compile(node);
};

def.onModelChanged = function() { };

def.onRowSelected = function(model, rowData) {
    this.context.enter(this.model);
    this.context.set(rowData);
    this.update();
    this.context.leave();
};

ku.event.addListener(self, 'load', function() {
    var list = ku.query.$('..*');

    var regions = list.grep(function(n) {
        return n.attributes.getNamedItem('ku:data');
    });
    var x, n, r;
    for (x = 0; x < regions.length; x++) {
        n = regions[x];
        r = new ku.data.Region(n);
    }

    var rowdatas = list.grep(function(n) {
        return n.attributes.getNamedItem('ku:rowdata')
    });
    for (x = 0; x < rowdatas.length; x++) {
        n = rowdatas[x];
        r = new ku.data.RowRegion(n);
    }
});

