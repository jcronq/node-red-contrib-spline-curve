Curve = require('js-spline-curve').Curve;

module.exports = function(RED) {
    function splineCurve(config) {
        RED.nodes.createNode(this, config);

        const curve = new Curve(config);

        const iterableAssignment = function(obj, keys, value){
            if(keys.length == 1){
                obj[keys[0]] = value;
            }
            else if(keys.length > 1){
                const thisKey = keys[0];
                keys.splice(0,1);
                if(!obj[thisKey])
                    obj[thisKey] = {};
                iterableAssignment(obj[thisKey], keys, value);
            }
        }

        var node = this;
        node.on('input', function(msg){
            console.log(config);
            const input_key  = (config.input_key)?config.input_key:"payload";
            const output_key = (config.output_key)?config.output_key:"payload";
            const inputKeys  = input_key.split(".");
            const outputKeys = output_key.split(".");

            var inputValue = msg;
            for( i=0; i < inputKeys.length; i++ ){
                inputValue = inputValue[inputKeys[i]];
            }

            const result = curve.getValueAt(inputValue);
            console.log(outputKeys);
            iterableAssignment(msg, outputKeys, result);
            node.send(msg);
        });
    }
    RED.nodes.registerType("spline-curve", splineCurve);
}

