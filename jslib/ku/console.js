ku.module("ku.console");

ku.console.COUNT = 0;
ku.console.lines = [];

ku.console.write = function(s) {
    if (ku.DEBUG) {
        this.lines.push(s.entityfy());
        this.show();
    }
};

ku.debug = function(s) { ku.console.writeRaw(String(s)) };

ku.console.writeXML = function(xml) {
    if (ku.DEBUG) {
        var s0 = xml.replace(/</g, '\n<');
        var s1 = s0.entityfy();
        var s2 = s1.replace(/\s*\n(\s|\n)*/g, '<br/>');
        this.lines.push(s2);
        this.show();
    }
};

ku.console.writeRaw = function(s) {
    if (ku.DEBUG) {
        this.lines.push(s);
        this.show();
    }
};

ku.console.clear = function() {
    if (ku.DEBUG) {
        var n = this.div();
        n.innerHTML = '';
        this.lines = [];
    }
};

ku.console.show = function() {
    var n = this.div();
    for (var x = 0; x < this.lines.length; x++) {
        n.appendChild(top.document.createTextNode(('['+ku.console.COUNT++)+'] '+this.lines[x]));
        n.appendChild(top.document.createElement('br'));
    }
    this.lines = [];
    n.scrollTop = n.scrollHeight;
};

ku.console.div = function() {
    var n = top.document.getElementById('log');
    if (!n) {
        n = top.document.createElement('pre');
        n.id = 'log';
        n.style.position = 'absolute';
        n.style.zIndex = 99999;
        n.style.right = '5px';
        n.style.top = '5px';
        n.style.width = '350px';
        n.style.height = '100px';
        n.style.overflow = 'auto';
        n.style.backgroundColor = '#f0f0f0';
        n.style.border = '1px solid gray';
        n.style.fontSize = '10px';
        n.style.padding = '5px';
        top.document.body.appendChild(n);
    }
    return n;
};
