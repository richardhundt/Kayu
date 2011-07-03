ku.module('ku.test.Failure');
ku.test.Failure = function(test, message) {
    this.message = message || '';
    this.test = test;
};
ku.test.Failure.is(Error);

def = ku.test.Failure.prototype;
def.toString = function() {
    return "["+this.test.id+"]: "+this.message;
};
