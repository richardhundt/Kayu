ku.module('ku.test.TestRunner');

ku.require('ku.task');
ku.require('ku.test.TestCase');
ku.require('ku.test.Failure');

ku.test.TestRunner = function(body) {
    if (arguments.callee.instance) {
        return arguments.callee.instance;
    } else {
        arguments.callee.instance = this;
        this.tests = [ ];
        this.index = { };
        this.init(body);
    }
};

window.onerror = function(msg) {
    if (/\[([^]]+)\]:/.test(msg)) {
        var index = RegExp.$1;
        var test = ku.test.TestRunner.instance.index[index];
        test.fail();
        return true;
    }
};

def = ku.test.TestRunner.prototype;

def.init = function(body) {
    this.loop = new ku.task.TaskLoop;
    this.loop.start(100, 50);

    this.table = document.createElement("table");
    this.table.appendChild(document.createElement("tbody"));
    this.table.cellPadding = 4;

    if (!body) body = document.body;

    var runBtn = document.createElement("button");
    runBtn.onclick = ku.delegate(this, this.run);
    runBtn.appendChild(document.createTextNode("Run"));

    var stpBtn = document.createElement("button");
    stpBtn.onclick = ku.delegate(this, this.step);
    stpBtn.appendChild(document.createTextNode("Step"));

    var skpBtn = document.createElement("button");
    skpBtn.onclick = ku.delegate(this, this.skip);
    skpBtn.appendChild(document.createTextNode("Skip"));

    var rstBtn = document.createElement("button");
    rstBtn.onclick = ku.delegate(this, this.reset);
    rstBtn.appendChild(document.createTextNode("Reset"));

    body.appendChild(runBtn);
    body.appendChild(stpBtn);
    body.appendChild(skpBtn);
    body.appendChild(rstBtn);
    body.appendChild(this.table);

    this.counter = 0;
};

def.add = function(desc, test) {
    if (typeof test == 'function') {
        test = new ku.test.TestCase(test);
    } else if (!(test instanceof ku.test.TestCase)) {
        throw new Error("test: "+test
            +" is not a function nor an instance of ku.test.TestCase");
    }
    if (desc) {
        test.id = desc;
    } else if (!test.id) {
        test.id = this.tests.length;
    }

    this.index[test.id] = test;

    test.runner = this;
    this.tests.push(test);

    var tr = this.table.insertRow(this.table.rows.length);
    tr.style.background = "ButtonFace";
    test.row = tr;

    var td = tr.insertCell(0);
    var a = document.createElement("a");
    a.setAttribute("href", "javascript:void(0)");
    a.appendChild(document.createTextNode("source"));
    a.row = tr;
    a.onclick = function() {
        this.showing = !this.showing;
        if (this.showing) {
            var sourceRow = document.createElement("tr");
            if (this.row.nextSibling) {
                this.row.parentNode.insertBefore(
                    sourceRow, this.row.nextSibling
                );
            } else {
                this.row.parentNode.appendChild(sourceRow);
            }
            var sourceCell = sourceRow.insertCell(0);
            sourceCell.setAttribute("colspan", "2");
            sourceCell.style.whiteSpace = "pre";
            sourceCell.innerHTML = ku.util.entityfy(test.toString());
            this.sourceRow = sourceRow;
        } else {
            this.sourceRow.parentNode.removeChild(this.sourceRow);
        }
    };
    td.appendChild(a);

    td = tr.insertCell(1);
    td.innerHTML = test.id;
};

def.run = function() {
    this.reset();
    var $this = this;
    for (var x = 0; x < this.tests.length; x++) {
        this.loop.add(function() { $this.step() });
    }
};

def.step = function() {
    if (this.paused) return this.loop.add(ku.delegate(this, this.step));
    if (this.counter >= this.tests.length) this.reset();
    var test = this.tests[this.counter++];
    test.exec();
};

def.reset = function() {
    this.counter = 0;
    for (var x = 0; x < this.tests.length; x++) this.tests[x].reset();
};

def.skip = function() {
    if (this.counter >= this.tests.length) this.reset();
    var x = this.counter++;
    var row = this.tests[x].row;
    row.style.background = "yellow";
    row.cells[1].innerHTML = "[skipped] "+this.tests[x].id;
};

def.pause = function() {
    this.paused = true;
    this.loop.pause();
};

def.resume = function() {
    this.paused = false;
    this.loop.resume();
};
