const User = require('../models/User')
const Note = require('../models/Note')

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get All users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // password 제외하고 모든 user 정보를 가져온다.
  const users = await User.find().select('-password').lean() 
  // a: lean()은 mongoose의 document를 javascript object로 변환해준다.
  if ( !users.length ) {
    return res.status(400).json({ message: 'No users found'}) // 400은 Bad Request
    
  }
  res.json(users)
})


// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body

  // confirm data
  if ( !username || !password  ) {
    return res.status(400).json({ message: 'All fields of username, password and roles are required'})
  }

  //check duplicate username
  const duplicate = await User.findOne( {username}).lean().exec()
  if ( duplicate ) {
    return res.status(409).json({ message: 'Username already exists'})
  } 
  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10) // 10은 salt의 round

  const userObject = (!Array.isArray(roles) || !roles.length) 
    ? { username, "password":hashedPassword }
    : { username, "password":hashedPassword, roles}

  const user = await User.create( userObject )

  if ( user) {
    res.status(201).json({ message: `User ${username} created successfully`})
  } else {
    res.status(400).json({ message: 'Invalid user data received'})
  }


})

// @dessc Update  user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
   const { id, username, roles, active,  password } = req.body

    // confirm data
    if ( !id || !username || !Array.isArray(roles ) || !roles.length || typeof active !== 'boolean') {
      return res.status(400).json({ message: 'All fields of username, password and roles are required'})
    } 
    const user = await User.findById(id).exec()

    if ( !user )
      return res.status(400).json({ message: 'User not found'})

    //check duplicate username
    const duplicate = await User.findOne( {username}).lean().exec()
    //Allow updates to the original user
    if ( duplicate && duplicate._id.toString() !== id.toString() ) {
      return res.status(409).json({ message: 'Username already exists'})
    }

    user.username = username
    user.roles = roles
    user.active = active

    if ( password ) {
      user.password = await bcrypt.hash(password, 10)

    }
    const updatedUser = await user.save()
    console.log ( " 🟢 ")
    res.json( { message: `User ${updatedUser.username} updated successfully`} )
 })


// @desc Delete  user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  
  const { id } = req.body  
  if ( !id ) {
    return res.status(400).json({ message: 'User ID is required'})
  }
  
  const notes = await Note.find( { user: id }).lean().exec()
  if ( notes?.length ) {
    return res.status(400).json({ message: 'User hasassigned notes. Delete notes first'})
  }
  
  const user = await User.findById(id).exec()
  if ( !user ) {
    return res.status(400).json({ message: 'User not found'})
  }
  
  const result = await user.deleteOne()
  const reply = `User ${user.username} deleted successfully`
  console.log ( reply )

  res.json(  reply )


})

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser }