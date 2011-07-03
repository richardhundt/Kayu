ku.module('ku.ui.Tab');

ku.ui.Tab = function(nid) {
    var node = ku.get(nid);
    ku.event.addListener(node, 'mouseover', function() {
        ku.util.addClass(node, 'over');
    });
    ku.event.addListener(node, 'mouseout', function() {
        ku.util.removeClass(node, 'over');
    });
    return ku.bless(node, arguments.callee);
};

ku.is(ku.ui.Tab, ku.ui.Component);

def = ku.ui.Tab.prototype;

