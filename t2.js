var ca = require('node-core-audio');

var engine = ca.createNewAudioEngine();

function processAudio(inputBuffer) {
    console.log(inputBuffer);

    return inputBuffer;
}

engine.addAudioCallback(processAudio);
