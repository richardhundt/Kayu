ku.module('ku.form');

ku.form.ValidationError = function(mesg, elmt) {
    this.message = mesg;
    this.element = elmt;
};
ku.form.ValidationError.is(Error);

ku.form.Form = function(node) {
    ku.bless(node, arguments.callee);
    var elmts = ku.query(node).select('..input');
    for (var x = 0; x < elmts.length; x++) {
        ku.form.element(elmts[x]);
    }
};

ku.form.Form.is(ku.util.Observable);

def = ku.form.Form.prototype;
def.onsubmit = function() {
    try {
        ku.util.signalDown(this, 'onFormSubmit', this);
    } catch (ex) {
        if (ex instanceof ku.form.ValidationError) {
            ku.util.addClassName(ex.element, 'ku-validation-error');
            return false;
        } else {
            throw ex;
        }
    }
    var broker  = ku.broker();
    this.target = broker.name;
    var responseArea = ku.query(this).$('..*.(@ku:state == "response")')[0];

    this.notifyObservers('onSubmit');
    var $this = this;
    broker.onload = function() {
        var respDoc = broker.getDocument();
        $this.notifyObservers('onResponse', respDoc);
        if (responseArea) {
            responseArea.innerHTML = respDoc.body.innerHTML;
        }
    };
    return true;
};

ku.form.element = function(node) {
    switch (node.getAttribute("ku:type")) {
        case "date":
            new ku.form.DateInput(node);
            break;
        case "time":
            new ku.form.TimeInput(node);
            break;
        case "datetime":
            new ku.form.DateTimeInput(node);
            break;
        case "number":
            new ku.form.NumberInput(node);
            break;
        case "range":
            new ku.form.RangeInput(node);
            break;
        case "enum":
            new ku.form.EnumInput(node);
            break;
        case "boolean":
            new ku.form.BooleanInput(node);
            break;
        case "url":
            new ku.form.UrlInput(node);
            break;
        case "email":
            new ku.form.EmailInput(node);
            break;
    }
};

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

ku.form.Element = function(node, opts) {
    if (node) {
        this.element = node;
        this.options = ku.view.getAttributesAsObject(node, opts);

        this.marker  = document.createComment('ku-marker');
        node.parentNode.insertBefore(this.marker, node);

        if (node.getAttribute('onchange')) {
            var handler = new Function('', node.getAttribute('onchange'));
            this.addObserver(function(mesg, eobj, data) {
                handler.call(node, eobj);
            });
        }
        this.init();
    }
};

ku.form.Element.is(ku.util.Observable);
def = ku.form.Element.prototype;

def.init = function() {
    this.render();
};
def.getValue = function() { return this.element.value };

//========================================================================
// ku.form.NumberInput
//========================================================================
ku.form.NumberInput = function(node) {
    ku.form.Element.call(this, node);
};

ku.form.NumberInput.is(ku.form.Element);
def = ku.form.NumberInput.prototype;

def.render = function() {
    this.outer = this.renderOuter();
    this.marker.parentNode.replaceChild(this.outer, this.marker);

    this.unit = this.options['unit'] || '';
    this.regx = new RegExp('^(-?\\d+(\\.\\d+)?)'+this.unit+'?$');
    this.step = parseInt(this.options['step'] || '1');
    this.min  = parseInt(this.options['min']  || 'NaN');
    this.max  = parseInt(this.options['max']  || 'NaN');

    var $this = this;
    this.element.onchange = function() {
        $this.notifyObservers('onValueChanged', this.value);
    };

    this.element.onkeypress = function(e) {
        e = ku.event(e);
        if (e.keyCode == 38) $this.incrValue();
        else
        if (e.keyCode == 40) $this.decrValue();
    };
};

def.renderOuter = function() {
    var $this = this;
    this.incrButton = ku.view.make(
        [ 'a', {
            'href' : '#',
            'style' : 'display:block;height:8px',
            onmousedown : function() { $this.incrValue() },
            'class' : 'ku-incr-button'
        } ]
    );
    this.decrButton = ku.view.make(
        [ 'a', {
            'href' : '#',
            'style' : 'display:block;height:8px',
            onmousedown : function() { $this.decrValue() },
            'class' : 'ku-decr-button'
        } ]
    );
    return ku.view.make(
        [ 'table', {
            'class' : 'ku-number-input',
            'cellPadding' : 0, cellSpacing : 0, border : 0 }, 
            ['tbody',
                [ 'tr',
                    [ 'td', this.element ],
                    [ 'td', this.incrButton, this.decrButton ]
                ]
            ]
        ]
    );
};

def.setValue = function(value, quiet) {
    if (/^[+-]?[0-9]+(?:\.[0-9]+)?$/.test(String(value))) {
        this.element.value = value;
    } else {
        this.element.value = 'NaN';
    }
    if (!quiet) this.notifyObservers('onValueChanged', this.element.value);
};

def.incrValue = function() {
    if (!this.regx.test(this.element.value)) {
        this.setValue('0' + this.unit);
    } else {
        var m = this.element.value.match(this.regx);
        var v = parseFloat(m[1]) + parseFloat(this.step);
        if (!isNaN(this.max) && v > this.max) {
            this.setValue(this.max + this.unit);
        } else {
            this.setValue(v + this.unit);
        }
    }
};
def.decrValue = function() {
    if (!this.regx.test(this.element.value)) {
        this.setValue('0');
    } else {
        var m = this.element.value.match(this.regx);
        var v = parseFloat(m[1]) - this.step;
        if (!isNaN(this.min) && v < this.min) {
            this.setValue(this.min + this.unit);
        } else {
            this.setValue(v + this.unit);
        }
    }
};

//========================================================================
// ku.form.Calendar
//========================================================================
ku.form.Calendar = function(node) {
    this.element = node;
    this.init();
};

ku.form.Calendar.is(ku.util.Observable);

def = ku.form.Calendar.prototype;

def.wdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(/ /);
def.mname = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

def.init = function() {
    this.value = this.date || new Date();
    this.element.className = 'ku-calendar';

    this.controls = this.renderControls();
    this.calendar = this.renderCalendar();

    this.element.appendChild(this.controls);
    this.element.appendChild(this.calendar);

    this.yearInput = new ku.form.NumberInput(this.yearInputElement);

    var $this = this;
    this.yearInput.addObserver(function(mesg, node, data) {
        ku.debug('setYear: '+data);
        $this.setYear(data);
    });

    this.footPanel = ku.view.make(
        [ 'div', { 'class' : 'ku-calendar-foot' },
            [ 'a', {
                'href' : 'javascript:void(0)',
                'class' : 'ku-calendar-today-button',
                onclick : function() { $this.setDateSelected(new Date) }
            }, 'today' ],
            [ 'a', {
                'href' : 'javascript:void(0)',
                'class' : 'ku-calendar-none-button',
                onclick : function() { $this.clearDate() }
            }, 'none' ]
        ]
    );

    this.element.appendChild(this.footPanel);
};

def.renderControls = function() {
    this.yearInputElement = ku.view.make(
        [ 'input', {
            'step' : 1, 'min' : 1970, 'max' : 2038,
            'value' : this.value.getFullYear()
        } ]
    );
    this.monthLabelCell = ku.view.make(
        [ 'td', { 'class' : "ku-month-cell" },
            this.mname[this.value.getMonth()]
        ]
    );
    var $this = this;
    return ku.view.make(
        [ 'table', {
            'class' : 'ku-calendar-head', 'width' : '100%',
            'cellPadding' : '0', 'cellSpacing' : '0', 'border' : '0' },
            ['tbody',
                [ 'tr',
                    [ 'td', { 'align' : "center" },
                        [ 'a', {
                            'href' : "javascript:void('prev')",
                            'class' : "ku-prev-button",
                            'onclick' : function() { $this.setPrevMonth() }
                        } ]
                    ],
                    this.monthLabelCell,
                    [ 'td', { 'align' : "center" },
                        [ 'a', {
                            'href' : "javascript:void('next')",
                            'class' : "ku-next-button",
                            'onclick' : function() { $this.setNextMonth() }
                        } ]
                    ],
                    [ 'td', { 'align' : "center" }, this.yearInputElement ]
                ]
            ]
        ]
    );
};

def.renderCalendar = function() {
    var thead = [ 'thead' ];
    var daysRow = [ 'tr' ];
    for (var x = 0; x < this.wdays.length; x++) {
        daysRow.push([ 'th', this.wdays[x] ]);
    }
    thead.push(daysRow);

    var iterDate = new Date();
    iterDate.setTime(this.value.getTime());
    iterDate.setDate(1);
    iterDate.setDate(0 - iterDate.getDay());

    var tbody = [ 'tbody' ];
    var $this = this;
    var currRow;
    for (var i = 0; i < 42; i++) {
        iterDate.setDate(iterDate.getDate() + 1);
        var cell = [ 'td' ];
        if (i % 7 == 0) {
            currRow = [ 'tr' ];
            tbody.push(currRow);
        }
        currRow.push(cell);

        if (iterDate.getMonth() == this.value.getMonth()) {
            var cellDate = new Date();
            cellDate.setTime(iterDate.getTime());

            if (this.selected && (cellDate.getTime() == this.selected.date.getTime())) {
                cell[1] = { 'class' : 'ku-day-selected' };
            } else if (i % 7 == 0) {
                cell[1] = { 'class' : 'ku-day-sunday' };
            } else {
                cell[1] = { };
            }
            cell[1].onclick = function() { $this.selectDate(this.date, this) };
            cell[1].date = cellDate;
            cell[2] = [ 'a', { 'href' : 'javascript:void(0)' }, iterDate.getDate() ];
        }
        else {
            var click = (i < 7)
                ? function() { $this.setPrevMonth() }
                : function() { $this.setNextMonth() };
            cell[1] = { 'class' : 'ku-day-disabled', 'onclick' : click };
            cell[2] = iterDate.getDate();
        }
    }

    return ku.view.make(
        [ 'table', {
            'class' : 'ku-calendar-body', 'border' : '0',
            'cellPadding' : '0', 'cellSpacing' : '0' },
            thead, tbody
        ]
    );
};

def.update = function() {
    var date = this.value;
    var invalid = this.calendar;
    this.calendar = this.renderCalendar();
    if (invalid) {
        invalid.parentNode.replaceChild(this.calendar, invalid);
    } else {
        this.element.appendChild(this.calendar);
    }
    this.monthLabelCell.innerHTML = this.mname[date.getMonth()];
    this.yearInput.setValue(date.getFullYear(), true);
};

def.setDate = function(date, quiet) {
    if (typeof date == 'undefined') date = new Date();
    this.value = date;
    this.update();
    if (!quiet) this.notifyObservers('onDateSelected', { date : date });
};

def.setPrevMonth = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setMonth(d.getMonth() - 1);
    this.setDate(d, true);
};

def.setNextMonth = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setMonth(d.getMonth() + 1);
    this.setDate(d, true);
};

def.setPrevYear = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(d.getFullYear() - 1);
    this.setDate(d, true);
};

def.setNextYear = function() {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(d.getFullYear() + 1);
    this.setDate(d, true);
};

def.setYear = function(y) {
    var d = new Date();
    d.setTime(this.value.getTime());
    d.setFullYear(y);
    this.setDate(d, true);
};

def.selectDate = function(date, cell) {
    if (this.selected) this.selected.className = '';
    this.selected = cell;
    cell.className = 'ku-day-selected';
    this.value = date;
    this.notifyObservers('onDateSelected', { date : date });
};

def.setDateSelected = function(date) {
    this.setDate(date, true);
    this.selectDate(date, this.getCellFromDate(date));
};

def.isSameDate = function(a, b) {
    return (
        a.getFullYear() == b.getFullYear() &&
        a.getMonth() == b.getMonth() &&
        a.getDate() == b.getDate()
    );
};

def.getCellFromDate = function(date) {
    var cells = ku.query(this.calendar).$('..td');
    for (var x = 0; x < cells.length; x++) {
        if (cells[x].date && this.isSameDate(cells[x].date, date)) {
            return cells[x];
        }
    }
    return null;
};

def.clearDate = function() {
    if (this.selected) {
        this.selected.className = '';
        this.selected = null;
    }
    this.notifyObservers('onDateCleared');
};

//=========================================================================
// ku.form.DateInput
//=========================================================================
ku.form.DateInput = function(node) {
    ku.form.Element.call(this, node);
};
ku.form.DateInput.is(ku.form.Element);
def = ku.form.DateInput.prototype;

def.render = function() {
    var outer = this.renderOuter();
    this.calendar = new ku.form.Calendar(outer.lastChild);

    this.calendar.element.style.zIndex = String(++ku.TOP_Z_INDEX);
    this.calendar.addObserver(this);

    ku.event.addListener(this.calendar.element, 'click', function(ev) {
        ku.event(ev).stopPropagation();
    });
    var $this = this;
    this.element.onfocus = function() {
        $this.showCalendar();
        this.blur();
    };
    this.element.size = 10;
    this.outer = outer;
    this.element.parentNode.replaceChild(this.outer, this.element);
    this.outer.insertBefore(this.element, this.outer.firstChild);
};

def.renderOuter = function() {
    var $this = this;
    return ku.view.make(
        [ 'span', {
            onclick : function() { $this.showCalendar() } },
            [ 'span', {
                'style' : 'display:none;position:absolute;'
            } ]
        ]
    );
};

def.showCalendar = function() {
    this.calendar.element.style.display = '';
};

def.setDate = function(date) {
    if (date) {
        this.calendar.setDateSelected(date);
    } else {
        this.calendar.setDateSelected(new Date);
    }
};

def.onDateSelected = function(cal, data) {
    var Y = data.date.getFullYear();
    var M = data.date.getMonth()+1;
    var D = data.date.getDate();
    this.element.value = ku.util.sprintf('%4d-%02d-%02d', Y, M, D);
    this.calendar.element.style.display = 'none';
    this.notifyObservers('onValueChanged', { date : data.date });
};

def.onDateCleared = function() {
    this.element.value = '';
    this.calendar.element.style.display = 'none';
    this.notifyObservers('onValueChanged', { date : null });
};

//=========================================================================
// ku.form.RangeInput
//=========================================================================
ku.form.RangeInput = function(node) {
    ku.form.Element.call(this, node);
};

ku.form.RangeInput.is(ku.form.Element);
def = ku.form.RangeInput.prototype;

def.render = function() {
    this.width = 160;
    this.max   = parseInt(this.options['max'] || '100');
    this.min   = parseInt(this.options['min'] || '0');
    this.step  = parseInt(this.options['step'] || '1');
    this.range = this.max - this.min;
    this.thumbWidth = 8;

    this.steps = (this.range/this.step) / 10;

    var block = (
        [ 'div', {
            'class' : 'ku-range-input',
            'style' : 'position:relative;',
            onselectstart : function() { return false }
        }, [ 'div', { 'class' : 'ku-range-rule' } ] ]
    );

    // create the ticks
    for (var x = 0; x <= this.steps; x++) {
        var style = 'width:1px;height:3px;background:black;left:'+(
            (this.thumbWidth +
                (x * ((this.width - (this.thumbWidth * 2)) / this.steps))
            )+'px'
        )+';position:absolute;font-size:0px;top:10px;';

        block.push([ 'div', { 'style' : style } ]);
    }

    // thumb button
    var thumb = this.thumb = ku.view.make(
        ['div', {
            'class' : 'ku-thumb',
            'style' : (
                'width:8px;height:16px;border: 2px outset buttonface;'+
                'background:buttonface;position:absolute;'+
                'top:0px;left:0px;font-size:1px;'
            )
        } ]
    );

    block.push(this.thumb);
    block.push(this.element);

    var outer = this.outer = ku.view.make(block);
    this.element.style.display = 'none';

    this.marker.parentNode.replaceChild(outer, this.marker);

    var $this = this;
    thumb.onmousedown = function(e) {
        e = ku.event(e);
        e.stopPropagation();
        e.preventDefault();
        var xo = e.clientX;
        var sd = xo - parseInt(thumb.style.left);

        thumb.style.borderStyle = 'inset';
        outer.onmousemove = function(ev) {
            ev = ku.event(ev);
            ev.stopPropagation();
            ev.preventDefault();
            var x = ev.clientX - sd;
            if (x >= 0 && x <= ($this.width - $this.thumbWidth)) {
                var i = ($this.width-$this.thumbWidth)/($this.range/$this.step);
                if ((x % i) >= (i / 2)) {
                    x = (x + (i - (x % i)));
                } else {
                    x = (x - (x % i));
                }
                $this.setValue((x / i) * $this.step);
            }
        };
        outer.onmouseup = function() {
            thumb.style.borderStyle = 'outset';
            outer.onmousemove = null;
            ku.event.removeListener(
                document.body, 'mouseup', arguments.callee
            );
        };

        ku.event.addListener(document, 'mouseup', outer.onmouseup);
    }
};

def.setValue = function(x) {
    if (typeof x == 'string') x = parseInt(x);
    x = Math.floor(x);
    if (this.element.value == x) return;
    this.element.value = x;
    var i = (this.width - this.thumbWidth) / (this.range / this.step);
    if ((x % i) >= (i / 2)) {
        x = (x + (i - (x % i)));
    } else {
        x = (x - (x % i));
    }
    this.thumb.style.left = ((x * i) / this.step)+'px';
    if (this.nagle) {
        if (this.timer) window.clearTimeout(this.timer);
        var $this = this;
        this.timer = window.setTimeout(function() {
            $this.notifyObservers('onValueChanged');
        }, this.nagle);
    } else {
        this.notifyObservers('onValueChanged');
    }
};

//========================================================================
// ku.form.TimeInput
//========================================================================
ku.form.TimeInput = function(node) {
    ku.form.Element.call(this, node);
};

ku.form.TimeInput.is(ku.form.Element);
def = ku.form.TimeInput.prototype;

def.render = function() {
    this.numInput = new ku.form.NumberInput(this.element);
    this.blank = ':';

    var btnUp = this.numInput.incrButton;
    var btnDn = this.numInput.decrButton;

    var step = this.options['step'];
    var size = 5;
    var format = '%02d:%02d';
    if (step) {
        var num = parseFloat(step);
        if (num < 60 && num >= 1) {
            size = 8;
            this.blank = ':  :';
            format = '%02d:%02d:%02d';
        } else if (num < 1) {
            size = 11;
            this.blank = ':  :  .';
            format = '%02d:%02d:%02d.%03d';
        }
    }
    this.format = format;
    var rx = this.rx = ku.util.regexp.time;

    var $this = this;
    this.element.onmouseup = function() { $this.saveCaretPos() }

    btnUp.onmousedown = function() { $this.incrValue(); };
    btnDn.onmousedown = function() { $this.decrValue(); };

    this.element.onkeypress = function(e) {
        e = ku.event(e);
        if (e.keyCode == 38) {
            $this.saveCaretPos();
            $this.incrValue();
            $this.loadCaretPos();
        } else if (e.keyCode == 40) {
            $this.saveCaretPos();
            $this.decrValue();
            $this.loadCaretPos();
        }
    };

    this.element.size = size;
    this.element.style.textAlign = 'center';
    this.element.onchange = function() {
        if (rx.test(this.value)) {
            this.time.setTime(this.str2time(this.value));
        } else {
            this.time.setHours(0);
            this.time.setMinutes(0);
            this.time.setSeconds(0);
            this.time.setMilliseconds(0);
        }
        var h = this.time.getHours();
        var m = this.time.getMinutes();
        var s = this.time.getSeconds();
        var ms = this.time.getMilliseconds();
        this.value = ku.util.sprintf(format, h, m, s, ms);
        $this.notifyObservers('onValueChanged', { time : this.time });
    };

    var time = new Date();
    btnUp.time = time;
    btnDn.time = time;
    this.element.time = time;
    this.time  = time;

    if (!this.element.value) this.element.value = this.blank;
};

def.saveCaretPos = function() {
    if (typeof this.element.selectionStart == 'undefined') {
        var range = document.selection.createRange();
        var bookmark = range.getBookmark();
        this._caretBM = bookmark;
        this.caretPos = bookmark.charCodeAt(2) - 2;
    } else {
        this.caretPos = this.element.selectionStart;
    }
};
def.loadCaretPos = function() {
    if (this._caretBM) {
        // XXX - figure out how to do this for IE
    } else {
        this.element.selectionStart = this.element.selectionEnd = this.caretPos;
    }
};
def.incrValue = function() {
    var step = parseFloat(this.options['step'] || '60');
    var k = step;
    if (!this.caretPos || this.caretPos < 3) {
        k = (step * 1000 > 3600000) ? step * 1000 : 3600000;
    } else if (this.caretPos >= 3 && this.caretPos < 6) {
        k = (step * 1000 > 60000) ? step * 1000 : 60000;
    } else if (this.caretPos >= 6 && this.caretPos < 9) {
        k = (step * 1000 > 1000) ? step * 1000 : 1000;
    } else {
        k = (step * 1000 > 1) ? step * 1000 : 1;
    }
    if (this.element.value == this.blank || this.element.value == '') {
        this.time.setHours(0);
        this.time.setMinutes(0);
        this.time.setSeconds(0);
        this.time.setMilliseconds(0);
    } else {
        this.time.setTime(this.time.getTime() + k);
    }
    var h = this.time.getHours();
    var m = this.time.getMinutes();
    var s = this.time.getSeconds();
    var ms = this.time.getMilliseconds();
    this.element.value = ku.util.sprintf(this.format, h, m, s, ms);

    if (this.nagle) {
        if (this.timer) self.clearTimeout(this.timer);
        var $this = this;
        this.timer = self.setTimeout(function() {
            $this.notifyObservers('onValueChanged', { time : $this.time });
        }, this.nagle);
    } else {
        this.notifyObservers('onValueChanged', { time : this.time });
    }
};

def.decrValue = function() {
    var step = parseFloat(this.options['step'] || '60');
    var k = step;
    if (!this.caretPos || this.caretPos < 3) {
        k = (step * 1000 > 3600000) ? step * 1000 : 3600000;
    } else if (this.caretPos >= 3 && this.caretPos < 6) {
        k = (step * 1000 > 60000) ? step * 1000 : 60000;
    } else if (this.caretPos >= 6 && this.caretPos < 9) {
        k = (step * 1000 > 1000) ? step * 1000 : 1000;
    } else {
        k = (step * 1000 > 1) ? step * 1000 : 1;
    }
    if (this.element.value == this.blank || this.element.value == '') {
        this.time.setHours(0);
        this.time.setMinutes(0);
        this.time.setSeconds(0);
        this.time.setMilliseconds(0);
    } else {
        this.time.setTime(this.time.getTime() - k);
    }
    var h = this.time.getHours();
    var m = this.time.getMinutes();
    var s = this.time.getSeconds();
    var ms = this.time.getMilliseconds();
    this.element.value = ku.util.sprintf(this.format, h, m, s, ms);

    if (this.nagle) {
        if (this.timer) self.clearTimeout(this.timer);
        var $this = this;
        this.timer = self.setTimeout(function() {
            $this.notifyObservers('onValueChanged', { time : $this.time });
        }, this.nagle);
    } else {
        this.notifyObservers('onValueChanged', { time : this.time });
    }
};

def.setValue = function(v) {
    this.time.setTime(this.str2time(v));
    var h = this.time.getHours();
    var m = this.time.getMinutes();
    var s = this.time.getSeconds();
    var ms = this.time.getMilliseconds();
    this.element.value = ku.util.sprintf(this.format, h, m, s, ms);
};

def.getValue = function() { return this.time };

def.str2time = function(v) {
    var t = new Date();
    var m = v.match(ku.util.regexp.time);
    if (m) {
        t.setHours(m[1]);
        t.setMinutes(m[2]);
        if (m[3]) {
            t.setSeconds(m[3]);
            if (m[4]) {
                t.setMilliseconds(m[4]);
            } else {
                t.setMilliseconds(0);
            }
        } else {
            t.setSeconds(0);
        }
    } else {
        return 0;
    }
    return t.getTime();
};

//========================================================================
// ku.form.DateTimeInput
//========================================================================
ku.form.DateTimeInput = function(node) {
    ku.form.Element.call(this, node);
};

ku.form.DateTimeInput.is(ku.form.Element);
def = ku.form.DateTimeInput.prototype;

def.render = function() {
    this.element.style.display = 'none';
    var outer = ku.view.make(
        ['table', {
            'cellPadding' : 0, cellSpacing : 0, border : 0 },
            ['tbody' ['tr', ['td'], ['td'] ] ]
        ]
    );

    this.dateInp = document.createElement('input');
    this.timeInp = document.createElement('input');
    outer.rows[0].cells[0].appendChild(this.dateInp);
    outer.rows[0].cells[1].appendChild(this.timeInp);

    this.dateObj = new ku.form.DateInput(this.dateInp);
    this.timeObj = new ku.form.TimeInput(this.timeInp);

    this.dateObj.addObserver(this);
    this.timeObj.addObserver(this);

    this.element.parentNode.insertBefore(outer, this.element);
};

def.onValueChanged = function(obj, data) {
    var quiet = false;
    if (typeof data.date != 'undefined') {
        if (this.timeInp.value == ':') {
            this.timeObj.setValue('12:00');
            quiet = true;
        }
        this.date = data.date;
    } else {
        if (this.dateInp.value == '') {
            this.dateObj.setDate();
            quiet = true;
        }
        this.time = data.time;
    }
    this.element.value = this.dateInp.value+'T'+this.timeInp.value;
    if (!quiet) this.notifyObservers('onValueChanged', { value : this.value });
};


//========================================================================
// ku.form.EnumInput
//========================================================================
ku.form.EnumInput = function(node) {
    ku.form.Element.call(this, node); 
};
ku.form.EnumInput.is(ku.form.Element);
def = ku.form.EnumInput.prototype;

def.render = function() {
    var values = this.options['values'].split(' ');
    var labels = this.options['labels'];
    if (labels) {
        labels = labels.split(' ');
    } else {
        labels = values;
    }
    var group = [ 'span', { 'class' : 'ku-enum-input' } ];
    var gid = ku.ui.genid();
    for (var x = 0; x < values.length; x++) {
        group.push(
        [ 'span', { 'class' : 'ku-enum-item' },
            [ 'input', {
                'type' : 'radio', 'name' : gid, 'value': values[x]
            } ],
            [ 'span', { 'class' : 'ku-enum-text' }, labels[x] ]
        ] );
    }
    var outer = ku.view.make(group);
    var elmts = ku.query(outer).$('..input');
    var $this = this;
    for (var x = 0; x < elmts.length; x++) {
        elmts[x].onchange = function() {
            $this.setValue(this.value);
        }
    }
    this.element.parentNode.replaceChild(outer, this.element);
    this.element.style.display = 'none';
    outer.appendChild(this.element);
};

def.setValue = function(value) {
    this.element.value = value;
    this.notifyObservers('onValueChanged', this.element.value);
};

//========================================================================
// ku.form.UrlInput
//========================================================================
ku.form.UrlInput = function(node) {
    ku.form.Element.call(this, node);
    this.pattern = ku.util.regexp.url;
    this.element.onFormSubmit = function() {
        if (!ku.util.regexp.url.test(this.value)) {
            throw new ku.form.ValidationError("not a URL", this);
        } else {
            ku.util.removeClassName(this, 'ku-validation-error');
        }
    };
    var $this = this;
    this.element.onkeyup = function() {
        $this.setValue(this.value);
    }
};

ku.form.UrlInput.is(ku.form.Element);
def = ku.form.UrlInput.prototype;

def.render = function() { };

def.setValue = function(value, quiet) {
    if (this.pattern.test(value)) {
        ku.util.removeClassName(this.element, 'ku-validation-error');
        this.element.value = value;
    } else {
        ku.util.addClassName(this.element, 'ku-validation-error');
    }
};
 
//========================================================================
// ku.form.EmailInput
//========================================================================
ku.form.EmailInput = function(node) {
    ku.form.Element.call(this, node);
    this.pattern = ku.util.regexp.email;
    this.element.onFormSubmit = function() {
        if (!ku.util.regexp.url.test(this.value)) {
            throw new ku.form.ValidationError("not a URL", this);
        } else {
            ku.util.removeClassName(this, 'ku-validation-error');
        }
    };
    var $this = this;
    this.element.onkeyup = function() {
        $this.setValue(this.value);
    }
};

ku.form.EmailInput.is(ku.form.Element);
def = ku.form.EmailInput.prototype;

def.render = function() { };

def.setValue = function(value, quiet) {
    if (this.pattern.test(value)) {
        ku.util.removeClassName(this.element, 'ku-validation-error');
        this.element.value = value;
    } else {
        ku.util.addClassName(this.element, 'ku-validation-error');
    }
};
 
//========================================================================
// ku.form.BooleanInput
//========================================================================
ku.form.BooleanInput = function(node) {
    ku.form.Element.call(this, node);
};

ku.form.BooleanInput.is(ku.form.Element);
def = ku.form.BooleanInput.prototype;

def.render = function() {
    this.element.type = 'checkbox';
    this.element.setAttribute('type', 'checkbox');
    if (this.options['value'] == 'true' || this.options['value'] == '1') {
        this.element.checked = true;
    } else {
        this.element.checked = false;
    }
    var $this = this;
    this.element.onchange = function() {
        $this.setValue(this.checked);
    };
};

def.getValue = function() {
    return this.element.checked ? 1 : 0;
};
def.setValue = function(v) {
    this.element.checked = v ? true : false;
    this.element.value = v ? 1 : 0;
    this.notifyObservers('onValueChanged', this.checked);
};


ku.event.addListener(self, 'load', function() {
    var forms = ku.query(document.body).select('..form');
    for (var x = 0; x < forms.length; x++) {
        new ku.form.Form(forms[x]);
    }
});

