'use strict';

var backend = require('./backend'),
    sensors = require('./sensors');

sensors.on('error', backend.onError);
sensors.on('data', backend.onData);

sensors.on('data', console.log);
