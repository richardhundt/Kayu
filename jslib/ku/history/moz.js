ku.module('ku.history.moz');

ku.history.load = function(uid, json) { };

ku.history.save = function(state) {
    var uid = state[0];
    var data = ku.json.encode(state[1]);
    var hash = uid+";"+data;
    if (this.HASH != hash) {
        this.HASH = hash;
        ku.get('ku-hist-anch').name = hash;
        self.location.hash = hash;
    }
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

