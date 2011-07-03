ku.module('ku.broker');

ku.require('ku.useragent');

ku.broker = function() {
    return new ku.broker.Object;
    if (ku.broker.instance) return ku.broker.instance;
    ku.broker.instance = this;
    return ku.broker.instance;
};

ku.broker.GEN = 1;
ku.broker.Object = function() {
    var d = document.createElement('div');
    this.name = 'ku-broker';

    d.innerHTML = '<iframe src="about:blank" '
        +'style="position:absolute;top:-20px;height:0px" '
        +'name="'+this.name+'" id="'+this.name+'"></iframe>';

    var frame = d.firstChild;
    document.body.appendChild(frame);

    var $this = this;
    if (ku.userAgent.is_ie) {
        frame.onreadystatechange = function() {
            if (frame.readyState == 'complete') {
                if (typeof $this.onload == 'function') $this.onload();
                $this.remove();
            }
        };
    } else {
        frame.onload = function() {
            if (typeof $this.onload == 'function') $this.onload();
            $this.remove();
        };
    }

    this.frame = frame;
    this.getDocument = function() {
        return $this.frame.contentWindow
            ? $this.frame.contentWindow.document
            : $this.frame.contentDocument;
    };

    this.remove = function() {
        // give it a timeslice here to allow the load event to finish propagating
        self.setTimeout(function() { frame.parentNode.removeChild(frame) }, 1);
    };
};
