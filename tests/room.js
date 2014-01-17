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
            client1.once('songAdded',  function(queue){
              queue.should.have.length(1);
              queue[0].spotifyId.should.eql(1337);
              client1.disconnect();
              done();
            });
            client1.emit('addSong', {spotifyId : 1337});
          });
        });
      });

    });


    xdescribe('#skip', function(){

      it("should be possible to skip current song",function(done){
        var client1 = io.connect(host, options);
        client1.once('connect', function(){

          client1.emit('skip', {songId : 1337}, function(response){
            should.ok(response);
            done();
          });

        });
      });

    });





  });
});
