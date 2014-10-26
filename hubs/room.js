var rooms = {};
var Room = require('../models/Room');

exports.init = function(io){
  io.sockets.on('connection', function (socket) {
    var createRoom = function(roomName){
      var room = new Room(roomName);
      room.onNext.push(function(song){
        io.sockets.in(roomName).emit('nextSong', song);
        io.sockets.in(roomName).emit('queue', room.queue);
      });
      return room;
    };

    socket.on('join', function (data, respond) {
      if (!data.user || !data.roomName) return respond && respond('Error: RoomName and User are required');

      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || createRoom(data.roomName);

        room.join(data.user);
        room.userSongs[data.user.id] = (room.userSongs[data.user.id] || []);
        room.serverTime = new Date();
        rooms[room.roomName] = room;
        socket.set('roomName', room.roomName);
        if (room.currentSong) room.currentSong.position = new Date() - room.currentSong.started;
        io.sockets.in(data.roomName).emit('userJoined', room.users);
        return respond && respond(room);
      });
    });

    /**
     * Add one or many songs to a room
     */
    socket.on('addSong', function (song, respond) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (!room) return respond &&  respond('Error: No room with name' + roomName);

        if (room.queue.filter(function(existingSong){ return existingSong.spotifyId === song.spotifyId }).shift()){
          return respond && respond('Error: This song is already in the queue');
        }

        socket.get('user', function(err, user) {
          var songs = song.map && song || [song];
          songs.map(function(song){room.userSongs[user.id].push(song)});
          if (!room.currentSong) room.next(); // starts the room
          io.sockets.in(roomName).emit('queue', room.queue);
        });

        return respond && respond('Song added');
      });
    });

    socket.on('skip', function (song, respond) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (room.currentSong && room.currentSong.spotifyId === song.spotifyId)
        {
          room.next();
          io.sockets.in(roomName).emit('queue', room.queue);
          return respond && respond('Song skipped');
        } else {
          var oldLength = room.queue.length;
          room.removeSong(song);
          if (room.queue.length < oldLength){
            io.sockets.in(roomName).emit('queue', room.queue);
            return respond && respond((oldLength - room.queue.length) + ' songs removed from queue', oldLength - room.queue.length);
          }
          return respond && respond('Error: Not current song anymore');
        }
      });
    });

  });
};



