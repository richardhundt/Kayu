ku.module('ku.ui');

ku.require('ku.xml');
ku.require('ku.ui.Engine');
ku.require('ku.ui.Component');

ku.ui.init = function(nid) {
    var node = ku.get(nid);
    var prsr = new ku.xml.Parser;
    var xstr = ku.util.unentityfy(node.innerHTML);
    var xdoc = prsr.parseFromString(
        '<ku:view xmlns:ku="kjax">'+xstr+'</ku:view>', 'text/xml'
    );
    var frag = ku.ui.render(xdoc.documentElement);
    node.parentNode.replaceChild(frag, node);
};

ku.ui.text = function(text) { return document.createTextNode(text) };

ku.ui.elmt = function(name, atts) {
    var elmt = document.createElement(name.toLowerCase());
    if (typeof atts === "object") {
        for (var p in atts) {
            if (!atts[p]) continue;
            if (p == 'style' && atts[p]) {
                if (elmt.style.cssText != null) elmt.style.cssText = atts[p];
                else elmt.style.styleText = atts[p];
            } else if (p == 'class' || p == 'className') {
                elmt.className = atts[p];
            } else if (typeof atts[p] == 'function') {
                elmt[p] = atts[p];
            } else {
                elmt.setAttribute(p, atts[p]);
            }
        }
    }
    return elmt;
};

ku.ui.self = function(node, atts) {
    var self = ku.ui.atts2obj(node);
    if (typeof atts != 'undefined') {
        for (var p in atts) self[p] = atts[p];
    }
    if (node.style) {
        if (node.style.cssText != null) self.style = node.style.cssText;
        else self.style = node.style.styleText;
    }
    return self;
};

ku.ui.atts2obj = function(node) {
    if (node.nodeType != 1) return null;
    var atts = { }, key, val;
    if (typeof node.outerHTML != 'undefined' && !window.opera) {
        var match = node.outerHTML.match(/^<\?xml:[^>]+><[^ ]+(?: ([^>]+))?>/);
        if (!match) return atts;
        var pairs = match[1].split(/ /);
        for (var x = 0; x < pairs.length; x++) {
            key = pairs[x].split('=')[0]; val = node.getAttribute(key);
            atts[key] = key.substr(0, 2) == 'on' ? new Function('event', val) : val;
        }
    } else {
        var nlist = node.attributes;
        for (var x = 0; x < nlist.length; x++) {
            if (!nlist[x].nodeValue) continue;
            key = nlist[x].nodeName; val = nlist[x].nodeValue;
            atts[key] = key.substr(0, 2) == 'on' ? new Function('event', val) : val;
        }
    }
    return atts;
};

ku.ui.engine = new ku.ui.Engine({
    '*' : function(ctx, node) {
        ctx.put(node);
        ctx.apply(node, node.childNodes);
    },
    '#text' : function(ctx, node) {
       ctx.put(node);
    }    
);

ku.ui.render = function(desc) {
    return ku.ui.engine.render(desc)
};

