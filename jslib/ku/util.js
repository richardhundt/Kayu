ku.module('ku.util');

ku.require('ku.util.Observable');

ku.util.entityfy = function(str) {
    return str.replace(/&/g,"&amp;")
        .replace(/>/g,"&gt;").replace(/</g,"&lt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
};

ku.util.unentityfy = function(str) {
    return str.replace(/&gt;/g,">")
        .replace(/&lt;/g,"<").replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'").replace(/&amp;/g,"&");
};

ku.util.html2frag = function(p, html) {
    var t = p.cloneNode(false);
    var f = document.createDocumentFragment();
    if (t.nodeName == 'TBODY' || t.nodeName == 'TABLE' || t.nodeName == 'THEAD') {
        t = document.createElement('div');
        t.innerHTML = '<table>'+html+'</table>';
        while (t.firstChild.rows.length) f.appendChild(t.firstChild.rows[0]);
    }
    else if (t.nodeName == 'TR') {
        t = document.createElement('div');
        t.innerHTML = '<table><tr>'+html+'</tr></table>';
        while (t.firstChild.rows[0].cells.length)
            f.appendChild(t.firstChild.rows[0].cells[0]);
    }
    else if (t.nodeName == 'SELECT') {
        t = document.createElement('div');
        t.innerHTML = '<select>'+html+'</select>';
        while (t.firstChild.childNodes.length)
            f.appendChild(t.firstChild.childNodes[0]);
    }
    else {
        t.innerHTML = html;
        while (t.firstChild) f.appendChild(t.firstChild);
    }
    return f;
};

ku.util.getFirstElement = function(node) {
    if (!node.childNodes) return null;
    for (var x = 0; x < node.childNodes.length; x++) {
        if (node.childNodes[x].nodeType == Node.ELEMENT_NODE)
            return node.childNodes[x];
    }
};

ku.util.getLastElement = function(node) {
    if (!node.childNodes) return null;
    for (var x = node.childNodes.length - 1; x >= 0; x--) {
        if (node.childNodes[x].nodeType == Node.ELEMENT_NODE)
            return node.childNodes[x];
    }
};

ku.util.getNextElement = function(node) {
    var next = node.nextSibling;
    while (next && next.nodeType != 1) next = next.nextSibling;
    return next;
};

ku.util.getPrevElement = function(node) {
    var prev = node.previousSibling;
    while (prev && prev.nodeType != 1) prev = prev.previousSibling;
    return prev;
};


ku.util.getSourceIndex = function(node) {
    var stack = [ ];
    var docel = node.ownerDocument.documentElement;
    for (var x = docel.childNodes.length - 1; x >= 0; x--) {
        stack.push(docel.childNodes[x]);
    }
    var index = -1;
    while (stack.length) {
        var n = stack.pop();
        if (!n.childNodes) continue;
        if (n.nodeType == 1) index++;
        if (n == node) break;
        for (var x = n.childNodes.length - 1; x >= 0; x--) {
            stack.push(n.childNodes[x]);
        }
    }
    return index;
};

ku.util.addClassName = function(n, s) {
    if (!n.className) n.className = '';
    if (!ku.util.hasClassName(n, s)) n.className += " "+s;
};

ku.util.hasClassName = function(n, s) {
    if (!n.className) return null;
    return n.className.match(new RegExp('\\b'+s+'\\b'));
};

ku.util.removeClassName = function(n, s) {
    if (!n.className) n.className = '';
    n.className = n.className.replace(new RegExp('\\s*\\b'+s+'\\b','g'), '');
};

ku.util.replaceClassName = function(n, newTok, refTok) {
    ku.util.removeClassName(n, refTok);
    ku.util.addClassName(n, newTok);
};

ku.util.getElementsByClassName = function(node, className, deep) {
    var list = [ ], n, rx = new RegExp('\\b'+className+'\\b');
    if (Boolean(deep)) {
        var stack = [ ];
        for (var x = 0; x < node.childNodes.length; x++) {
            n = node.childNodes[x];
            if (n.nodeType == 1) stack.unshift(n);
        }
        while (stack.length) {
            n = stack.pop();
            if (rx.test(n.className)) list.push(n);
            var c;
            for (var x = n.childNodes.length - 1; x >= 0; x--) {
                c = n.childNodes[x];
                if (c.nodeType == 1) stack.push(c);
            }
        }
    } else {
        for (var x = 0; x < node.childNodes.length; x++) {
            n = node.childNodes[x];
            if (n.nodeType == 1 && rx.test(n.className)) list.push(n);
        }
    }
    return list;
};

ku.util.getElementIndex = function(node) {
    if (!node.parentNode) return null;
    var prn = node.parentNode;
    var idx = -1;
    for (var x = 0, l = prn.childNodes.length; x < l; x++) {
        if (prn.childNodes[x].nodeType == 1) {
            idx++; if (prn.childNodes[x] == node) return idx;
        }
    }
    return idx;
};

ku.util.getNodeIndex = function(node) {
    if (!node.parentNode) return null;
    for (var c = 0; c < node.parentNode.childNodes.length; c++) {
        if (node.parentNode.childNodes[c] == node) return c;
    }
    return c;
};

ku.util.nodeContains = function(a, b) {
    if (a.compareDocumentPosition)
        return !!(a.compareDocumentPosition(b) & 16);
    var c = b;
    while (c) {
        if (c == a) return true; else c = c.parentNode;
    }
    return false;
};

ku.util.insertAfter = function(n, r) {
    if (r.nextSibling) {
        r.parentNode.insertBefore(n, r.nextSibling);
    } else {
        r.parentNode.appendChild(n);
    }
};

ku.util.signalUp = function(n, m) {
    var a = Array.prototype.slice.call(arguments, 2);
    var p = n.parentNode;
    while (p && p.parentNode) {
        if (typeof p[m] == 'function') {
            return p[m].apply(p, a);
        }
        p = p.parentNode;
    }
};

ku.util.signalDown = function(n, m) {
    var a = Array.prototype.slice.call(arguments, 2);
    var s = [ ];
    for (var x = n.childNodes.length - 1; x >= 0; x--) {
        if (n.childNodes[x].nodeType == 1) s.push(n.childNodes[x]);
    }
    while (s.length) {
        n = s.pop();
        if (typeof n[m] == 'function') {
            n[m].apply(n, a);
            continue;
        }
        for (var x = n.childNodes.length - 1; x >= 0; x--) {
            if (n.childNodes[x].nodeType == 1) s.push(n.childNodes[x]);
        }
    }
};

ku.util.copyAttrs = function(source, target, ignore) {
    ignore = ignore || [ ];
    ignore.contains = function(s) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == s) return true;
        }
        return false;
    };
    var attr;
    for (var x = 0; x < source.attributes.length; x++) {
        attr = source.attributes[x];
        if (attr.nodeValue && !ignore.contains(attr.nodeName)) {
            target.setAttribute(attr.nodeName, attr.nodeValue);
        }
    }
};

ku.GENCOUNT = 0;
ku.util.genuid = function() { return "ku-gen-"+(++ku.GENCOUNT) };

ku.util.regexp = {
    url : new RegExp('^(ht|f)tp(s?)://([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=+]*)?(#.*)?$'),
    time : new RegExp('^(\\d{2}):(\\d{2})(?:(?::(\\d{2}))|(?::(\\d{2})\\.(\\d{3})))?$'),
    email : new RegExp('^([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$')
};

// credit should go to the author of the following sprintf() function,
// but unfortunately I can no longer remember where I found this gem.
ku.util.sprintf = function() {
    if (!arguments || arguments.length < 1 || !RegExp) return;
    var str = arguments[0];
    var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
    var a = b = [], numSubstitutions = 0, numMatches = 0;
    while (a = re.exec(str)) {
        var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
        var pPrecision = a[5], pType = a[6], rightPart = a[7];

        numMatches++;
        if (pType == '%') {
            subst = '%';
        } else {
            numSubstitutions++;
            if (numSubstitutions >= arguments.length) {
                alert('Error! Not enough function arguments ('
                    + (arguments.length - 1)
                    + ', excluding the string)\n'
                    + 'for the number of substitution parameters in string ('
                    + numSubstitutions + ' so far).');
            }
            var param = arguments[numSubstitutions];
            var pad = (pPad && pPad.substr(0,1) == "'") ?
                leftpart.substr(1,1) : pPad;

            var justifyRight = true;
            if (pJustify && pJustify === "-") justifyRight = false;

            var minLength = -1;
            if (pMinLength) minLength = parseInt(pMinLength);

            var precision = -1;
            if (pPrecision && pType == 'f')
                precision = parseInt(pPrecision.substring(1));

            var subst = param;

            switch (pType) {
            case 'b': subst = parseInt(param).toString(2); break;
            case 'c': subst = String.fromCharCode(parseInt(param)); break;
            case 'd': subst = parseInt(param) ? parseInt(param) : 0; break;
            case 'u': subst = Math.abs(param); break;
            case 'f':
                subst = (precision > -1)
                    ? Math.round(parseFloat(param) * Math.pow(10, precision))
                        / Math.pow(10, precision)
                    : parseFloat(param);
                break;
            case 'o': subst = parseInt(param).toString(8); break;
            case 's': subst = param; break;
            case 'x':
                subst = ('' + parseInt(param).toString(16)).toLowerCase();
                break;
            case 'X':
                subst = ('' + parseInt(param).toString(16)).toUpperCase();
                break;
            }
            var padLeft = minLength - subst.toString().length;
            if (padLeft > 0) {
                var arrTmp = new Array(padLeft+1);
                var padding = arrTmp.join(pad?pad:" ");
            } else {
                var padding = "";
            }
        }
        str = leftpart + padding + subst + rightPart;
    }
    return str;
};

ku.util.supplant = function(s, o) {
    if (!o) o = self;
    var sout, oout;
    sout = s.replace(/{([^{}]*)}/g, function(a, b) {
        var u = b.split('.');
        var r = o[u[0]];
        if (u.length > 1) {
            for (var x = 1; x < u.length; x++) r = r[u[x]];
        }
        
        if (typeof r === 'string' || typeof r === 'number') {
            return r;
        } else if (typeof r === 'object' || typeof r === 'function') {
            oout = r; return a;
        } else {
            return a;
        }
    });
    if (oout) return oout;
    return sout;
};

ku.util.setOpacity = function(node, value) {
    node.style.opacity = value;
    node.style.MozOpacity = value;
    node.style.KhtmlOpacity = value;
    node.style.filter = "alpha(opacity="+Math.floor(value * 100)+")";
};

ku.util.setSelectable = function(node, value) {
    if (value == "false" || value === false) {
        node.style.KhtmlUserSelect = "none";
        node.style.MozUserSelect = "none";
        node.onselectstart = function() { return false };
        node.UserSelect = "none";
    } else {
        node.style.KhtmlUserSelect = "";
        node.style.MozUserSelect = "";
        node.onselectstart = null;
        node.UserSelect = "none";
    }
};

ku.util.getStyle = function(node, rule) {
    if (node.nodeType != Node.ELEMENT_NODE) {
        node = node.parentNode;
    }
    if (document.defaultView && document.defaultView.getComputedStyle) {
        var computedStyle = document.defaultView.getComputedStyle(node, null);
        return computedStyle ? computedStyle.getPropertyValue(rule) : null;
    }
    else if (node && node.currentStyle) {
        rule = ku.util.convertStyleName(rule);
        return node.currentStyle[rule];
    }
};

ku.util.getStyleText = function(node) {
    if (node.style.cssText != null) return node.style.cssText;
    return node.style.styleText;
};

ku.util.setStyleText = function(node, text) {
    if (node.style.cssText != null) node.style.cssText = text;
    else node.style.styleText = text;
};

ku.util.convertStyleName = function(styleName) {
    if (!styleName || typeof styleName != "string") return null;
    return styleName.replace(/\-(\w)/g, function(m, p) {
        return p.toUpperCase();
    });
};

ku.util.getX = function(node) {
    var curleft = 0;
    if (node.offsetParent) {
        while (node.offsetParent) {
            curleft += node.offsetLeft;
            node = node.offsetParent;
        }
    }
    else if (node.x) curleft += node.x;
    return curleft;
};

ku.util.getY = function(node) {
    var curtop = 0;
    if (node.offsetParent) {
        while (node.offsetParent) {
            curtop += node.offsetTop;
            node = node.offsetParent;
        }
    }
    else if (node.y) curtop += node.y;
    return curtop;
};

ku.util.getClientWidth = function() {
    if (typeof self.innerWidth == "number") {
        return self.innerWidth;
    } else {
        return document.body.clientWidth;
    }
};
ku.util.getClientHeight = function() {
    if (typeof self.innerHeight == "number") {
        return self.innerHeight;
    } else {
        return document.body.clientHeight;
    }
};

ku.util.getPageWidth = function() {
    return document.body.scrollWidth > document.documentElement.scrollWidth
        ? document.body.scrollWidth
        : document.documentElement.scrollWidth;
};
ku.util.getPageHeight = function() {
    return document.body.scrollHeight > document.documentElement.scrollHeight
        ? document.body.scrollHeight
        : document.documentElement.scrollHeight;
};

ku.util.getScrollX = function() {
    if (typeof self.scrollX == "number") return self.scrollX;
    if (typeof document.documentElement.scrollLeft == "number")
        return document.documentElement.scrollLeft;
    if (typeof document.body.scrollLeft == "number")
        return document.body.scrollLeft;
    return self.pageXOffset || 0;
};
ku.util.getScrollY = function() {
    if (typeof self.scrollY == "number") return self.scrollY;
    if (typeof document.documentElement.scrollTop == "number")
        return document.documentElement.scrollTop;
    if (typeof document.body.scrollTop == "number")
        return document.body.scrollTop;
    return self.pageYOffset || 0;
};



