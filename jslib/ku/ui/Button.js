ku.module('ku.ui.Button');

ku.require('ku.ui.Component');

ku.ui.Button = function() {
    return 'ku.ui.Button';
};

ku.ui.Button.is(ku.ui.Component);

def = ku.ui.Button.prototype;

def.className = 'ku-button';

def.init = function() {
    //ku.debug('init');
    ku.event.addListener(this, 'mouseover', function() {
        ku.util.addClassName(this, 'over');
    });
    ku.event.addListener(this, 'mouseout', function() {
        ku.util.removeClassName(this, 'over');
    });
};

def.set_label = function(label) {
    ku.query(this).select('..a').item(0).innerHTML = label;
};

