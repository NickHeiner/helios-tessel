module.exports = function(grunt) {

    var spawn = require('child_process').spawn,
        path = require('path'),
        util = require('util'),
        _ = require('lodash'),
        q = require('q'),
        qResolve = q.denodeify(require('resolve')),
        qFs = require('q-io/fs');

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        jshint: {
            options: {
                    node: true
            },   
            apps: {
                src: ['app/**/*.js'],
            },
            grunt: {
                src: ['Gruntfile.js']
            }
        }
    });

    grunt.registerTask('tessel-push', function() {
        var done = this.async(),
            pkgJsonFilePath = path.join(__dirname, 'package.json'),
            getTesselBinPath = qResolve('tessel', {
                basedir: __dirname,
                packageFilter: function(packageJsonContents) {
                    // resolve will give us the script in the `main` field.
                    // We would like to use the `bin` field instead, so we 
                    // will transform the package.json so the `bin` field
                    // overwrites the `main` field.
                    return _(packageJsonContents)
                        .omit('main')
                        .merge({
                            main: packageJsonContents.bin.tessel
                        })
                        .valueOf();
                }
            }).spread(function(filePath, fileExports) {
                return filePath;
            });

        q.all([
            qFs.read(pkgJsonFilePath), 
            getTesselBinPath
        ]).spread(function(packageJsonContents, tesselPath) {
            var packageJson = JSON.parse(packageJsonContents),
                deferred = q.defer(),
                push;

            grunt.log.ok('Pushing `' + packageJson.main);
            // TODO don't rely on tessel being installed globally - find it in node_modules
            push = spawn(tesselPath, ['push', packageJson.main, '-l']);

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
