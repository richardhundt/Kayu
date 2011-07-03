ku.module('ku.session');

ku.event.addListener(window, 'load', function() {
    var meta = ku.get('ku-session-keeper');
    var ival = meta.getAttribute('content');
    var keep = document.createElement('img');

    keep.style.width = '0px';
    keep.style.height = '0px';
    keep.style.position = 'absolute';
    keep.style.top = '-20px';

    document.body.appendChild(keep);

    self.setInterval(function() {
        keep.src = "?_k="+(new Date).getTime();
    }, ival * 1000);
});

