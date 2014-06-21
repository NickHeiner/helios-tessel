'use strict';

var EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter(),
    count = 0;

setInterval(function() {
    emitter.emit('data', 'ping #' + count++);
}, 500)

module.exports = emitter;
