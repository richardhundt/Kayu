ku.module('ku.view');

ku.view.Builder = function(templates) {
    this.templates = templates || { };
};

def = ku.view.Builder.prototype;

def.template = function(name, func) {
    this.templates[name] = func;
};

def.render = function(desc, func) {
    var frag  = ku.view.makeFragment();
    var stack = [ frag, desc ];
    var count = 1;
    var desc = null, prnt = null, name, atts, offs, elmt;
    while (count >= 0) {
        desc = stack[count--];
        prnt = stack[count--];
        if (typeof desc.nodeType == 'number') {
            prnt.appendChild(desc);
        }
        else if (typeof desc == 'object' && desc instanceof Array) {
            name = desc[0].toLowerCase();
            atts = desc[1];
            offs = 2;
            if (typeof desc[1] == 'object' &&
                !(desc[1] instanceof Array || desc[1].nodeType)) {
                atts = desc[1];
            } else {
                atts = { }; offs = 1;
            }

            var elmt;
            if (name in this.templates) {
                kids = desc.slice(offs);
                elmt = this.templates[name].call(atts, kids);
            } else {
                elmt = ku.view.makeElement(name, atts);
                prnt.appendChild(elmt);
            }

            for (var x = desc.length - 1; x >= offs; x--) {
                stack[++count] = elmt;
                stack[++count] = desc[x];
            }
        }
        else if (typeof desc == 'string' || typeof desc == 'number') {
            prnt.appendChild(ku.view.makeText(desc));
        }
        else {
            throw new Error("garbage detected in render pipeline: "+desc);
        }
    }

    return frag;
};

def.make = function(desc) {
    return this.render(desc).firstChild;
};

ku.view.makeText = function(text) { return document.createTextNode(text) };
ku.view.makeFragment = function() { return document.createDocumentFragment() };
ku.view.makeElement  = function(name, atts) {
    var elmt = document.createElement(name.toLowerCase());
    if (typeof atts == "object") {
        for (var p in atts) {
            if (typeof atts[p] == 'undefined') continue;
            if (p == 'style' && atts[p]) {
                if (typeof atts[p] == 'string') {
                    elmt.style.cssText = elmt.style.styleText = atts[p];
                } else if (typeof atts[p].cssText != 'undefined') {
                    elmt.style.cssText = atts[p].cssText;
                } else if (typeof atts[p].styleText != 'undefined') {
                    elmt.style.styleText = atts[p].styleText;
                } else {
                    for (var s in atts[p]) elmt.style[s] = atts[p][s];
                }
            } else if (p == 'class' || p == 'className') {
                elmt.className = atts[p];
            } else if (typeof atts[p] == 'string' || typeof atts[p] == 'number') {
                elmt.setAttribute(p, String(atts[p]));
            } else {
                elmt[p] = atts[p];
            }
        }
    }
    return elmt;
};

ku.view.getAttributesAsObject = function(node, atts) {
    if (node.nodeType != 1) return null;
    if (!atts) atts = { };
    var list = ku.query(node).$('.@*');
    for (var x = 0, l = list.length; x < l; x++) {
        if (!list[x].nodeValue) continue;
        atts[list[x].nodeName] = list[x].nodeValue;
    }
    return atts;
};

ku.view.builder = new ku.view.Builder;
ku.view.make = function(desc) { return this.builder.make(desc) };

