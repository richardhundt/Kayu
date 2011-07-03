ku.module('ku.grammar');

var grammar = new ku.ui.Grammar();

grammar.template('*', function(ctx, node) {
    ctx.put(node);
    ctx.apply(node, node.childNodes);
});

grammar.template('#text', function(ctx, node) {
    ctx.put(node);
});

