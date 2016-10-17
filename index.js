#!/usr/bin/env babel-node

require('./helper')
let fs = require('fs').promise
let path = require('path')
let Hapi = require('hapi')
let asyncHandlerPlugin = require('hapi-async-handler')
let mime = require('mime-types')
let archiver = require('archiver')
const constants = require('constants');
let dirName = "files/"

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
        async: readHandler
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
        async: createHandler
    }})

    server.route({
    method: 'POST',
    path: '/{file*}',
    handler: {
       async: updateHandler
    }})

    server.route({
    method: 'DELETE',
    path: '/{file*}',
    handler: {
       async: deleteHandler
    }})

    //get directory
    server.route({
    method: 'GET',
    path: '/',
    handler: {
        async: readDirHandler
    }})

    //put directory
    server.route({
    method: 'PUT',
    path: '/',
    handler: {
        async: writeHandler
    }})

    //POST directory
    server.route({
    method: 'POST',
    path: '/',
    handler: {
        async: updateDirHandler
    }})
}

function setHeaders(response, filePath, data) {
    let mimeType = mime.lookup(filePath)
    console.log(`mimetype : ${mimeType}`)
    response.header('Content-Length', data.length)
    response.header('Content-Type', mimeType)
}

function getLocalFilePathFromRequest(request) {
  if (request.params.file) {
    return path.join(__dirname, dirName, request.params.file)
  }
  return path.join(__dirname, dirName)
}

async function readHandler(request, reply) {
    const filePath = getLocalFilePathFromRequest(request)
    console.log(`Reading file ${filePath}`)
    let stat = await fs.stat(filePath)
    let data = undefined;
    if (!stat.isDirectory()) {
      data = await fs.readFile (filePath)
    } else {
      reply().code(constants.HTTP_CODE)
    }
    //reply(fs.createReadStream(filePath))
    reply(data)
}

async function readDirHandler(request, reply) {
    const filePath = getLocalFilePathFromRequest(request)
    console.log(`Reading directory ${filePath}`)
    let stat = await fs.stat(filePath)
    let data = undefined;
    if (stat.isDirectory()) {
      data = await fs.readdir (filePath)
    } else {
      reply().code(constants.HTTP_CODE)
    }
    let acceptHeader = request.headers['Accept']
    if (acceptHeader === 'application/x-gtar') {
      let archive = archiver('zip')
      reply(archive)
      archive.bulk([
        { expand: true, cwd: 'source', src: ['**'], dest: 'source'}
      ])
      archive.finalize()
    }
    reply(data);
}

async function headHandler(request, reply) {
    const filePath = getLocalFilePathFromRequest(request)
    let stat = await fs.stat(filePath)
    if (!stat.isDirectory()) {
      let data = await fs.readFile (filePath)
      setHeaders(reply, filePath, data)
    }
}

async function writeHandler(request, reply) {
  console.log(encodeURIComponent(request.params.name))
  const filePath = path.join(dirName + encodeURIComponent(request.params.name))
  let stat = await fs.stat(filePath)
  if (!stat.isFile()) {
    reply().code(constants.HTTP_403)
  }
  await fs.open (filePath, "wx")
  reply(fs.createWriteStream(filePath));
}

async function createHandler(request, reply) {
  console.log(encodeURIComponent(request.params.name))
  const filePath = path.join(dirName + encodeURIComponent(request.params.name))
  await fs.open (filePath, "wx")
  reply("file created successfully\n");
}

async function updateHandler(request, reply) {
  let data = request.payload.data
  const filePath = path.join(dirName + encodeURIComponent(request.params.name))
  await fs.writeFile (filePath, data)
  reply("file updated successfully\n");
}

async function updateDirHandler(request, reply) {
  reply().code(constants.HTTP_403)
}

async function deleteHandler(request, reply) {
  console.log(encodeURIComponent(request.params.name))
  const filePath = path.join(dirName + encodeURIComponent(request.params.name))
  await fs.unlink (filePath)
  reply("file deleted successfully\n");
}

main()
