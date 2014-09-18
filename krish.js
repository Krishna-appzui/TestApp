var http = require('http');
http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end("Hello world this is beanstalk app");
}).listen("8888");

console.log('Server running at http://localhost:89/');