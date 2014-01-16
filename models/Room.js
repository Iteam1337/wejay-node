var weave = require('../utils/weave');

function Room(roomName)
{
  this.roomName = roomName;
  this.users = [];
  this.userSongs = {};
  this.currentSong = null;
  this.timeout = null;
  this.onNext = [];
  return this;
}

Room.prototype = {
  next : function(first_argument) {
    var self = this;

    if (this.currentSong) this.currentSong.ended = new Date();
    this.currentSong = this.queue[0];
    this.currentSong.started = new Date();
    this.timeout = setTimeout(function() {
      self.next();
    }, this.currentSong.length);

    return this.onNext && this.onNext.map(function(callback){
      callback(self.currentSong);
    });
  },

  join : function(user){
    var existingUser = this.users.filter(function(existingUser) {
      return existingUser.id === user.id;
    }).shift();
    
    if (!existingUser) {
      this.users.push(user);
    }
    else {
      existingUser.lastJoinDate = new Date();
    }
  },

  get queue () {
    var songs = [];
    for(var userId in this.userSongs)
    {
      if (userId) songs.push(this.userSongs[userId].filter(function(song){return !song.started}));
    }
    return weave(songs);
  }
};

module.exports = Room;