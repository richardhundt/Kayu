ku.module('ku.ajax.Request');

ku.ajax.Request = function(type, node, args) {
    this.type = type;
    this.node = ku.get(node);
    this.args = args;
};

def = ku.ajax.Request.prototype;
def.send = function() {

};

def.effect = function(type) {

};

def.on = function(nid) {

};

// ku.ajax.request(node).effect('wait').on(node).send(data)
// ku.ajax.click(node).wait
