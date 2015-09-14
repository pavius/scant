'use strict';

var _ = require('lodash');
var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
var onResponse = require('on-response');
var childProcess = require('child-process-promise');
var fs = require('fs');

function Scant(logger, scanline_path, scanner) {

    this._logger = logger;
    this._scanner = scanner;
    this._scanline_path = scanline_path;

    this._initializeExpress();
    this._initRoutes();

    this._logger.info({scanline: scanline_path, scanner: scanner}, 'Initialized');
}

Scant.prototype.listen = function(port) {

    this._logger.info({port: port}, 'Listening')
    this.app.listen(port);
};

Scant.prototype._initializeExpress = function() {

    var self = this;

    self.app = express();

    // parse json
    self.app.use(bodyParser.json({limit: '10mb'}));

    // parse url encoded params
    self.app.use(bodyParser.urlencoded());

    // log all requests and their responses
    self.app.use(function(request, response, next) {

        onResponse(request, response, function (error) {
            if (error)
                self._logger.error({request: request, response: response, error: error});
            else if (response.statusCode >= 200 && response.statusCode <= 299)
                self._logger.debug({request: request, response: response});
            else if (response.statusCode >= 500 && response.statusCode <= 599)
                self._logger.error({request: request, response: response});
            else
                self._logger.warn({request: request, response: response});
        });
        next();
    });
};

Scant.prototype._scan = function(request, response) {

    var self = this;

    var command = util.format('%s/scanline -flatbed -scanner "%s"', self._scanline_path, self._scanner);
    self._logger.debug({command: command}, 'Starting scan');

    childProcess.exec(command).then(function(result) {

        // look for "Scanned to: <path>"
        var matches = result.stderr.match(/Scanned to: (.*)\n/);
        if (matches && matches[1]) {
            var scanPath = matches[1];
            self._logger.debug({result: result.stderr, location: scanPath}, 'Extracted scan location from result');

            // send the file pack
            response.sendFile(scanPath, function(error) {

                if (error) {
                    self._logger.warn({error: error}, 'Failed to send file');
                    res.status(error.status).end();
                }

                self._logger.debug({file: scanPath}, 'Respond with file successfully');

                // remove the file
                fs.unlink(scanPath, function(error) {
                    if (error) {
                        self._logger.warn({error: error}, 'Failed to remove scan');
                    }
                });
            });

        } else {
            self._logger.error({result: result.stderr}, 'Failed to scan or could not find file path in output');
            response.sendStatus(500);
        }

        console.log(result.stdout);
    }, function(error) {

        self._logger.error({error: error}, 'Failed to run command');
        response.sendStatus(500);
    });
}

Scant.prototype._initRoutes = function() {

    var self = this;

    // do the scan thingie
    self.app.route('/scans').post(function(request, response) {

        self._scan(request, response);
    });

    // route everything that hasn't been caught
    self.app.route('/*').all(function(request, response) {

        response.status(403).end();
    });
};

module.exports = Scant;