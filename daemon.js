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
        level: process.env.SCANT_LOG_LEVEL || 'debug',
        serializers: {request: serializeRequest, response: serializeResponse}});
}

function initialize(daemon) {

    // initialize logging
    initializeLogger(daemon);
    daemon.logger.info('Initializing daemon');

    // create service instance
    daemon.service = new Scant(daemon.logger, config.scanline.path, config.scanline.scanner);
}

var daemon = {}

// initialize daemon
initialize(daemon);

// start listening
daemon.service.listen(parseInt(process.env.SCANT_LISTEN_PORT) || config.express.port);
