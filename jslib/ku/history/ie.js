ku.module('ku.history.ie');

ku.history.load = function(uid, json) {
    if (ku.history.fixhash(uid, json)) {
        ku.history.update(uid, json);
    }
};
ku.history.fixhash = function(uid, json) {
    var hash = uid+";"+json;
    if (ku.history.HASH != hash) {
        ku.history.HASH = hash;
        ku.get('ku-hist-anch').name = hash;
        self.location.hash = hash;
        return true;
    }
    return false;
};
ku.history._onload = function() {
    if (this.onload) this.onload(self.frames['ku-hist-frame'].window);
};
ku.history.save = function(state) {
    var ctx = self.frames['ku-hist-frame'].window;
    var uid = state[0];
    var data = ku.json.encode(state[1]);
    ku.history.fixhash(uid, data);
    ctx.location = ku.history.DEV_URI+uid+'&_d='+escape(data);
};
ku.history.start = function() {
    self.setInterval(function() {
        var hash = self.location.hash.replace('#','');
        if (hash != ku.history.HASH) {
            /^([\d\w_-]+);(.*)$/.test(hash);
            var uid  = RegExp.$1;
            var json = RegExp.$2;
            ku.history.HASH = hash;
            ku.history.update(uid, json);
        }
        var state = ku.history.QUEUE.shift();
        if (!state) return;
        ku.history.save(state);
    },400);
};

ku.history.start();

