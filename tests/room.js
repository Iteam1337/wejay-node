var port = 3333;
process.env.PORT = port;
var host = 'http://0.0.0.0:' + port;
/****/

var Room = require('../models/Room');

var should = require("should");
var io = require('socket.io-client');
var app = require('../server.js');



describe('Room', function() {
  describe("socket communication", function(){
    var options ={
      transports: ['websocket', 'xhr-polling'],
      'force new connection': true
    };

    it("should be possible to connect to socket io",function(done){
      var client1 = io.connect(host, options);
      client1.once('connect', function(){
        done();
        client1.disconnect();
      });
    });

    describe('#join', function(){

      it("should be possible to join a room",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(){

          client1.emit('join', {roomName : 'foo', user: {id:1337}}, function(room){
            should.ok(room);
            room.users.should.have.length(1);
            room.users[0].id.should.eql(1337);
            room.roomName.should.eql('foo');
            client1.disconnect();
            done();
          });
        });
      });

      it("should be possible to join more clients to a room",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(data){

          var client2 = io.connect(host, options);
          client2.once('connect', function(data){

            client1.emit('join', {roomName : 'bar', user: {id:1337}}, function(){
              client2.emit('join', {roomName : 'bar', user: {id:1338}}, function(room){
                room.users.should.have.length(2);
                room.users[0].id.should.eql(1337);
                room.users[1].id.should.eql(1338);
                client1.disconnect();
                client2.disconnect();
                done();
              });
            });
          });
        });
      });

      it("should be possible to be notified when more clients join a room",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(){

          var client2 = io.connect(host, options);
          client2.once('connect', function(){

            client1.emit('join', {roomName : 'foobar', user: {id:1337}}, function(){
              client2.emit('join', {roomName : 'foobar', user: {id:1338}});
              client1.once('userJoined',  function(users){
                users.should.have.length(2);
                users[0].id.should.eql(1337);
                users[1].id.should.eql(1338);
                client1.disconnect();
                client2.disconnect();
                done();
              });
            });
          });
        });
      });
    });

    describe('#addSong', function(){

      it("should be possible to add a song",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(){
          client1.emit('join', {roomName : 'add', user: {id:1337}}, function(room){
            room.should.have.property('queue');
            client1.once('queue',  function(queue){
              queue.should.have.length(1);
              queue[0].spotifyId.should.eql(1337);
              client1.disconnect();
              done();
            });
            client1.emit('addSong', {spotifyId : 1337});
          });
        });
      });

      it("should be possible to mix songs from two users",function(done){

        var client1 = io.connect(host, options);
        client1.once('connect', function(){
          client1.emit('join', {roomName: 'queue', user:{id:'alice'}}, function(){
            client1.emit('addSong', {spotifyId:1});
            client1.emit('addSong', {spotifyId:2});
            client1.emit('addSong', {spotifyId:3});
          });
        });

        var client2 = io.connect(host, options);
        client2.once('connect', function(){
          client2.emit('join', {roomName: 'queue', user:{id:'bob'}}, function(){
            client2.emit('addSong', {spotifyId:4});
            client2.emit('addSong', {spotifyId:5});
            client2.emit('addSong', {spotifyId:6},function(){
              client2.once('queue', function(queue){
                queue.should.have.length(7);
                queue[0].spotifyId.should.eql(1);
                queue[1].spotifyId.should.eql(4);
                queue[2].spotifyId.should.eql(2);
                queue[3].spotifyId.should.eql(5);
                done();
              });
              client2.emit('addSong', {spotifyId:7});
            });
          });
        });
      });

    });

    describe('#nextSong', function() {
      it('room should start with first song', function(done) {
        var client1 = io.connect(host, options);
        client1.once('connect', function(){
          client1.emit('join', {roomName : 'next', user: {id:1337}}, function(room){
            should.not.exist(room.currentSong);
            client1.once('nextSong',  function(song){
              song.spotifyId.should.eql(1337);
              client1.disconnect();
              done();
            });
            client1.emit('addSong', {spotifyId : 1337});
          });
        });
      });

    });


    describe('#skip', function(){

      it("should be possible to skip",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(){
          client1.emit('join', {roomName : 'skip', user: {id:1337}}, function(room){
            client1.emit('addSong', {spotifyId : 44}, function(){
              client1.emit('skip', {spotifyId : 44}, function(response){
                response.should.eql('Song skipped');
                done();
              });
            });
          });
        });
      });

      it("should send updates to all clients",function(done){

        var client1 = io.connect(host, options);
        client1.emit('join', {roomName : 'broadcast', user: {id:1337}});
        client1.once('nextSong', function(song1){
          song1.spotifyId.should.eql(1);
          client1.once('nextSong', function(song2){
            song2.spotifyId.should.eql(2);
            done();
          });
        });

        var client2 = io.connect(host, options);
        client2.once('connect', function(){

          client2.emit('join', {roomName : 'broadcast', user: {id:1337}});
          client2.emit('addSong', {spotifyId : 1});
          client2.emit('addSong', {spotifyId : 2}, function(){
            client2.emit('skip', {spotifyId : 1}, function(response){
              response.should.eql('Song skipped');
            });
          });
          client2.emit('addSong', {spotifyId : 3});
          client2.emit('addSong', {spotifyId : 5});
          client2.emit('addSong', {spotifyId : 6});
          client2.emit('addSong', {spotifyId : 7});

        });
      });
    });
  });
});
