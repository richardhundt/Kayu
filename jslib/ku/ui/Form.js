ku.module('ku.ui.Form');

ku.require('ku.ui.Component');

ku.ui.Form = function(nid) {
    var node = ku.get(nid);
    ku.bless(node, arguments.callee).init();
    return node;
};
ku.is(ku.ui.Form, ku.ui.Component);

def = ku.ui.Form.prototype;

def.invalidate = function() {
    var stack = [ this ];
    while (stack.length) {
        var n = stack.pop();
        if (n.nodeType == 1) {
            if (n != this && n.invalidate) {
                n.invalidate();
            }
            else if (n.getAttribute('variable') == 'true') {
                if (n.set) {
                    n.set('value', '');
                } else if (n.type == 'file') {
                    var c = n.cloneNode(true);
                    n.parentNode.replaceChild(c,n);
                } else if (n.type == 'checkbox') {
                    n.checked = false;
                } else {
                    n.value = '';
                }
            }
            for (var x = n.childNodes.length - 1; x >= 0; x--) {
                stack.push(n.childNodes[x]);
            }
        }
    }
};

def.populate = function(obj) {
    var stack = [ this ];
    while (stack.length) {
        var n = stack.pop();
        if (n.nodeType == 1) {
            if (n != this) {
                var key = n.getAttribute('name');
                if (n.set) {
                    if (key) n.set('value', obj[key]);
                } else {
                    if (key) {
                        if (n.type && n.type == 'checkbox') {
                            if (obj[key] === true || obj[key] === "true") {
                                n.checked = true;
                            } else {
                                n.checked = false;
                            }
                        }
                        else n.value = obj[key];
                    }
                }
            }
            for (var x = n.childNodes.length - 1; x >= 0; x--) {
                stack.push(n.childNodes[x]);
            }
        }
    }
};

def.onsubmit = function(e) {
    if (typeof e != "undefined") {
        e = ku.event(e);
        e.preventDefault();
        e.stopPropagation();
    }

    this.dispatchSignal('submit');
    var throbber = ku.ajax.throbber(this).wait();

    var enctype = this.getAttribute("enctype")
        || "application/x-www-form-urlencoded";
    var method  = this.getAttribute("method") || "GET";
    var action  = this.getAttribute("action") || "about:blank";

    var broker  = ku.broker();

    var doc = broker.window.document;
    doc.open('text/html');
    doc.write('<html><body>'+
        '<form method="'+method+'" enctype="'+enctype+
        '" action="'+action+'"></form></body></html>'
    );
    doc.close();

    var form = doc.getElementsByTagName('form')[0];
    var elts = this.query('*');
    for (var x = 0; x < elts.length; x++) {
        form.appendChild(doc.importNode(elts[x].cloneNode(true), true));
    }

    var $this = this;
    var load = function () {
        ku.broker.onload = null;
        throbber.done();
        $this.handleResult();
    };

    ku.broker.onload = load;

    form.submit();
    return false;
};

def.submit = def.onsubmit;

def.handleResult = function(e) {
    var respdoc = ku.broker().window.document;
    var content = respdoc.documentElement.cloneNode(true);

    respdoc.open();
    respdoc.close();

    var er;
    if (er = ku.util.getElementsByClassName(content, 'error', true)[0]) {
        this.dispatchSignal('error', { message : er.innerHTML });
    } else {
        this.dispatchSignal('result', { content : content });
    }
};

def.set_submit = function(handler) {
    this.addObserver('submit', handler);
};

def.set_result = function(handler) {
    this.addObserver('result', handler);
};

def.set_error = function(handler) {
    this.addObserver('error', handler);
};

