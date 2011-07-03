ku.module('ku.util.Template');

ku.util.Template = function(source) {
    this.code = "";
    this.exec = function() {
        throw new Error("cannot process uncompiled template: "+source);
    };
    if (source) {
        if (source.nodeType) source = source.nodeValue;
        source = source.replace(/^\s+/, '').replace(/\s+$/, '');
        this.source = source;
        this.compile(source);
    }
};

def = ku.util.Template.prototype;

def.process = function(vars) {
    this.vars = vars || { };
    if (!this.vars.$out) this.vars.$out = [ ];
    this.exec(this.vars);
    return this.vars.$out.join("");
};

def.compile = function(s) {
    var list = this.parse(ku.util.unentityfy(String(s)));
    var code = "";
    var frag;
    for (var x = 0; x < list.length; x++) {
        frag = list[x];
        if (/^[ \r\n\t]*$/.test(frag)) continue;
        if (frag.substr(0, 4) == '<?js') {
            code += frag.substring(4, frag.length - 2)+"\n";
        } else {
            code += '\n$out.push("'+frag.replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")+'");';
        }
    }

    this.code = code;
    try {
        this.exec = new Function('$ctx', 'with($ctx){'+code+'}');
    } catch(ex) {
        alert('failed to compile: '+code);
    }
};

def.parse = function(s) {
    return s
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<!--[^>]+>/g, '')
    .replace(/%\{([^\}]+)\}/g, '<?js $out.push($1); ?>')
    .match(/<\?js(\?>|[\n\r\t ][^?]*\?+([^>?][^?]*\?+)*>)|(<(?!\?js)|[^<]*)*/g);
};

