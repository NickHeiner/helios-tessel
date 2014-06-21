'use strict';

var Firebase = require('firebase'),

    tesselId = 'tessel-id', // require('tessel').deviceId(),

    // I think that full semver is overkill here 
    // and we just care about backwards compatability.
    API_VERSON = '1',
    _ = require('lodash'),
    firebaseRefUrl = _.template('https://helios.firebaseio.com/v<%= API_VERSON %>/<%= deviceId %>', {
        API_VERSON: API_VERSON,
        deviceId: tesselId
    }),
    rootRef = new Firebase(firebaseRefUrl);

function onError(err) {

}

function onData(data) {
    rootRef.set(data);
}

module.exports = {
    onError: onError,
    onData: onData
};
