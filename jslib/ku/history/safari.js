ku.module('ku.history.safari');

ku.history.load = function(uid, json) { };

ku.history.add = function(node, data) {
    if (this.ignore) return;
    var state = [ node.id, data ];
    if (this.QUEUE.length == 0) {
        this.save(state);
    } else {
        this.QUEUE.push(state);
    }
};
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
    ku.history.updateFromHash();
    self.setInterval(function() {
        var state = ku.history.QUEUE.shift();
        //if (!state) return;
        if (state) ku.history.save(state);
        ku.history.updateFromHash();
    },400);
};

ku.history.start();
