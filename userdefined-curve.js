Curve = require('js-curve').Curve;

module.exports = function(RED) {
    function userdefinedCurve(config) {
        RED.nodes.createNode(this, config);

        curve = new Curve(config);

        var node = this;
        node.on('input', function(msg){
            msg.payload = curve.getValueAt(msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("userdefined-curve", userdefinedCurve);
}

