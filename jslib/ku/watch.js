ku.module('ku.watch');

ku.watchers = [ ];

ku.watch = function(object, property, handler, interval) {
    var o = object, p = property, h = handler, i = interval || 100;
    var curval = o[p];
    var iwatch;
    iwatch = window.setInterval(function() {
        try {
            if (o[p] !== curval) h.call(o, curval, o[p]);
            curval = o[p];
        } catch (ex) {
            ku.unwatch(o, p);
            throw ex;
        }
    }, i);

    ku.watchers.push({ object : o, property : p, iwatch : iwatch });
};

ku.unwatch = function(o, p) {
    for (var x = 0; x < ku.watchers.length; x++) {
        var w = ku.watchers[x];
        if (w.object == o && w.property == p) {
            window.clearInterval(w.iwatch);
            ku.watchers.splice(x, 1);
        }
    }
};

