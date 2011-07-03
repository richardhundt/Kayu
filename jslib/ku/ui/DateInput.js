ku.module('ku.ui.DateInput');

ku.ui.DateInput = function(nid) {
    var $this = ku.get(nid);
    ku.bless($this, arguments.callee);
    $this.init();
    return $this;
};

ku.is(ku.ui.DateInput, ku.ui.Component);
def = ku.ui.DateInput.prototype;

def.init = function() {
    this.initProperties();
    this.calendar().style.position = 'absolute';
    this.calendar().style.zIndex = ++ku.TOP_Z_INDEX;
    var $this = this;
    this.calendar().addObserver('select', function(sig) {
        $this.hideCalendar();
        $this.updateInput(sig.date);
    });
};

def.input = function() { return ku.query(this).select('..INPUT')[0] };

def.calendar = function() {
    return ku.query(this).select('..*.(@class == "ku-calendar")')[0];
};
def.calendarBox = function() {
    return ku.query(this).select('..*.(@class == "ku-calendar-box")')[0];
};

def.updateInput = function(date) {
    var Y = date.getFullYear();
    var M = date.getMonth()+1;
    var D = date.getDate();
    var value = ku.util.sprintf('%4d-%02d-%02d', Y, M, D);
    this.input().value = value;
    this.value = value;
    this.dispatchSignal('change', { 'value' : value });
};

def.setDate = function(d) {
    if (!(d instanceof Date) ) {
        var m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        d = new Date();
        d.setFullYear(m[1]);
        d.setMonth(parseInt(m[2].replace(/^0/,''))-1);
        d.setDate(m[3].replace(/^0/,''));
    }
    this.calendar().setDate(d);
    this.updateInput(d);
};

def.getDate = function() { return this.calendar().getDate() };

def.set_value = function(v) {
    if (v == '') return this.input().value = '';
    this.setDate(v);
};

def.set_change = function(h) {
    ku.debug('set change: '+h);
    this.addObserver('change', h);
};

def.hideCalendar = function() {
    this.showing = false;
    this.calendarBox().style.display = 'none';
};

def.toggleCalendar = function() {
    this.showing = !this.showing;
    if (this.showing) {
        this.calendarBox().style.display = '';
        var $this = this;
        ku.event.addListener(document.body, 'click', function() {
            ku.event.removeListener(
                document.body, 'click', arguments.callee
            );
            $this.hideCalendar();
        });
    } else {
        this.hideCalendar();
    }
};
