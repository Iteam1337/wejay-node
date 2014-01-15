var rooms = {};


exports.init = function(io){
  io.sockets.on('connection', function (socket) {

    socket.on('join', function (data) {
      socket.join(data.roomName);
      socket.set('user', data.user, function() {
        
        var room = rooms[data.roomName] || new Room(data.roomName);
        
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
}

function Room(roomName)
{
  this.roomName = roomName;
  this.users = [];
  this.userSongs = {};
  this.currentSong = null;
  return this;
}

Room.prototype.start = function(first_argument) {
  this.currentSong
};

Object.defineProperty(Room, 'queue', {
  get: function() {
    var songs = [];
    for(var userId in this.userSongs)
    {
      songs.push(this.userSongs[userId]);
    }
    return weave(songs);
  }
});

/**
 * Take two array (or more) and weave them together into one array so that [1,2,3,4] + [1,2,3,4] => [1,1,2,2,3,3,4,4]
 * @param  {[type]} a [description]
 * @param  {[type]} b [description]
 * @return {[type]}   [description]
 */
var weave = function(a,b){
  var arrays = Array.prototype.slice.call(arguments.length === 1 ? arguments[0] : arguments);
  var maxLength = Math.max.apply(Math, arrays.map(function (el) { return el.length }));

  if (isNaN(maxLength)) return arrays[0].length && arrays[0] || arrays; // no need to weave one single array

  var result = [];
  for(var i=0; i<maxLength; i++){
    _.each(arrays, function(array){
        if(array[i]) result.push(array[i]);
    });
  }
  return result;
};
