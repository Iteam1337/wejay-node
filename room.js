var rooms = {};


exports.init = function(io){
  io.sockets.on('connection', function (socket) {

    socket.on('join', function (data) {
      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || { roomName : data.roomName, users: [], userSongs: {} };
        
        var existingUser = room.users.filter(function(existingUser) {
          return existingUser.id === data.user.id
        }).shift(); 
        
        if (!existingUser) room.users.push(data.user);
        else {
          existingUser.lastJoinDate = new Date(); 
        }
        
        room.userSongs[data.user.id] = (room.userSongs[data.user.id] || [])
        rooms[data.roomName] = room;
        socket.set('roomName', data.roomName);

        socket.emit(room);
      });

    });

    socket.on('addSong', function (song) {
      socket.get('roomName', function (err, roomName) {
        var room = rooms[roomName];
        if (!room) return;

        socket.get('user', function(err, user) {
          room.userSongs[user.id].push(song);            
          console.log('userSongs', room.userSongs);
        });
        

      });

    });
  });
}