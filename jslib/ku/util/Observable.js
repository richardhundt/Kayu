ku.module('ku.util.Observable');
ku.util.Observable = function() { };

def = ku.util.Observable.prototype;

def.isObservable = true;

def.addObserver = function(obsv) {
    if (!this.observers) this.observers = [ ];
    for (var x = 0, l = this.observers.length; x < l; x++) {
        if (this.observers[x] == obsv) return;
    }
    this.observers.push(obsv);
};

def.removeObserver = function(obsv) {
    if (!this.observers) return;
    for (var x = 0, l = this.observers.length; x < l; x++) {
        if (this.observers[x] == obsv) {
            return this.observers.splice(x, 1);
        }
    }
};

def.notifyObservers = function(meth, data) {
    if (!this.observers) return;
    var obsv
    for (var x = 0, l = this.observers.length; x < l; x++) {
        obsv = this.observers[x];
        if (typeof obsv == 'function') {
            obsv(meth, this, data);
        } else if (typeof obsv[meth] == 'function') {
            obsv[meth](this, data);
        }
    }
};

