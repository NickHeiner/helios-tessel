module.exports = function(grunt) {

    var spawn = require('child_process').spawn,
        path = require('path'),
        util = require('util'),
        _ = require('lodash'),
        qFs = require('q-io/fs');

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jshint: {
            apps: {
                src: ['apps/**/*.js']
            }
        }
    });

    grunt.registerTask('tessel-push', function() {
        var done = this.async(),

            push = spawn('tessel', ['push']);

        push.stdout.pipe(process.stdout);
        push.stderr.pipe(process.stderr);

        push.on('close', function(code, signal) {
            if (code !== 0) {
                done(new Error('tessel push exited with code `' + code + '` and signal `' + signal +'`'));
                return;
            }
            done();
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

                return qFs.write(pkgJsonFilePath, JSON.stringify(withBlacklist));
            }).then(done, function(err) {
                done(util.isError(err) ? err : new Error(err));
            });
        }
    );

    grunt.registerTask('test', 'jshint');
}
