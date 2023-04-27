const User = require('../models/User')
const Note = require('../models/Note')

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')



// @desc Get All notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  // password 제외하고 모든 note 정보를 가져온다.
  const notes = await Note.find().lean() 
  
  // a: lean()은 mongoose의 document를 javascript object로 변환해준다.
  if ( !notes.length ) {
    return res.status(400).json({ message: 'No notes found'}) // 400은 Bad Request
    
  }
  // add each note's name to the note
  const noteWithUserName = await Promise.all(notes.map(async note => {
    const user = await User.findById(note.user).select('username').lean()    
    return {...note, username: user.username}
  }))

  // sort notes by createdAt
  noteWithUserName.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
  
  res.json(noteWithUserName)
})


// @desc Create new user
// @route POST /users
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body

  // confirm data
  if ( !user || !title || !text || !text.length ) {
    return res.status(400).json({ message: 'All fields of user, title and text are required'})
  }

  //check duplicate username
  
  const duplicate = await Note.findOne( {title}).lean().exec()
  if ( duplicate ) {
    return res.status(409).json({ message: 'title already exists'})
  }   
  const noteObject = { user:user, title:title, text:text } 
  console.log ( noteObject )  
  console.log ( " 📘📘📘 ")

  const note = await Note.create( noteObject ) 
  

  if ( note) {
    res.status(201).json({ message: `Note : ${title} created successfully`})
  } else {
    res.status(400).json({ message: 'Invalid user data received'})
  }

})





// @dessc Update  user
// @route PATCH /users
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // confirm data
    if ( !user || !title || !text||
          !text.length || typeof completed !== 'boolean') {

      return res.status(400).json({ message: 'All fields of title, user and text are required'})
    } 
    const note = await Note.findById(id).exec()

    if ( !note )
      return res.status(400).json({ message: 'Note not found'})

   // Check for duplicate title
   const duplicate = await Note.findOne({ title }).lean().exec()

   // Allow renaming of the original note 
   if (duplicate && duplicate?._id.toString() !== id) {
       return res.status(409).json({ message: 'Duplicate note title' })
   }

    note.title = title
    note.user = user
    note.text = text
    note.completed = completed    
    
    const updatedNote = await note.save()

    res.json( { message: `Note ${updatedNote.title} updated successfully`} )
 })


// @desc Delete  note
// @route PATCH /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body

  if ( !id ) {
    return res.status(400).json({ message: 'Note ID is required'})
  }

  const note = await Note.findById(id).exec()
  if ( !note ) {
    return res.status(400).json({ message: 'Note not found'})
  }

  const result = await note.deleteOne()
  const reply = `Note ${result.title} with ${result._id} deleted successfully`

  res.json(  reply )


})

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote }