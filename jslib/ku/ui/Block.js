ku.module('ku.ui.Block');

ku.ui.Block = function(nid) {
    var node = ku.get(nid);
    ku.bless(node, arguments.callee);
};

