module.exports = function(grunt) {

    var spawn = require('child_process').spawn,
        path = require('path'),
        util = require('util'),
        _ = require('lodash'),
        q = require('q'),
        qFs = require('q-io/fs');

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        jshint: {
            apps: {
                src: ['apps/**/*.js']
            },
            grunt: {
                src: ['Gruntfile.js']
            }
        }
    });

    grunt.registerTask('tessel-push', function() {
        var done = this.async(),
            pkgJsonFilePath = path.join(__dirname, 'package.json');

        qFs.read(pkgJsonFilePath).then(function(packageJsonContents) {
            var packageJson = JSON.parse(packageJsonContents),
                deferred = q.defer(),
                push;

            grunt.log.ok('Pushing `' + packageJson.main + '`');
            push = spawn('tessel', ['push', packageJson.main, '-l']);

            push.stdout.pipe(process.stdout);
            push.stderr.pipe(process.stderr);

            push.on('close', function(code, signal) {
                if (code !== 0) {
                    deferred.reject(
                        new Error('tessel push exited with code `' + code + '` and signal `' + signal +'`')
                    );
                    return;
                }
                grunt.log.ok('Pushed `' + packageJson.main + '`');
                deferred.resolve();
            });

            return deferred.promise;
        }).then(done, function(err) {
            done(util.isError(err) ? err : new Error(err));
        });

    });

    grunt.registerTask(
        'blacklist-dev-deps', 
        'Automatically copies all dev dependencies into the tessel push blacklist', 
        function() {
            var done = this.async(),
                pkgJsonFilePath = path.join(__dirname, 'package.json');

            qFs.read(pkgJsonFilePath).then(function(packageJsonContents) {
                var packageJson = JSON.parse(packageJsonContents),
                    blacklistEntries = _.mapValues(packageJson.devDependencies, _.constant(false)),
                    withBlacklist = _.merge({}, packageJson, {
                        hardware: blacklistEntries
                    });

                _(blacklistEntries).keys().forEach(function(blacklistEntry) {
                    grunt.log.ok('Blacklisting `' + blacklistEntry + '`');
                });

                grunt.log.ok('Writing `' + pkgJsonFilePath + '`');
                return qFs.write(pkgJsonFilePath, JSON.stringify(withBlacklist, null, 2));
            }).then(done, function(err) {
                done(util.isError(err) ? err : new Error(err));
            });
        }
    );

    grunt.registerTask('test', 'jshint');
    grunt.registerTask('deploy', [
        'test',
        'blacklist-dev-deps',
        'tessel-push'
    ]);
};
