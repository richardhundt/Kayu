ku.module('ku.ui.RangeInput');

ku.ui.RangeInput = function(nid) {
    var $this = ku.get(nid);
    return ku.bless($this, arguments.callee);
};

ku.is(ku.ui.RangeInput, ku.ui.Component);
