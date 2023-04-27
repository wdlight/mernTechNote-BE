const express = require( 'express')
const router = express.Router()
const path = require( 'path')
const authController = require( '../controllers/authController')
const loginLimiter = require( '../middleware/loginLimiter')

router.route( '/')
  .post(loginLimiter, authController.login)

router.route( '/login')
  .post( authController.login)

router.route('/refresh')  // /auth/refresh
  .get(authController.refresh)

router.route('/logout') // /auth/logout
  .post(authController.logout)

module.exports = router