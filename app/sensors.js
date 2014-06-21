'use strict';

var EventEmitter = require('events').EventEmitter,
    tessel = require('tessel'),
    emitter = new EventEmitter(),
    ambientlib = require('ambient-attx4'),
    ambient = ambientlib.use(tessel.port.A);

function listenFor(eventType) {
    console.log('Listening for `' + eventType + '`');
    ambient.on(eventType, function(data) {

        data.forEach(function(dataPoint) {
            emitter.emit(eventType, data);
            emitter.emit('data', {
                type: eventType,
                data: data
            });
        });
        
    });
}

ambient.on('ready', function() {
    ['sound', 'light'].forEach(listenFor);
});

ambient.on('error', function(err) {
    emitter.emit('error', err);
});

module.exports = emitter;
