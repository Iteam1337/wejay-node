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
      client1.once('connect', function(data){
        done();
        client1.disconnect();
      });
    });

    xit("should be possible to join a room",function(done){
      var client1 = io.connect(host, options);
      client1.once('connect', function(data){

        client1.emit('join', {id:1337}, function(room){
          should.be.ok(room);
          room.users.should.contain({id:1337});
        });
        done();
        client1.disconnect();
      });
    });



  });
});
