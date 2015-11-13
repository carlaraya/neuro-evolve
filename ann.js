function Neuron(nInputs) {
    this.nInputs = nInputs;
    this.weights = [];
    for (var i = 0; i < this.nInputs + 1; i++) {
        this.weights.push(Math.random() * 2 - 1);
    }
}

function NeuronLayer(nNeurons, nInputsPerNeuron) {
    this.nNeurons = nNeurons;
    this.neurons = [];
    this.nInputsPerNeuron = nInputsPerNeuron;
    for (var i = 0; i < this.nNeurons; i++) {
        this.neurons.push(new Neuron(nInputsPerNeuron));
        for (var j = 0; j < this.nInputs + 1; j++) {
        }
    }
}

function NeuralNet(nInputs, nOutputs, nHiddenLayers, nNeursPerHiddenLyr) { 
    this.nInputs = nInputs;
    this.nOutputs = nOutputs;
    this.nHiddenLayers = nHiddenLayers;
    this.nNeursPerHiddenLyr = nNeursPerHiddenLyr;

    this.layers = [];

    if (this.nHiddenLayers > 0) {
        this.layers.push(new NeuronLayer(this.nNeursPerHiddenLyr, this.nInputs));
        for (var i = 0; i < this.nHiddenLayers - 1; i++) {
            this.layers.push(new NeuronLayer(this.nNeursPerHiddenLyr, this.nNeursPerHiddenLyr));
        }
        this.layers.push(new NeuronLayer(this.nOutputs, this.nNeursPerHiddenLyr));
    } else {
        this.layers.push(new NeuronLayer(this.nOutputs, this.nInputs));
    }

    this.update = function(inputs) {
        var outputs = [];
        if (inputs.length != this.nInputs) {
            return outputs;
        }
        for (var i = 0; i < this.layers.length; i++) {
            if (i > 0) {
                inputs = outputs.slice();
            }
            outputs = [];
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                var x = 0.0;
                for (var k = 0; k < inputs.length; k++) {
                    x += this.layers[i].neurons[j].weights[k] * inputs[k];
                }
                x += this.layers[i].neurons[j].weights[inputs.length];
                outputs.push(sigmoid(x));
            }
        }
        return outputs;
    }


    this.get_weights = function() {
        var allWeights = [];
        for (var i = 0; i < this.layers.length; i++) {
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                for (var k = 0; k < this.layers[i].neurons[j].weights.length; k++) {
                    allWeights.push(this.layers[i].neurons[j].weights[k]);
                }
            }
        }
        return allWeights;
    }

    this.set_weights = function(weights) {
        var ct = 0;
        for (var i = 0; i < this.layers.length; i++) {
            for (var j = 0; j < this.layers[i].neurons.length; j++) {
                for (var k = 0; k < this.layers[i].neurons[j].weights.length; k++) {
                    this.layers[i].neurons[j].weights[k] = weights[ct++];
                }
            }
        }
    }
}

function sigmoid(x) {
    //return Math.tanh(x);
    return 1 / (1 + Math.exp(-x));
}
