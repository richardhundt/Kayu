ku.module('ku.test.TestCase');
ku.require('ku.test.Failure');

ku.test.TestCase = function(func) {
    return ku.bless(func, arguments.callee);
};

def = ku.test.TestCase.prototype;
def.assert = function(value, message) {
    if (!Boolean(value)) {
        throw new ku.test.Failure(this, message || '');
    }
};

def.assertEquals = function(a, b, message) {
    if (!Boolean(a == b)) {
        throw new ku.test.Failure(this, (message || '')+" - expected: "+b+", got "+a);
    }
};

def.exec = function() {
    this.row.style.background = "yellow";
    this.row.cells[1].innerHTML = "running...";
    this.executed = true;
    try {
        this.call(this);
    } catch (ex) {
        this.fail(ex);
        return;
    }
    if (!this.waiting) {
        this.pass();
    }
};

def.wait = function() {
    this.waiting = true;
    this.runner.pause();
    this.row.cells[1].innerHTML = 'waiting...';
    var $this = this;
    return function() {
        $this.runner.resume();
        $this.waiting = false;
        $this.pass();
    };
};

def.pass = function() {
    this.runner.resume();
    this.row.style.background = "lime";
    this.row.cells[1].innerHTML = "[passed] "+this.id;
};

def.fail = function(ex) {
    this.runner.resume();
    this.row.cells[1].innerHTML = ku.util.entityfy("[failed] "+this.id+' : '+(ex ? (ex.toString()
        +" - "+(ex.lineNumber ? ex.lineNumber : (ex.line ? ex.line : ' '))) : '<huh?>'));
    this.row.style.background = "red";
};

def.reset = function() {
    this.row.style.background = "ButtonFace";
    this.row.cells[1].innerHTML = this.id;
    this.executed = false;
};

