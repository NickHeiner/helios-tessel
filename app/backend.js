'use strict';

var Firebase = require('firebase'),

    tesselId = 'tessel-id', // require('tessel').deviceId(),

    // I think that full semver is overkill here 
    // and we just care about backwards compatability,
    // so we'll only use the major version.
    API_VERSON = '1',
    _ = require('lodash'),
    firebaseRefUrl = _.template('https://helios.firebaseio.com/v<%= API_VERSON %>/<%= deviceId %>', {
        API_VERSON: API_VERSON,
        deviceId: tesselId
    }),
    rootRef = new Firebase(firebaseRefUrl);

function pushWithTimestamp(ref, data) {
    ref.push(_.merge({}, data, {
        timestamp: Firebase.ServerValue.TIMESTAMP
    }));
}

function onError(err) {
    pushWithTimestamp(rootRef.child('errors'), {
        error: err
    });
}

function onData(data) {
    pushWithTimestamp(rootRef.child('readings').child(data.type), {
        reading: data.data
    });
}

module.exports = {
    onError: onError,
    onData: onData
};
