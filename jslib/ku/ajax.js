ku.module('ku.ajax');

ku.require('ku.ui.Throbber');

ku.ajax.DEBUG = true;

ku.ajax.handleResponse = function(req, cbk) {
    ku.ajax.DEBUG && ku.debug("RESPONSE: "+req.responseText);
    if (req.status == 200) {
        ku.ajax.exec(ku.json.decode(req.responseText));
        if (typeof cbk == 'function') cbk(req);
        self.status = "Done.";
    }
    else if (!req.status) {
        alert("Network error, the server is unreachable");
    }
    else if (req.status == 404) {
        var err = req.getResponseHeader('X-Kudu-Error');
        if (confirm(err+", try reloading the page?")) {
            window.location = ""+window.location;
        }
    }
    else {
        var err = req.getResponseHeader('X-Kudu-Error');
        self.status = "ERROR: "+req.status+" "+err;
        throw new Error(req.status+" "+err);
    }
};

ku.ajax.exec = function(list) {
    var name;
    for (var x = 0; x < list.length; x++) {
        name = list[x].shift();
        this[name].apply(this, list[x]);
    }
};

// COMMANDS
ku.ajax.notify = function(mesg) { alert(mesg) };

ku.ajax.set = function(that, key, val) {
    that = ku.get(that);
    if (typeof that['set_'+key] == 'function') {
        that['set_'+key](val, arguments[3]);
    } else if (typeof that.set == 'function') {
        that.set(key, val, arguments[3]);
    } else {
        that[key] = val;
        if (typeof that.nodeType !== 'undefined') that.setAttribute('key', val);
    }
};

ku.ajax.call = function(that, name, args) {
    that = ku.get(that);
    args = args || [ ];
    return that[name].apply(that, args);
};

ku.ajax.wrap = function(nid, wrap) {
    var node = ku.get(nid);
    ku.require(wrap);
    var impl = ku.get(wrap);
    return new impl(node);
};

ku.ajax.bind = function(s, t) {
    var s_node, s_prop, t_node, t_prop;
    for (var k in s) {
        s_node = k; s_prop = s[k]; break;
    }
    for (var k in t) {
        t_node = k; t_prop = t[k]; break;
    }
    ku.ajax.set(ku.get(t_node), t_prop, ku.get(s_node)[s_prop]);
    ku.watch(ku.get(s_node), s_prop, function(old, val) {
        ku.ajax.set(ku.get(t_node), t_prop, val);
    });
};

ku.ajax.append = function(nid, html) {
    var n = ku.get(nid);
    var f = ku.util.html2frag(n, html);
    n.appendChild(f);
};

ku.ajax.replace = function(nid, html) {
    var n = ku.get(nid);
    var p = n.parentNode;
    var f = ku.util.html2frag(p, html);
    p.replaceChild(f, n);
};

ku.ajax.insert = function(pid, html, nid) {
    var p = ku.get(pid);
    var f = ku.util.html2frag(p, html);
    if (nid) {
        p.insertBefore(f, ku.get(nid));
    } else {
        p.appendChild(f);
    }
};

ku.ajax.remove = function(nodeId) {
    var node = document.getElementById(nodeId);
    node.parentNode.removeChild(node);
};

ku.ajax.setStyle = function(nid, key, val) {
    var n = ku.get(nid);
    n.style[key] = val;
};

ku.ajax.setClassName = function(nid, cls) {
    var n = ku.get(nid);
    n.className = cls;
};

ku.ajax.addClassName = function(nid, tok) {
    var n = ku.get(nid);
    ku.util.addClassName(n, tok);
};

ku.ajax.removeClassName = function(nid, tok) {
    var n = ku.get(nid);
    ku.util.removeClassName(n, tok);
};

// EVENTS
ku.ajax.Event = function(type) {
    this.type = type;
    this._seq = ku.ajax.Event.GEN++;
    this.cbks = [ ];
};

ku.ajax.Event.GEN = 0;
ku.ajax.Event.PENDING = { };

def = ku.ajax.Event.prototype;

def.send = function() {
    if (this.type == 'submit') {
        return this.sendSubmit.apply(this, Array.prototype.slice.call(arguments, 0));
    } else {
        return this.sendRequest.apply(this, Array.prototype.slice.call(arguments, 0));
    }
};

def.sendSubmit = function() {
    //this.wait(this.node);

    var method = 'POST';
    var action = '?_e='+(this._seq)+'&type=submit&node='+this.node.id;
    var broker = ku.broker();

    var enctype = this.node.getAttribute("enctype")
        || "application/x-www-form-urlencoded";

    this.node.target = broker.name;
    this.node.setAttribute('target', broker.name);
    this.node.action = action;
    this.node.method = method;
    this.node.enctype = enctype;

    var $this = this;
    broker.onload = function() {
        var bdoc = broker.getDocument();
        var html = bdoc.documentElement;
        var scrp = html.getElementsByTagName('script')[0];
        if (scrp && scrp.getAttribute('type') == 'text/x-json') {
            var json = ku.userAgent.is_ie ? scrp.innerHTML : scrp.firstChild.nodeValue;
            json = ku.util.unentityfy(json)
                .replace(/^\s*<!\[CDATA\[/,'').replace(/\]\]>$/,'');

            ku.ajax.DEBUG && ku.debug("IFRAME RESPONSE: "+json); 
            ku.ajax.exec(ku.json.decode(json));
            $this.done()
        }
        else {
            var nerr = html.ownerDocument.getElementById('error');
            if (!nerr) nerr = html.getElementsByTagName('pre')[0];
            if (nerr) {
                $this.error(nerr.innerHTML);
            } else {
                $this.error("Unknown error occurred");
            }
        }
    };

    return this;
};

def.sendRequest = function() {
    var req = ku.request();
    var cbk = ku.delegate(this, function() { this.done() });
    var evt = {
        type : this.type,
        args : Array.prototype.slice.call(arguments, 0)
    };

    if (this.node) {
        var state = { };
        var props = 'value selectedIndex checked name'.split(' ');
        for (var x = 0; x < props.length; x++) {
            state[props[x]] = this.node[props[x]];
        }
        evt.state = state;
        evt.node  = this.node.id;
    }
    this.req = req;
    this.cbk = cbk;
    this.evt = evt;

    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            self.status = 'Updating UI...';
            ku.ajax.handleResponse(req, cbk);
        }
    };

    req.open('POST', '?_e='+this._seq, true);
    req.setRequestHeader('X-Kudu-Transport', 'XHR');
    req.setRequestHeader('Content-Type', 'text/x-json');

    self.status = 'Sending event to server...';

    var jstr = ku.json.encode(evt);
    ku.ajax.DEBUG && ku.debug("SEND: "+jstr);

    req.send(jstr);
    ku.ajax.Event.PENDING[this._seq] = this;

    return this;
};

def.on = function(node) {
    this.node = ku.get(node);
    return this;
};
def.stop = function(evt) {
    this.raw = ku.event(evt);
    this.raw.stopPropagation();
    this.raw.preventDefault();
    return this;
};
def.wait = function(nid) {
    var throb = new ku.ui.Throbber(ku.get(nid));
    this.cbks.push(function() { throb.done() });
    throb.wait();
    return this;
};
def.then = function(cbk) {
    if (typeof cbk == 'string') cbk = new Function('', cbk);
    this.cbks.push(cbk);
    return this;
};
def.done = function() {
    for (var x = 0; x < this.cbks.length; x++) {
        try {
            this.cbks[x].apply(this, Array.prototype.slice.call(arguments, 0));
        } catch (ex) {
            self.setTimeout(function(){ throw ex },1);
        }
    }
    if (ku.ajax.Event.PENDING[this._seq]) {
        ku.ajax.Event.PENDING[this._seq].req.abort();
        delete( ku.ajax.Event.PENDING[this._seq] );
    }
    return this;
};
def.error = function(mesg) { 
    if (typeof this.onerror == 'function') {
        this.onerror(mesg);
    } else {
        throw new Error(mesg);
    }
};

ku.ajax.event = function(type) { return new ku.ajax.Event(type) };
ku.ajax.start = function() { return this.event('start').send(); };

