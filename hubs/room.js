var rooms = {};
var Room = require('../models/Room');

exports.init = function(io){
  io.sockets.on('connection', function (socket) {
    var createRoom = function(roomName){
      var room = new Room(roomName);
      room.onNext.push(function(song){
        io.sockets.in(roomName).emit('nextSong', song);
      });
      return room;
    };

    socket.on('join', function (data, respond) {
      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || createRoom(data.roomName);

        room.join(data.user);
        room.userSongs[data.user.id] = (room.userSongs[data.user.id] || []);
        rooms[room.roomName] = room;
        socket.set('roomName', room.roomName);
        console.log('join', room.users);
        if (room.currentSong) room.currentSong.position = new Date() - room.currentSong.started;
        socket.broadcast.to(data.roomName).emit('userJoined', room.users);
        return respond && respond(room);
      });
    });

    socket.on('addSong', function (song, respond) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (!room) return respond(new Error('no room with name' + roomName));

        socket.get('user', function(err, user) {
          room.userSongs[user.id].push(song);
          if (!room.currentSong) room.next(); // starts the room
          console.log('queue', room.queue);
          io.sockets.in(roomName).emit('songAdded', room.queue);
        });
      });
    });

  });
};



