'use strict';

var bunyan = require('bunyan');
var Scant = require('./scant');
var config = require('./config.js');

function initializeLogger(daemon) {

    function serializeRequest(request) {
        return {method: request.method, url: request.url, body: request.body}
    };

    function serializeResponse(response) {
        return {status: response.statusCode || response.status}
    };

    daemon.logger = bunyan.createLogger({
        name: 'scant',
        level: config.scant.logLevel,
        serializers: {request: serializeRequest, response: serializeResponse}});
}

function initialize(daemon) {

    // initialize logging
    initializeLogger(daemon);
    daemon.logger.info('Initializing daemon');

    // create service instance
    daemon.service = new Scant(daemon.logger,
        config.scant.respondWithFile,
        config.scanline.path,
        config.scanline.scanner);
}

var daemon = {}

// initialize daemon
initialize(daemon);

// start listening
daemon.service.listen(config.scant.domain, config.scant.port);
