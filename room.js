var rooms = {};


exports.init = function(io){
  io.sockets.on('connection', function (socket) {
    socket.on('join', function (roomName, user) {
      socket.join(roomName);
      socket.set('user', user, function() {
        var room = rooms[roomName] || { roomName : roomName, users: [] };
        
        var existingUser = room.users.filter(function(existingUser) {
          return existingUser.id === user.id
        }).shift(); 
        
        if (!existingUser) room.users.push(user);
        else {
          existingUser.lastJoinDate = new Date(); 
        }

        rooms[roomName] = room;
        socket.emit(room);
      })
    });

    socket.on('addSong', function (song) {
      
    });
  });
}