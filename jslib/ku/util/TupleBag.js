//========================================================================
// ku.util.TupleBag - data synchronization for asynchronous systems ;)
//========================================================================
ku.util.TupleBag = function() {
    this.tuples = [ ];
    this.notify = ku.delegate(this, function() {
        this.notifyObservers('dataChanged', this);
    });
};

ku.util.TupleBag.is(ku.util.Observable);
def = ku.util.TupleBag.prototype;

def.match = function(templ, tuple) {
    if (tuple.length != templ.length) return false;
    var x, m, v, l;
    for (x = 0, l = tuple.length; x < l; x++) {
        m = templ[x], v = tuple[x];
        if (m == null) continue;
        if (m == v)    continue;
        if (typeof m == 'function' &&
            v instanceof m) continue;
        return false;
    }
    return true;
};
def.read = function(templ, every) {
    if (!(templ instanceof Array)) throw "not an Array in TupleBag.read()";
    var first  = !every;
    var found  = first ? null : [ ];
    var tuples = this.tuples[templ.length];
    if (tuples) {
        for (var x = 0, l = tuples.length; x < l; x++) {
            if (this.match(templ, tuples[x])) {
                if (first) return tuples[x];
                found[found.length] = tuples[x];
            }
        }
    }
    return found;
};
def.take = function(templ, every) {
    if (!(templ instanceof Array)) throw "not an Array in TupleBag.take()";
    var first  = !every;
    var found  = first ? null : [ ];
    var tuples = this.tuples[templ.length];
    if (tuples) {
        var other = first ? tuples : [ ];
        for (var x = 0, l = tuples.length; x < l; x++) {
            if (this.match(templ, tuples[x])) {
                if (first) return tuples.splice(x, 1);
                found[found.length] = tuples[x];
            } else if (every) {
                other[other.length] = tuples[x];
            }
        }
        this.tuples[templ.length] = other;
    }
    return found;
};
def.write = function(tuple, quiet) {
    if (!(tuple instanceof Array)) throw "not an Array in TupleBag.write()";
    var tuples = this.tuples[tuple.length];
    if (!tuples) this.tuples[tuple.length] = tuples = [ ];
    tuples[tuples.length] = tuple;
    if (!quiet) this.notify();
};


