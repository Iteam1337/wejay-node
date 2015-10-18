/**
 * Module dependencies.
 */

var express = require('express')
var app = express()
var routes = require('./routes')
var user = require('./routes/user')
var path = require('path')

var http = require('http').Server(app)
var io = require('socket.io')(http)

var redis = require('socket.io-redis')
io.adapter(redis({ host: process.env.redis_host || 'redis', port: process.env.redis_port || 6379 }))

// all environments
app.set('port', process.env.PORT || 80)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', routes.index)
app.get('/users', user.list)

http.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

require('./hubs/room').init(io)
