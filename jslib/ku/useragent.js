ku.module('ku.useragent');

ku.userAgent = new Object;

switch (navigator.appName) {
    case 'Netscape':
        if (navigator.userAgent.toLowerCase().indexOf('safari') != -1) {
            ku.userAgent.is_safari = true;
        } else {
            ku.userAgent.is_moz = true;
        }
        break;
    case 'Konqueror':
        ku.userAgent.is_konq = true;
        break;
    case 'Safari':
        ku.userAgent.is_safari = true;
        break;
    case 'Microsoft Internet Explorer':
        ku.userAgent.is_ie = true;
        break;
    case 'Opera':
        ku.userAgent.is_opera = true;
        break;
    default:
        ku.userAgent.is_other = true;
}

ku.userAgent.canInnerHTMLScript = function() {
    if (typeof this._canInnerHTMLScript != 'undefined') {
        return this._canInnerHTMLScript;
    }
    var s = '<script type="text/javascript">ku.userAgent.test = true</script>';
    var t = document.createElement('span');
    t.innerHTML = s;
    document.body.appendChild(t);
    if (ku.userAgent.test) {
        this._canInnerHTMLScript = true;
        delete ku.userAgent.test;
    }
    document.body.removeChild(t);
};
