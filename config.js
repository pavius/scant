module.exports = {
    scanline: {
        path: process.env.SCANT_SCANLINE_PATH || "/Users/erand/Downloads",
        scanner: "HP LaserJet Pro MFP M225dn"
    },
    scant: {
        port: parseInt(process.env.SCANT_LISTEN_PORT) || 3100,
        domain: 'poverty',
        respondWithFile: {path: 'dummy.jpg'},
        logLevel: process.env.SCANT_LOG_LEVEL || 'debug'
    }
}