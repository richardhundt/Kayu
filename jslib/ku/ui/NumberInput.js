ku.module('ku.ui.NumberInput');

ku.ui.NumberInput = function(nid) {
    var $this = ku.get(nid);
    ku.bless($this, arguments.callee);
    $this.init();

    $this.unit = $this.getAttribute('unit') || '';
    $this.regx = new RegExp('^(-?\\d+(\\.\\d+)?)'+$this.unit+'?$');
    $this.step = parseInt($this.getAttribute('step') || '1');
    $this.min  = parseInt($this.getAttribute('min') || 'NaN');
    $this.max  = parseInt($this.getAttribute('max') || 'NaN');

    ku.event.addListener($this.input(), 'change', function() {
        ku.util.callUp(this, 'set', 'value', this.value);
    });
    ku.event.addListener($this.input(), 'keypress', function(e) {
        e = ku.event(e);
        if (e.keyCode == 38) {
            ku.util.callUp(this, 'incrValue');
        }
        else if (e.keyCode == 40) {
            ku.util.callUp(this, 'decrValue');
        }
    });

    return $this;
};

ku.is(ku.ui.NumberInput, ku.ui.Component);
def = ku.ui.NumberInput.prototype;

def.input = function() {
    return ku.query(this).select('..INPUT').item(0);
};

def.get_value = function() {
    return this.input().value;
};
def.set_value = function(v) {
    if (/^[+-]?[0-9]+(?:\.[0-9]+)?$/.test(String(v))) {
        this.input().value = v;
    } else {
        this.input().value = 'NaN';
    }
};
def.set_change = function(h) {
    this.addObserver('change', h);
};
def.set_name = function(n) {
    this.input().name = n;
};
def.get_name = function() {
    return this.input().name;
};

def.incrValue = function() {
    if (!this.regx.test(this.get('value'))) {
        this.set('value', '0' + this.unit);
    } else {
        var m = this.get('value').match(this.regx);
        var v = parseFloat(m[1]) + this.step;
        if (!isNaN(this.max) && v > this.max) {
            this.set('value', this.max + this.unit);
        } else {
            this.set('value', v + this.unit);
        }
    }
};
def.decrValue = function() {
    if (!this.regx.test(this.get('value'))) {
        this.set('value', '0');
    } else {
        var m = this.get('value').match(this.regx);
        var v = parseFloat(m[1]) - this.step;
        if (!isNaN(this.min) && v < this.min) {
            this.set('value', this.min + this.unit);
        } else {
            this.set('value', v + this.unit);
        }
    }
};

