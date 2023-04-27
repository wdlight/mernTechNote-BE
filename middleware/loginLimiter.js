const rateLimiit = require('express-rate-limit');
const { logEvent } = require('./logger');

const loginLimiter = rateLimiit({
  windowMs: 60 * 1000, // 1분
  max: 5,
  message: 
    { message: '해당 IP에서 로그인 시도 횟수를 초과하였습니다. 잠시 후 ( 60초 ) 다시 시도해주세요.'},
  handler: (req, res, next, options) => {
    logEvent( `Too Many Login Attempts from ${req.ip}: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
    res.status(options.statusCode).send(options.message)
  },
  statndardHeader: true, // Retun rate limit info in the `RateLimit=*` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
})

module.exports = loginLimiter

