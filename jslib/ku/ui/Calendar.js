ku.module('ku.ui.Calendar');

Date.prototype.isLeap = function() {
    var y = this.getFullYear();
    if (y % 4 != 0) {
        return false;
    } else if (y % 400 == 0) {
        return true;
    } else if (y % 100 == 0) {
        return false;
    } else {
        return true; 
    }
};

ku.ui.Calendar = function(nid) {
    var $this = ku.get(nid);
    ku.bless($this, arguments.callee);
    $this.init();
    $this.ctl = ku.query($this.rows[0]).select('..table')[0];
    $this.cal = ku.query($this.rows[1]).select('..table')[0];

    var thead = $this.cal.getElementsByTagName('thead')[0];
    var wdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');

    var tr = ku.ui.elmt('tr');
    for (var x = 0; x < wdays.length; x++) {
        var th = ku.ui.elmt('th');
        th.appendChild(ku.ui.text(wdays[x]));
        tr.appendChild(th);
    }
    thead.appendChild(tr);

    var tbody = $this.cal.getElementsByTagName('tbody')[0];
    for (var x = 0; x < 6; x++) {
        tr = ku.ui.elmt('tr');
        for (var y = 0; y < 7; y++) {
            tr.appendChild(ku.ui.elmt('td'));
        }
        tbody.appendChild(tr);
    }

    $this.setDate();
    return $this;
};

ku.is(ku.ui.Calendar, ku.ui.Component);
def = ku.ui.Calendar.prototype;

def.wdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(/ /);
def.mname = 'January February March April May June July August September October November December'.split(/ /);

def.setDate = function(d) {
    if (typeof d == 'undefined') d = new Date();
    this.set('value', d);

    var tb = this.cal.getElementsByTagName('tbody')[0];
    this.cal.removeChild(tb);

    var cu = new Date();
    cu.setTime(d.getTime());
    cu.setDate(1);
    cu.setDate(0 - cu.getDay());

    var nl = tb.getElementsByTagName('td');
    for (var i = 0; i < 42; i++) {
        cu.setDate(cu.getDate() + 1);
        var c = nl[i];
        c.innerHTML = '';
        c.onclick = null;
        if (cu.getMonth() == d.getMonth()) {
            var a = ku.ui.elmt('a', { href : 'javascript:void(0)' });
            a.appendChild(ku.ui.text(cu.getDate()));
            a.date = new Date();
            a.date.setTime(cu.getTime());
            a.onclick = function() {
                arguments.callee.target.selectDate(this.date);
            };
            a.onclick.target = this;
            a.style.cursor = 'pointer';
            if (i % 7 == 0) a.className = 'ku-day-sunday';
            if (d.getTime() == cu.getTime()) a.className = 'ku-day-selected';
            c.appendChild(a);
        }
        else if (i < 7) {
            c.onclick = function() { arguments.callee.target.setPrevMonth() };
            c.onclick.target = this;
            c.appendChild(ku.ui.text(cu.getDate()));
            c.style.color = 'darkgray';
        }
        else {
            c.onclick = function() { arguments.callee.target.setNextMonth() };
            c.onclick.target = this;
            c.appendChild(ku.ui.text(cu.getDate()));
            c.style.color = 'darkgray';
        }
    }
    this.ctl.rows[0].cells[1].innerHTML = this.mname[d.getMonth()];
    this.ctl.rows[0].getElementsByTagName('input')[0].value = d.getFullYear();
    this.cal.appendChild(tb);

};

def.getDate = function() { return this.value };

def.setPrevMonth = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setMonth(d.getMonth() - 1);
    this.setDate(d);
};

def.setNextMonth = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setMonth(d.getMonth() + 1);
    this.setDate(d);
};

def.setPrevYear = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(d.getFullYear() - 1);
    this.setDate(d);
};

def.setNextYear = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(d.getFullYear() + 1);
    this.setDate(d);
};

def.setYear = function(y) {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(y);
    this.setDate(d);
};

def.selectDate = function(d) {
    this.dispatchSignal('select', { date : d });
    this.setDate(d);
};

def.set_select = function(handler) {
    this.addObserver('select', handler);
};
