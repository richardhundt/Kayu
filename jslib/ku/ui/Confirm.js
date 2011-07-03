ku.module('ku.ui.Confirm');
ku.ui.Confirm = function(mesg, func) {
    func(confirm(mesg));
};
