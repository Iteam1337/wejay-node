var port = 3333;
process.env.PORT = port;
var host = 'http://0.0.0.0:' + port;
/****/

var Room = require('../models/Room');

var should = require("should");
var io = require('socket.io-client');
var app = require('../server.js');



describe('#room', function() {
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

    it("should be possible to join a room",function(done){
      var client1 = io.connect(host, options);
      client1.once('connect', function(){

        client1.emit('join', {roomName : 'foo', user: {id:1337}}, function(room){
          should.be.ok(room);
          room.users.should.contain({id:1337});
          room.name.should.eql('foo');
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
              room.users.shouled.have.length(2);
              room.users.should.contain({id:1337});
              room.users.should.contain({id:1338});
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
              room.users.shouled.have.length(2);
              room.users.should.contain({id:1337});
              room.users.should.contain({id:1338});
              client1.disconnect();
              client2.disconnect();
              done();
            });
          });
        });
      });
    });

  });
});
