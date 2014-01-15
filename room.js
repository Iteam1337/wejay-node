var rooms = {};
var weave = require('./weave');


exports.init = function(io){
  io.sockets.on('connection', function (socket) {

    socket.on('join', function (data) {
      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || new Room(data.roomName);
        
        var existingUser = room.users.filter(function(existingUser) {
          return existingUser.id === data.user.id;
        }).shift();
        
        if (!existingUser) room.users.push(data.user);
        else {
          existingUser.lastJoinDate = new Date();
        }
        
        room.userSongs[data.user.id] = (room.userSongs[data.user.id] || []);
        rooms[data.roomName] = room;
        socket.set('roomName', data.roomName);

        socket.emit(room);
        socket.broadcast.emit(data.roomName).emit('userJoined', room.users);
      });
    });

    socket.on('addSong', function (song) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (!room) return;

        socket.get('user', function(err, user) {
          song.user = user;
          room.userSongs[user.id].push(song);
          console.log('userSongs', room.userSongs);
          socket.broadcast.to(roomName).emit('songAdded', room.queue);
        });
      });
    });
  });
};

function Room(roomName)
{
  this.roomName = roomName;
  this.users = [];
  this.userSongs = {};
  this.currentSong = null;
  return this;
}

Room.prototype.start = function(first_argument) {
};

Object.defineProperty(Room, 'queue', {
  get: function() {
    var songs = [];
    for(var userId in this.userSongs)
    {
      if (userId) songs.push(this.userSongs[userId]);
    }
    return weave(songs);
  }
});


