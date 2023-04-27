const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')


// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler( async (req, res) => {
  console.log ( " 🔴 login handler --- ")
  console.log( req.body )
  const { username, password } = req.body
  console.log ( " 🔴 login handler --- ", username, password )
  if ( !username || !password ){
    return res.status(400).json({ message: 'Please provide username and password'})
  }

  const foundUser = await User.findOne({username}).exec()

  if ( !foundUser || !foundUser.active){ 
    // 401 Unauthorized
    return res.status(401).json({ message: 'Unauthorized'})
  }

  const match = await bcrypt.compare(password, foundUser.password)

  if ( !match) return res.status(401).json({ message: 'Unauthorized'})

  // create access token
  const accessToken = jwt.sign(
    { 
      "UserInfo": {
        "username": foundUser.username,
        "roles": foundUser.roles
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1m'}
  )

  const refreshToken = jwt.sign(
    {
      "UserInfo": {
        "username": foundUser.username,
        "roles": foundUser.roles
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d'}
  )
  
  // Create secure cookies with refresh token
  res.cookie('jwt', refreshToken, {

     httpOnly: true, // cookies only accessible by the web server
      secure: true, // cookies only sent with HTTPS
      sameSite: 'None', // cookies sent for cross-site requests
      maxAge: 1000 * 60 * 60 * 24 // cookies expires in 1 day      
  })

  // Send access token containing user info ( username / roles )
  res.json( {accessToken})

})

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  // cookies 가지고 와서 존재 여부 확인
  
  const cookies = req.cookies
  if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized - cookies not exist'})
  
  // cookies 가지고 와서 Verify
  const refreshToken = cookies.jwt
  
  jwt.verify(
    refreshToken, 
    process.env.REFRESH_TOKEN_SECRET, 
    
    asyncHandler( async (err, decoded) => {  
  
      if ( err) return res.status(403).json({ message: 'Forbidden'})

      // user check
      console.log ( "refresh point 3 - no error found decoded :", decoded)
      const foundUser = await User.findOne({username: decoded.UserInfo.username}).exec()
      if ( !foundUser){
        return res.status(401).json({ message: 'Unauthorized - no found user'})
      }

      const accessToken = jwt.sign(
        { 
          "UserInfo": {
            "username": foundUser.username,
            "roles": foundUser.roles
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1m'}
      )
      console.log ( "refresh point 4 - access token created :", accessToken)
      res.json({ accessToken})
      })
  )

}


// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookies if exist
const logout = asyncHandler( async (req, res, next) => {
  const cookies = req.cookies
  if ( !cookies?.jwt) return res.sendStatus(204) // No content
  res.clearCookie( 'jwt', { httpOnly: true, sameSite: 'None', secure: true})
  res.json( { message: 'Cookies cleared'}  )

})

module.exports = {
  login,
  refresh,
  logout
}