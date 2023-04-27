require( 'dotenv').config()

const cookieParser = require('cookie-parser')
const express = require( 'express')
const app = express()
const path = require( 'path')
const PORT = process.env.PORT || 3500
const {logger, logEvent} = require( './middleware/logger')

const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require( './config/dbConn')
const mongoose = require('mongoose')

const errorHandler = require( './middleware/errorHandler')


console.log ( process.env.NODE_ENV)

//db연결
connectDB()

app.use( cors(corsOptions) )

app.use( logger)
app.use( express.json() )
app.use( cookieParser() )

app.use( '/', express.static( path.join(__dirname,'public')) )
app.use( '/', require( './routes/root') )

// auth route 정의
app.use( '/auth', require( './routes/authRoutes') )
// user route 정의
app.use( '/users', require( './routes/userRoutes') )
// note route 정의
app.use( '/notes', require( './routes/noteRoutes') )

app.use( cookieParser)




app.all('*', (req, res) => {
    res.status(404)
    if ( req.accepts('html')){
      res.sendFile( path.join(__dirname, 'views', '404.html') )
    } else if ( req.accepts('json')){
      res.json({ error: '404  Not found' })
    } else {
      res.type('txt').send('404 Not found')
    }
    
})

app.use( errorHandler)

mongoose.connection.once ( 'open', () => {
  console.log ( 'Connected to MongoDB')  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })  
})

mongoose.connection.on ( 'error', (err) => {
  console.log ( err)
  logEvent ( `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrorLog.log')
}
)
