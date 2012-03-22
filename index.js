//main app file for this application

/*
//requires the server.js file
var server = require("./server");
var router = require("./router");

//passing in the route() function as a param
server.start(router.route);
*/

var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {};
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;

server.start(router.route, handle);
