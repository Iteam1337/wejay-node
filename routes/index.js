
/*
 * GET home page.
 */

exports.index = function(req, res){
  var os = require("os");
  res.render('index', { title: 'Wejay realtime server ' + os.hostname() });
};