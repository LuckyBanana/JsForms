const winston = require('winston')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: _ => {
        return new Date().toLocaleString();
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return '[' + options.timestamp() + '] - ' +
					options.level.toUpperCase() + ' - ' +
					(options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )
      }
    })
  ]
})

logger.level = 'debug'

module.exports = logger
