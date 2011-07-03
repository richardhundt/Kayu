ku.module("ku.iframe");

ku.require('ku.util');
ku.require('ku.useragent');

ku.iframe = function(initObj) { return new ku.iframe.Object(initObj) };

ku.iframe.Object = function(initObj) {
    var $this = document.createElement('iframe');
    ku.bless($this, arguments.callee);
    $this.init( initObj );
    return $this;
};

ku.is(ku.iframe.Object, ku.util.Observable);

def = ku.iframe.Object.prototype;

def.init = function(initObj) {
    if (initObj) {
        for (var x in initObj) {
            try {
                this[x] = initObj[x];
            } catch (ex) {
                throw 'failed to set property `'+x+"' on iframe:"+ex.message;
            }
        }
    }
    if (!this.name) this.name = ku.util.genuid();
    this.src = ku.userAgent.is_opera ? 'opera:blank' : 'about:blank';
    this.createHandlers();
};

def.load = function(url) {
    if (!this._handler) this.createHandlers();
    this.getDocument().location = url;
};

def.getDocument = function() {
    return this.contentWindow
        ? this.contentWindow.document
        : this.contentDocument;
};

def.createHandlers = function() {
    if (this._handlers) return;
    if (ku.userAgent.is_ie) {
	this._handler = ku.delegate(this, function() {
	    if (this.readyState == 'complete') {
		this.notifyObservers('load', { context : this.getDocument() });
	    }
	});
	this.onreadystatechange = this._handler;
    }
    else {
	this._handler = ku.delegate(this, function() {
            this.notifyObservers('load', { context : this.getDocument() });
	});
        this.onload = this._handler;
    }
};

