ku.module('ku.ui.TabBar');

ku.ui.TabBar = function(nid) {
    var node = ku.get(nid);
    ku.bless(node, arguments.callee);
    node.init();
    return node;
};

ku.is(ku.ui.TabBar, ku.ui.Component);

def = ku.ui.TabBar.prototype;

def.tabs = function() {
    return ku.query(this).elements().filter(function(item) {
        return ku.util.hasClass(item, 'ku-tab');
    });
};

def.select = function(nid) {
    var tab = ku.get(nid);
    var tabs = this.tabs();
    for (var x = 0; x < tabs.length; x++) {
        if (tabs[x] == tab) {
            this.set('selectedIndex', x);
            break;
        }
    }
};

def.set_selectedIndex = function(index) {
    var curr = this.tabs()[this.selectedIndex];
    if (curr) ku.util.removeClass(curr, 'selected');

    var next = this.tabs()[index];
    if (next) ku.util.addClass(next, 'selected');
    if (this.getAttribute('history') == 'enabled') {
        ku.history.add(this, { selectedIndex : index });
    }
    this.selectedIndex = index;
};

def.set_onchange = function(handler) {
    if (typeof handler == 'string') handler = new Function('signal', handler);
    this.addObserver('change', handler);
};
