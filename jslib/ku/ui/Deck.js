ku.module('ku.ui.Deck');

ku.ui.Deck = function(nid) {
    var node = ku.get(nid);
    ku.bless(node, arguments.callee);
    node.init(arguments[1]);
    return node;
};

ku.is(ku.ui.Deck, ku.ui.Component);

def = ku.ui.Deck.prototype;

def.cards = function() { return ku.query(this).elements() };

def.set_history = function(value) {
    this.history = value;
};

def.set_selectedIndex = function(index) {
    if (this.selectedIndex == index) return;

    var card = this.cards().item(index);
    if (this.getAttribute('history') == 'enabled') {
        ku.history.add(this, { selectedIndex : index });
    }

    if (card) {
        var curr = this.cards().item(this.selectedIndex);
        if (curr) curr.style.display = 'none';
        if (this.getAttribute('renderPolicy') == 'deferred' &&
            !(card.rendered || card.getAttribute('rendered'))) {
            ku.ajax.event('render').on(card).wait(this).send();
        } else {
            card.style.display = 'block';
        }
        this.selectedIndex = index;
    }
};

