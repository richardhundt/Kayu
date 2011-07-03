ku.module('ku.task');

ku.require('ku.util');
ku.require('ku.useragent');

ku.task.INITIAL  = 0;
ku.task.WAITING  = 1;
ku.task.COMPLETE = 2;
ku.task.CANCELED = 3;
ku.task.create     = function(spec) { return new ku.task.Task(spec) };
ku.task.createList = function(spec) { return new ku.task.TaskList() };

ku.task.Task = function(spec) {
    this.spec = spec;
    this.readyState = 0;
};

ku.task.Task.is(ku.util.Observable);

def = ku.task.Task.prototype;

def.complete = function(data) {
    if (this.readyState >= ku.task.COMPLETE) return;
    this.data = data;
    this.updateReadyState(ku.task.COMPLETE);
};

def.cancel = function() {
    if (this.readyState >= ku.task.CANCELED) return;
    this.updateReadyState(ku.task.CANCELED);
};

def.execute = function() {
    if (this.readyState >= ku.task.WAITING) return;
    this.updateReadyState(ku.task.WAITING);
    if (this.spec instanceof Array) {
        var object = this.spec[0];
        var method = this.spec[1];
        object[method](this);
    }
    else if (typeof this.spec == 'function') {
        this.spec(this);
    }
    else {
        throw 'ku.task.Task.execute unhandled spec type: '+this.spec;
    }
};

def.updateReadyState = function(state) {
    this.readyState = state;
    this.notifyObservers('readyStateChange', {
        task : this, readyState : state
    });
};


ku.task.TaskList = function() {
    this.readyState = 0;
    this.tasks = [ ];
    this.COUNT = 0;
};

ku.task.TaskList.does(ku.task.Task);
def = ku.task.TaskList.prototype;

def.execute = function() {
    if (this.readyState >= ku.task.WAITING) return;
    this.updateReadyState(ku.task.WAITING);
    while (this.tasks.length) {
        this.owner.add(this.tasks.shift());
    }
};

def.add = function(task) {
    this.COUNT++;
    this.tasks.push(task);
    task.addObserver("readyStateChange", this);
};

def.handleSignal = function(sig) {
    if (sig.readyState < ku.task.COMPLETE) return;
    this.COUNT--;
    if (this.COUNT == 0) this.complete();
};


ku.task.TaskLoop = function() {
    this.queue = [ ];
    this.COUNT = 0;
};

ku.task.TaskLoop.is(ku.util.Observable);

def = ku.task.TaskLoop.prototype;

def.add = function(task) {
    if (typeof task == "function") task = new ku.task.Task(task);

    task.index = this.queue.length;
    task.owner = this;
    this.COUNT++;

    this.queue.push(task);

    task.addObserver("readyStateChange", function(sig) {
        var loop = sig.target.owner;
        if (sig.readyState >= ku.task.COMPLETE) {
            loop.COUNT--;
            if (loop.COUNT == 0) loop.setIdle(true);
        }
    });
    this.notifyObservers('taskAdd',{ task : task });
};

def.start = function(max, min) {
    if (typeof min == "undefined") min = ku.userAgent.is_khtml ? 0 : 1;
    this.max = max;
    this.min = min;
    var func = function() { arguments.callee.target.oneTask() };
    func.target = this;
    this.func = func;
    this.ID = window.setInterval(func, this.max);
};

def.sweep = function() {
    while (this.queue.length) this.oneTask();
};

def.oneTask = function() {
    if (this.paused) return;
    if (this.queue.length) {
        this.setIdle(false);
        var task = this.queue.shift();
        task.execute();
        this.notifyObservers('taskExecute', { task : task });
    }
};

def.setIdle = function(idle) {
    if (this.idle === idle) return;
    this.idle = idle;
    this.notifyObservers('idleStateChange', { idleState : idle });
    if (!idle) {
        window.clearInterval(this.ID);
        this.ID = window.setInterval(this.func, this.min);
    } else {
        window.clearInterval(this.ID);
        this.ID = window.setInterval(this.func, this.max);
    }
};

def.stop   = function() { window.clearInterval(this.ID) };
def.pause  = function() { this.paused = true };
def.resume = function() { this.paused = false };
def.count  = function() { return this.COUNT };
