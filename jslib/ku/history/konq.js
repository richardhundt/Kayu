ku.module('ku.history.konq');

ku.history.load = function(uid, json) { };

ku.history._onload = function() {
    if (typeof this.onload == 'function') this.onload();
    if (Boolean(this.ignoreOnload)) {
        this.ignoreOnload = false;
        return;
    }
    var doc = self.frames['ku-hist-frame'].window.document;
    if (!doc) return;
    var xmp = doc.getElementById("data");
    var uid = doc.getElementById("uid");
    if (uid) uid = uid.innerHTML
    else return;
    var json = ku.util.unentityfy(xmp.innerHTML);
    ku.history.update(uid, json);
};
ku.history.save = function(state) {
    var ctx = self.frames['ku-hist-frame'].window;
    var uid = state[0];
    var data = ku.json.encode(state[1]);
    this.ignoreOnload = true;
    ctx.location = ku.history.DEV_URI+uid+'&_d='+escape(data);
};
ku.history.start = function() {
    self.setInterval(function() {
        var state = ku.history.QUEUE.shift();
        if (!state) return;
        ku.history.save(state);
    },400);
};

ku.history.start();

