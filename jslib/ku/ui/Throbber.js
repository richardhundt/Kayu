ku.module('ku.ui.Throbber');

ku.ui.Throbber = function(node, mesg) {
    var temp = document.createElement('div');
    temp.className = 'ku-throbber';

    var span = document.createElement('span');
    span.innerHTML = mesg || 'working...';

    temp.appendChild(span);

    this.prnt = node.parentNode;
    this.mesg = mesg;
    this.node = node;
    this.temp = temp;

    this.wait = function(cb) {
        this.node.style.display = 'none';
        this.prnt.insertBefore(this.temp, this.node);
        this.callback = cb || function() { };
        return this;
    };

    this.done = function() {
        this.node.style.display = '';
        this.prnt.removeChild(this.temp);
        this.callback.apply(this.node, [this].concat(arguments));
        return this;
    };
    return this;
};

