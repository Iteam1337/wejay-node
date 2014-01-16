var rooms = {};
var Room = require('../models/Room');

exports.init = function(io){
  io.sockets.on('connection', function (socket) {
        console.log('init');

    var createRoom = function(roomName){
      var room = new Room(roomName);
      room.onNext.push(function(song){
        io.sockets.in(roomName).emit('nextSong', song);
      });
      return room;
    };

    socket.on('join', function (data) {
      socket.join(data.roomName);
        console.log('join');
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || createRoom(data.roomName);

        room.join(data.user);
        room.userSongs[data.user.id] = (room.userSongs[data.user.id] || []);
        rooms[room.roomName] = room;
        socket.set('roomName', room.roomName);
        console.log('join', room.users);
        socket.emit(room);
        socket.broadcast.emit(data.roomName).emit('userJoined', room.users);
      });
    });

    socket.on('addSong', function (song) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (!room) return console.log('no room with name', roomName);

        socket.get('user', function(err, user) {
          song.user = user;
          room.userSongs[user.id].push(song);
          socket.broadcast.to(roomName).emit('songAdded', room.queue);
        });
      });
    });
  });
};



