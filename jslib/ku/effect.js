ku.module('ku.effect');

ku.effect.transitions = {
    linear : function(time, start, delta, duration) {
        if (time > duration) return start + delta;
        return start + delta * (time/duration);
    },

    sinusoidal : function(time, start, delta, duration) {
        if (time > duration) return start + delta;
        return start + delta * (
            Math.sin((time/duration - 0.5)*Math.PI)/2 + 0.5
        );
    },

    pulsate : function(time, start, delta, duration, count) {
        if (time > duration) return start + delta;
        if (!count) count = 2;
        return start + delta * (
            Math.sin((time/duration * count - 0.5)*Math.PI)/2 + 0.5
        );
    }
};

ku.effect.Animator = function(opts) {
    this.transition = ku.effect.transitions[opts.transition || 'sinusoidal'];
    this.options    = opts;
    this.reverse    = false;
    this.duration   = opts.duration || 1000;
};
ku.effect.Animator.is(ku.util.Observable);
def = ku.effect.Animator.prototype;

def.start = function() {
    this.cancel();
    this.prepare();
    this.frameRate = this.options.frameRate || 50;
    this.timeSlice = 1000/this.frameRate;
    this.counter   = 0;
    this.frames    = this.options.duration / this.timeSlice;
    this.interval  = self.setInterval(
        ku.delegate(this, this.oneFrame), this.timeSlice
    );
};
def.prepare = function() {
    this.notifyObservers('onAnimationStart');
    if (typeof this.options.before == 'function') this.options.before();
    this._start = this.reverse ? this.options.to : this.options.from;
    this._delta = this.reverse
        ? this.options.from - this.options.to
        : this.options.to - this.options.from;
};
def.animate = function(time) {
    var value = this.transition(
        time, this._start, this._delta, this.duration, this.options.count
    );
    this.notifyObservers('onAnimateValue', value);
};
def.finish = function() {
    this.notifyObservers('onAnimationFinish');
    if (typeof this.options.after == 'function') this.options.after();
    if (this.options.toggle) this.reverse = !this.reverse;
};
def.cancel = function() {
    self.clearInterval(this.interval);
};
def.oneFrame = function() {
    this.animate((++this.counter) * this.timeSlice);
    if (this.counter == this.frames) {
        this.cancel();
        this.finish();
    }
};


ku.effect.Fade = function(node, opts) {
    this.element  = node;
    this.animator = new ku.effect.Animator(opts);
    this.options  = opts;
    this.animator.addObserver(this);
};
def = ku.effect.Fade.prototype;
def.start = function() { this.animator.start() };
def.onAnimateValue = function(animator, value) {
    this.element.style.opacity = value/100;
    this.element.style.MozOpacity = value/100;
    this.element.style.KhtmlOpacity = value/100;
    this.element.style.filter = "alpha(opacity="+Math.floor(value)+")";
};


ku.effect.Parser = function(source) {
    this.source = source;
    if (source) this.parse(source);
};

def = ku.effect.Parser.prototype;
def.parse = function(source) {
    var match = source.match(/((\.|#)[\w-]+)|(\{([^}]*)\})/g);
    var sheet = { }, rules;
    for (var x = 0; x < match.length; x++) {
        if (match[x].charAt(0) == '.' || match[x].charAt(0) == '#') {
            if (!sheet[match[x]]) sheet[match[x]] = rules = { };
            else rules = sheet[match[x]];
        } else if (match[x].charAt(0) == '{') {
            this.parseOptions(match[x], rules);
        }
    }
    this.sheet = sheet;
    return sheet;
};

def.parseOptions = function(pstr, opts) {
    var pairs = pstr.split(/\s*;\s*/);
    for (var x = 0; x < pairs.length; x++) {
        var k_v = pairs[x].split(/\s*:\s*/);
        opts[k_v[0]] = k_v[1];
    }
};

var parser = new ku.effect.Parser('.foo { on : click(); type : fade; from : 100 } #bar { fade-duration : 1000 }');

