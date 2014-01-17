About
=====

Wejay is a music app for Spotify, this is the API documentation. Read more about Wejay here:
http://wejay.org or here http://github.com/iteam1337/Wejay



Install and connect:
====================

Include client lib from this url: [/socket.io/socket.io.js](). Connect with default settings:

```javascript
    var socket = io.connect(apiUrl);
```

Basic usage:
============

## Join room:

When joining a room you will receive an updated room object containing the latest info including current playing song

```javascript
    socket.emit('join', {roomName: 'foo', user: {id: facebookId, ... }}, function(room){
      scope.room = room;

      if (room.currentSong){
        song.player.play(room.currentSong);
      }

    });
```

## Add song to room:

Make sure you have first joined the room before calling this method so the server has information about the room and your user info.

```javascript
    socket.emit('addSong', {spotifyId: '1337', user: {id: facebookId, ... }});
```

When you add a song, all connected clients will receive a new queue (see below) and if no songs was previously playing you will receive a 
nextSong event directly.

## Receive updates

Once you have joined a room you will start receiving updates when songs are added to the queue:

```javascript
    socket.on('songAdded', function(queue){
      scope.room.queue = queue;
    })
```

When someone joins the room:

```javascript
    socket.on('userJoined', function(users){
      scope.room.users = users;
    })
```

When a new song is being played:

```javascript
    socket.on('nextSong', function(song){
      player.play(song.spotifyId);
    })
```


Models
======

## Room

    roomName : String,
    users : [User],
    userSongs : {},       // dictionary with all user queued songs
    currentSong : Song,
    history : [Song],     // last 50 songs played in this room
    queue : [Song]        // a merged list of all queued songs

## Song

    spotifyId : *String,
    started : Date,
    position : Milliseconds,
    user : User,          // the user that added the song
    ...

## User

    id : *String,
    lastJoinDate : Date,
    lastPlayDate : Date,


\* Required