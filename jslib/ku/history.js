ku.module('ku.history');

ku.history = function() { };

ku.history.DEBUG = false;
ku.history.QUEUE = [ ];
ku.history.HASH  = self.location.hash;
ku.history.DEV_URI = ku.BASE+'/dev/hist?_k=';
ku.history.INIT_HASH = unescape(self.location.hash.replace('#', ''));

ku.history.update = function(uid, json) {
    var node = ku.get(uid);
    if (!(node && json)) return;
    var data = ku.json.decode(unescape(json));
    ku.history.ignore = true;
    if (typeof node.loadState == 'function') {
        node.loadState(data);
    } else {
        for (var k in data) {
            if (typeof node.set == 'function') {
                node.set(k, data[k]);
            } else if (typeof node['set_'+k] == 'function') {
                node['set_'+k](data[k]);
            } else {
                node[k] = data[k];
            }
        }
    }
    ku.history.ignore = false;
};

ku.history.add = function(node, data) {
    if (this.ignore) return;
    var state = [ node.id, data ];
    if (this.QUEUE.length == 0) {
        this.save(state);
    } else {
        this.QUEUE.push(state);
    }
};

ku.history._onload = function() {
    if (typeof this.onload == 'function') this.onload();
};

ku.history.updateFromHash = function() {
    var hash = unescape(self.location.hash.replace('#', ''));
    if (hash != ku.history.HASH) {
        ku.debug("HASH CHANGE");
        if (/^([\d\w_-]+);(.*)$/.test(hash)) {
            var uid  = RegExp.$1;
            var json = RegExp.$2;
            ku.history.HASH = hash;
            ku.history.update(uid, json);
        }
    }
};

ku.require('ku.useragent');

document.write('<a id="ku-hist-anch" name="-1"></a>');

var frameStyle = 'height:0px;position:absolute;top:-20px;';
if (ku.history.DEBUG) { frameStyle = ''; }

/*
document.write(
    '<iframe name="ku-hist-frame" id="ku-hist-frame" style="'+frameStyle
        +'" onload="ku.history._onload()" src="'+ku.history.DEV_URI+'-1"></iframe>'
);
*/
document.write(
    '<iframe name="ku-hist-frame" id="ku-hist-frame" style="'+frameStyle
        +'" onload="ku.history._onload()" src="about:blank"></iframe>'
);

if (ku.userAgent.is_moz) {
    ku.require('ku.history.moz');
}
else if (ku.userAgent.is_opera) {
    ku.require('ku.history.opera');
}
else if (ku.userAgent.is_konq) {
    ku.require('ku.history.konq');
}
else if (ku.userAgent.is_safari) {
    ku.require('ku.history.safari');
}
else if (ku.userAgent.is_ie) {
    ku.require('ku.history.ie');
}


