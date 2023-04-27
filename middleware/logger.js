const { format } = require( 'date-fns')
const fs = require( 'fs')
const fsPromises = require('fs').promises
const path = require( 'path')
const { v4: uuidv4 } = require('uuid')


const logEvent = async (message, logFileName) => {
  
    const now = new Date()
    const log = `${format(now, 'yyyy-MM-dd HH:mm:ss')} ${uuidv4()}\t${message}\n`
    
    try {

      if ( !fs.existsSync( path.join(__dirname, '..', 'logs') ) ) {
        await fsPromises.mkdir( path.join(__dirname, '..', 'logs') )
      }      
      await fsPromises.appendFile( path.join(__dirname, '..', 'logs', logFileName), log)
    }
    catch( err )
    {
      console.log ( err )
    }
}

const logger = (req, res, next) => {
    // logEvent(req, res, next)
    const msg = `${req.ip} - ${req.method} ${req.originalUrl}`
    const filename = 'reqLog.log'
    logEvent( msg , filename);
    
    console.log( `${req.ip} - ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${req.method} ${req.originalUrl}`)
    next()
}

module.exports = { logEvent, logger }
