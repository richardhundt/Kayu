module('px.core.Resizable');

require('px.core.Observable');

px.resize = { };

px.resize.enable = function(node) {
    var doc = node.ownerDocument;

    var frame = doc.createElement('div');
    frame.style.position = 'absolute';
    frame.style.outline = '1px dotted black';
    frame.className = 'px-resize-frame';

    if (!node.isObservable) px.core.Observable.bless(node);

    var positions = [
        ['top','left','NW'],
        ['top','right','NE'],
        ['bottom','right','SE'],
        ['bottom','left','SW']
    ];

    var click, move, up, down, cancel, movedlg;

    up = function() {
        frame.style.background = '';
        px.util.setOpacity(frame, 100);
        node.style.width = frame.offsetWidth+'px';
        node.style.height = frame.offsetHeight+'px';

        px.event.removeListener(doc.body,'mousemove', movedlg);
        px.event.removeListener(doc.body, 'mouseup', up);

        px.resize.resizing = false;
        frame.parentNode.removeChild(frame);
        node.notifyObservers('resize');
        click(); // reactivate the frame
    };

    var constr = node.getAttribute('constrain') == 'true';
    move = function(e) {
        e = px.event(e);
        e.preventDefault();

        if (e.ctrlKey) constr = true;

        px.resize.resizing = true;
        var dX, dY, oX, oY;
        if (this.cardn == 'SE') {
            dX = (e.clientX - frame.startX);
            dY = (e.clientY - frame.startY);
            oX = 0;
            oY = 0;
        } else if (this.cardn == 'NE') {
            dX = (e.clientX - frame.startX);
            dY = (frame.startY - e.clientY);
            oX = 0;
            oY = -dY;
        } else if (this.cardn == 'NW') {
            dX = (frame.startX - e.clientX);
            dY = (frame.startY - e.clientY);
            oX = -dX;
            oY = -dY;
        } else {
            dX = (frame.startX - e.clientX);
            dY = (e.clientY - frame.startY);
            oX = -dX;
            oY = 0;
        }
        var w, h, t, r;
        if (constr) {
            w = frame.startW + dX;
            h = frame.startH + dY;
            r = frame.startW / frame.startH;
            if (w / r > h) {
                t = h;
                h = w / r;
                if (this.cardn.charAt(0) == 'N') oY -= h - t;
            } else if (r * h > w) {
                t = w;
                w = r * h;
                if (this.cardn.charAt(1) == 'W') oX -= w - t;
            }
        } else {
            w = frame.startW + dX;
            h = frame.startH + dY;
        }
        frame.style.width  = w + 'px';
        frame.style.height = h + 'px';
        frame.style.top  = (node.offsetTop + oY)+'px';
        frame.style.left = (node.offsetLeft + oX)+'px';
    };

    down = function(e) {
        px.resize.resizing = false;
        px.event.removeListener(doc.body, 'mousemove', movedlg);
        e = px.event(e);
        e.stopPropagation();
        e.preventDefault();
        frame.startX = e.clientX;
        frame.startY = e.clientY;
        frame.startW = node.offsetWidth;
        frame.startH = node.offsetHeight;
        frame.style.background = 'cyan';
        px.util.setOpacity(frame, 50);
        px.event.addListener(doc.body, 'mouseup', up);
        movedlg = delegate(this, move);
        px.event.addListener(doc.body, 'mousemove', movedlg);
    };

    for (var x = 0; x < 4; x++) {
        var h = doc.createElement('div');
        h.style.width = '6px';
        h.style.height = '6px';
        h.style.position = 'absolute';
        h.style.background = 'black';
        var p = positions[x];
        h.style[p[0]] = '-6px';
        h.style[p[1]] = '-6px';
        h.cardn = p[2];
        h.onmousedown = down;
        frame.appendChild(h);
    }

    cancel = function(force) {
        if (!force && px.resize.resizing) return;
        if (force) px.resize.resizing = false;
        px.event.removeListener(doc.body, 'mousedown', cancel);
        px.event.removeListener(doc.body, 'mousemove', movedlg);
        if (frame.parentNode) frame.parentNode.removeChild(frame);
        node.notifyObservers('resizeCancel');
    };

    click = delegate(node, function(e) {
        frame.style.width  = this.offsetWidth  + 'px';
        frame.style.height = this.offsetHeight + 'px';
        frame.style.left   = this.offsetLeft   + 'px';
        frame.style.top    = this.offsetTop    + 'px';

        this.parentNode.insertBefore(frame, this);
        px.event.addListener(doc.body, 'mousedown', cancel);
    });

    node.resizeStart  = click;
    node.resizeCancel = cancel;
    px.event.addListener(node, 'click', click);
};

px.resize.disable = function(node) {
    debug('resize.disable: '+node);
    if (node.resizeCancel) node.resizeCancel();
    px.event.removeListener(node, 'click', node.resizeStart);
};
