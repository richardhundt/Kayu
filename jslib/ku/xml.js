ku.module('ku.xml');

if (!self.Node) {
    self.Node = {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11
    }
};

if (self.XMLSerializer) {
    ku.xml.Serializer = self.XMLSerializer;
}
else {
    ku.xml.Serializer = function() {
        this.serializeToString = function(n) {
            if (n.outerHTML) return n.outerHTML;
            return n.xml;
        };
    };
}

if (self.DOMParser) {
    ku.xml.Parser = self.DOMParser;
}
else if (self.ActiveXObject) {
    ku.xml.Parser = function() {
        this.parseFromString = function(xmlstr, mimetype) {
            var xmldom = new ActiveXObject("Microsoft.XMLDOM");
            xmldom.async = false;
            xmldom.loadXML(xmlstr);
            if (xmldom.parseError.errorCode) {
                throw new Error("Parse Error: "+xmldom.parseError.errorCode
                    +" Reason: "+xmldom.parseError.reason
                    +" at Line: "+xmldom.parseError.line
                );
            }
            return xmldom;
        };
    };
}
else {
    ku.xml.Parser = function() {
        this.parseFromString = function(xmlstr, mimetype) {
            var req = ku.request();
            req.open("data:"+mimetype+"charset=utf-8,"+xmlstr, false);
            req.send(null);
            return req.responseXML;
        };
    };
}

if (!document.importNode) {
    document.importNode = function(node, deep){
        var temp;
        if (node.nodeName == '#text') return document.createTextNode(node.nodeValue);
        switch (node.nodeName) {
            case "tbody": case "tr":
                temp = document.createElement("table"); break;
            case "td":
                temp = document.createElement("tr"); break;
            case "option":
                temp = document.createElement("select"); break;
            default:
                temp = document.createElement("div");
        }
        if (deep) {
            temp.innerHTML = node.xml ? node.xml : node.outerHTML;
        } else {
            temp.innerHTML = node.xml
                ? node.cloneNode(false).xml
                : node.cloneNode(false).outerHTML;
        }
        return temp.getElementsByTagName("*")[0];
    };
}

ku.xml.getNodeName = function(node) {
    if (node.nodeType == 1) {
        if (node.scopeName && node.scopeName != 'HTML') {
            return (node.scopeName+':'+node.nodeName).toLowerCase();
        } else {
            return node.nodeName.toLowerCase();
        }
    } else {
        return node.nodeName;
    }
};

