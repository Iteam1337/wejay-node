var weave = require('../utils/weave')

function Room (roomName) {
  this.roomName = roomName
  this.users = []
  this.userSongs = {}
  this.currentSong = null
  this.onNext = []; // todo: eventemitter
  this.history = []

  var timeout = null
  this.startTimer = function () {
    if (!this.currentSong || !this.currentSong.duration) return false
    var self = this
    // keep track on the song length and automatically switch to next when the song ends
    timeout = setTimeout(function () { self.next(); }, this.currentSong.duration)
  }

  this.stopTimer = function () {
    clearTimeout(timeout)
  }

  Object.defineProperty(this, 'queue', {
    get: function () {
      var songs = []
      var users = this.users.sort(function (a, b) { return (a.lastPlayDate || 0) - (b.lastPlayDate || 0); })
      var self = this
      users.map(function (user) {
        var userSongs = self.userSongs[user.id]
        if (userSongs && userSongs.length) songs.push(userSongs.map(function (song) { song.user = user; return song; }))
      })
      return weave(songs) || []
    },
    enumerable: true
  })

  return this
}

Room.prototype = {
  next: function () {
    var self = this

    this.stopTimer()

    if (this.currentSong) {
      var song = this.userSongs[this.currentSong.user.id].splice(0, 1)[0]; // remove it from the user's queue
      this.currentSong.user.lastPlayDate = new Date()
      song.ended = new Date()
      this.history.push(song)
    }

    if (this.queue.length) {
      this.currentSong = this.queue[0]
      this.currentSong.started = new Date()
      this.startTimer()

    } else {
      this.currentSong = null
    }

    return this.onNext && this.onNext.map(function (callback) {
      callback(self.currentSong)
    })
  },

  removeSong: function (song) {
    this.userSongs[song.user.id] = (this.userSongs[song.user.id] || []).filter(function (existing) {
      return existing.spotifyId !== song.spotifyId
    })
  },

  join: function (user) {
    var existingUser = this.users.filter(function (existingUser) {
      return existingUser.id === user.id
    }).shift()

    if (!existingUser) {
      user.lastJoinDate = new Date()
      this.users.push(user)
    } else {
      existingUser.lastJoinDate = new Date()
    }
  }
}

module.exports = Room
