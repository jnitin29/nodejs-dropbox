
require('./helper')
let net = require('net')
let JsonSocket = require('json-socket');
let fs = require('fs')
let path = require('path')
let argv = require('yargs').argv
let dir = argv.dir || process.cwd()
require('songbird')

const client_dir = path.join(dir, 'client')

const port = 8000; //The same port that the server is listening on
const host = '127.0.0.1';
const socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket
socket.connect(port, host);
socket.on('connect', function() { //Don't send until we're connected
    console.log('connected to tcp server');
    socket.sendMessage({action: 'start'});
    socket.on('message', function(message) {
        console.log('The result is: '+message.result);
        if (message.action === 'createDir') {
          mkdir(message.dirName);
        }
    });
});

async function mkdir (dirName) {
  const dirPath = path.join(client_dir, dirName)
  await fs.promise.mkdir(dirPath)
}
