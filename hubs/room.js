var rooms = {}
var Room = require('../models/Room')
var moment = require('moment')

exports.init = function (io) {
  io.sockets.on('connection', function (socket) {
    socket.emit('rooms', Object.keys(rooms).map(roomName => {
      var room = rooms[roomName]
      return { roomName: roomName, users: room.users.length, currentSong: room.currentSong }
    }))

    var createRoom = function (roomName) {
      var room = new Room(roomName)
      room.onNext.push(function (song) {
        io.sockets.in(roomName).emit('nextSong', song)
        io.sockets.in(roomName).emit('queue', room.queue)
      })
      return room
    }

    socket.on('join', function (data, respond) {
      if (!data.user || !data.roomName) return respond && respond('Error: RoomName and User are required')

      socket.join(data.roomName)
      socket.user = data.user

      var room = rooms[data.roomName] || createRoom(data.roomName)

      room.join(data.user)
      room.userSongs[data.user.id] = (room.userSongs[data.user.id] || [])
      room.serverTime = new Date()
      rooms[room.roomName] = room
      room.history = room.history
        .sort((a, b) => (
          moment(b.ended).format('X') - moment(a.ended).format('X')
        ))
        .slice(0, 50)

      socket.roomName = room.roomName
      if (room.currentSong) room.currentSong.position = new Date() - room.currentSong.started
      io.sockets.in(data.roomName).emit('userJoined', room.users)
      return respond && respond(room)
    })

    socket.on('history', (roomName, respond) => {
      if (!rooms[roomName]) {
        return respond && respond('Error: No room with that name')
      }

      if (!rooms[roomName].history.length) {
        return respond && respond('Error: No history')
      }

      var history = rooms[roomName].history
        .sort((a, b) => (
          moment(b.ended).format('X') - moment(a.ended).format('X')
        ))
        .slice(0, 50)

      return respond && respond(history)
    })

    socket.on('disconnect', function () {
      var room = rooms[socket.roomName]
      if (!room) return
      delete room.users[socket.user]
      io.sockets.in(socket.roomName).emit('userLeft', room.users)
    })

    /**
     * Add one or many songs to a room
     */
    socket.on('addSong', function (song, respond) {
      var roomName = socket.roomName
      var room = rooms[roomName]
      if (!room) return respond && respond('Error: No room with name' + roomName)
      if (!song.length && !song.spotifyId) return respond && respond('Error: SpotifyId is required')

      song.started = song.ended = song.position = undefined
      song.duration = song.duration || 10 * 60 * 1000
      console.log('song added', song)
      if (room.queue.filter(function (existingSong) { return existingSong.spotifyId === song.spotifyId }).shift()) {
        return respond && respond('Error: This song is already in the queue')
      }

      var user = socket.user
      var songs = song.map && song || [song]
      songs.forEach((song) => room.userSongs[user.id].push(song))
      if (!room.currentSong) room.next() // starts the room
      io.sockets.in(roomName).emit('queue', room.queue)

      return respond && respond('Song added')
    })

    socket.on('skip', function (song, respond) {
      var roomName = socket.roomName
      var room = rooms[roomName]
      if (!room) return respond && respond('Error: Room not found, login again')

      if (room.currentSong && room.currentSong.spotifyId === song.spotifyId) {
        room.next()
        io.sockets.in(roomName).emit('queue', room.queue)
        return respond && respond('Song skipped')
      } else {
        var oldLength = room.queue.length
        console.log('skipping song in queue')
        room.removeSong(song)
        if (room.queue.length < oldLength) {
          io.sockets.in(roomName).emit('queue', room.queue)
          return respond && respond((oldLength - room.queue.length) + ' songs removed from queue', oldLength - room.queue.length)
        }
        return respond && respond('Error: Not current song anymore')
      }
    })

  })
}
