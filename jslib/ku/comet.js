ku.module('ku.comet');

ku.comet = function() {
    if (!ku.comet.instance) {
        ku.comet.instance = new ku.comet.Object;
    }
    return ku.comet.instance;
};

ku.comet.Object = function() { };
ku.comet.enable = function() { 
    if (ku.comet.enabled) return;
    ku.comet.enabled = true;
    ku.comet().refresh();
}

def = ku.comet.Object.prototype;
def.refresh = function() {
    var req = ku.request();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                (new Function('',req.responseText))();
            } else if (!req.status) {
                throw new Error("ERROR: Comet server went away");
            } else {
                alert("STATUS: "+req.status+", MESSAGE: "+req.responseText);
            }
            ku.comet().refresh();
        }
    };
    req.open('GET','?_p='+(new Date).getTime(),true);
    req.setRequestHeader('X-Kudu-Transport', 'Comet');
    req.send(null);
};

ku.event.addListener(self, 'load', function() {
    ku.comet.enable();
});

