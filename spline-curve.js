Curve = require('js-spline-curve').Curve;

module.exports = function(RED) {
    function splineCurve(config) {
        RED.nodes.createNode(this, config);

        curve = new Curve(config);

        var node = this;
        node.on('input', function(msg){
            msg.payload = curve.getValueAt(msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("spline-curve", splineCurve);
}

