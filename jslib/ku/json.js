ku.module('ku.json');

ku.json = {
copyright: '(c)2005 JSON.org',
license: 'http://www.JSON.org/license.html',

encode: function(v) {
    var f = ku.json[typeof v];
    if (f) {
	v = f(v);
	if (typeof v == 'string') {
	    return v;
	}
    }
    return null;
},
decode: function(text) {
    try {
	if (!/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
            text.replace(/"(\\.|[^"\\])*"/g, ''))) {
            return (new Function('', 'return ('+text+')'))();
        } else {
            return false;
        }
    } catch (e) {
	return false;
    }
},
'escapes' : {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
},
'boolean': function(x) {
    return String(x);
},
number: function(x) {
    return isFinite(x) ? String(x) : 'null';
},
string: function(x) {
    if (/["\\\x00-\x1f]/.test(x)) {
	x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
	    var c = ku.json.escapes[b];
	    if (c) {
		return c;
	    }
	    c = b.charCodeAt();
	    return '\\u00' +
		Math.floor(c / 16).toString(16) +
		(c % 16).toString(16);
	});
    }
    return '"' + x + '"';
},
object: function(x) {
    if (x) {
	var a = [], b, f, i, l, v;
	if (x instanceof Array) {
	    a[0] = '[';
	    l = x.length;
	    for (i = 0; i < l; i += 1) {
		v = x[i];
		f = ku.json[typeof v];
		if (f) {
		    v = f(v);
		    if (typeof v == 'string') {
			if (b) {
			    a[a.length] = ',';
			}
			a[a.length] = v;
			b = true;
		    }
		}
	    }
	    a[a.length] = ']';
        } else if (x instanceof Date) {
            a[a.length] = '"'+x.toString()+'"';
	} else if (typeof x.hasOwnProperty === 'function') {
	    a[0] = '{';
	    for (i in x) {
		if (x.hasOwnProperty(i)) {
		    v = x[i];
		    f = ku.json[typeof v];
		    if (f) {
			v = f(v);
			if (typeof v == 'string') {
			    if (b) {
				a[a.length] = ',';
			    }
			    a.push(ku.json.string(i), ':', v);
			    b = true;
			}
		    }
		}
	    }
	    a[a.length] = '}';
	} else {
	    return;
	}
	return a.join('');
    }
    return 'null';
}
};
