ku.module('ku.ui.HBox');

ku.ui.HBox = function() {
    return this.render();
}

def = ku.ui.HBox.prototype;

def.render = function() {
    return ku.ui.render(['table', this, ['tbody', ['tr']]]).firstChild;
};

def.insertChild = function(chld) {

};

