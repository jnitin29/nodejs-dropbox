#!/usr/bin/env babel-node

require('./helper')
let Hapi = require('hapi')
let asyncHandlerPlugin = require('hapi-async-handler')
let JsonSocket = require('json-socket')
let crud = require('./crud')
let net = require('net');

async function main() {
    // Use 'await' in here
    console.log('Starting server...')

    // Your implementation here
    let server = new Hapi.Server()
    server.register(asyncHandlerPlugin)
    let port = 8000
    await server.connection({port})
    console.log(`Listening @ http://127.0.0.1:${port}`)
    await server.start()

    server.route({
    method: 'GET',
    path: '/{file*}',
    handler: {
        async: crud.readHandler
    }})

    server.route({
    method: 'GET',
    path: '/',
    handler: {
        async: crud.readDirHandler
    }})

    // server.route({
    // method: 'HEAD',
    // path: '/{file*}',
    // handler: {
    //     async: headHandler
    // }})

    server.route({
    method: 'PUT',
    path: '/{file*}',
    handler: {
        async: crud.createHandler
    }})

    server.route({
    method: 'PUT',
    path: '/',
    handler: {
        async: crud.createDirHandler
    }})

    server.route({
    method: 'POST',
    path: '/{file*}',
    handler: {
       async: crud.updateHandler
    }})

    server.route({
    method: 'POST',
    path: '/',
    handler: {
       async: crud.updateDirHandler
    }})

    server.route({
    method: 'DELETE',
    path: '/{file*}',
    handler: {
       async: crud.deleteHandler
    }})

    server.route({
    method: 'DELETE',
    path: '/',
    handler: {
       async: crud.deleteDirHandler
    }})

    server.ext("onPostHandler", (request, reply) => {
        if (request.method === 'delete') {
          tcpServer.sendMessage({action: 'delete', dirName: request.url})
        }
        reply.continue();
    });

    let clientSkt
    let tcpServer = net.createServer();

    tcpServer.on('connection', function(socket) {
        clientSkt = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
        clientSkt.on('message', async function(message) {
            clientSkt.sendEndMessage({action: 'start'});
        });
    });
}

main()
