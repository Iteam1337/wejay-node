var rooms = {};


exports.init = function(io){
  io.sockets.on('connection', function (socket) {

    socket.on('join', function (data) {
      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || { roomName : data.roomName, users: [] };
        
        var existingUser = room.users.filter(function(existingUser) {
          return existingUser.id === data.user.id
        }).shift(); 
        
        if (!existingUser) room.users.push(data.user);
        else {
          existingUser.lastJoinDate = new Date(); 
        }

        rooms[data.roomName] = room;
        socket.set('roomName', data.roomName);
        socket.emit(room);
      });

    });

    socket.on('addSong', function (data) {
      //console.log(socket);
      socket.get('roomName', function (data) {console.log(data)});
      console.log(data);

    });
  });
}