
require('./helper')
let fs = require('fs')
let path = require('path')
let Hapi = require('hapi')
let asyncHandlerPlugin = require('hapi-async-handler')
let mime = require('mime-types')
let archiver = require('archiver')
let rimraf = require('rimraf')
let argv = require('yargs').argv
const constants = require('constants');
let dirName = 'files/'

module.exports = {
  readHandler,
  readDirHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  updateDirHandler,
  createDirHandler,
  deleteDirHandler
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
    let stat = await fs.promise.stat(filePath)
    let data = undefined;
    if (!stat.isDirectory()) {
      //data = await fs.promise.readFile (filePath)
      reply(fs.createReadStream(filePath))
    } else {
      reply().code(constants.HTTP_CODE)
    }
    //reply(data)
}

async function readDirHandler(request, reply) {
    const filePath = getLocalFilePathFromRequest(request)
    console.log(`Reading directory ${filePath}`)
    let stat = await fs.promise.stat(filePath)
    let data = undefined;
    if (stat.isDirectory()) {
      data = await fs.promise.readdir (filePath)
    } else {
      reply().code(constants.HTTP_CODE)
    }
    let acceptHeader = request.headers['accept']
    if (acceptHeader === 'application/x-gtar') {
      console.log(`accept header is ${acceptHeader}`);
      let archive = archiver('zip')
      reply(archive)
      archive.bulk([{
        expand: true,
        cwd: filePath,
        src: ['**'],
        dest: filePath
      }])
      archive.finalize()
    } else {
      reply(data);
    }
}

async function headHandler(request, reply) {
    const filePath = getLocalFilePathFromRequest(request)
    let stat = await fs.promise.stat(filePath)
    if (!stat.isDirectory()) {
      let data = await fs.promise.readFile (filePath)
      setHeaders(reply, filePath, data)
    }
}

async function writeHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  let stat = await fs.promise.stat(filePath)
  if (!stat.isFile()) {
    reply().code(constants.HTTP_403)
  }
  reply(fs.createWriteStream(filePath));
}

async function createHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  await fs.promise.open (filePath, "wx")
  reply("file created successfully\n");
}

async function createDirHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  await fs.promise.mkdir (filePath)
  reply("directory created successfully\n");
}

async function updateHandler(request, reply) {
  let data = request.payload.data
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  await fs.promise.writeFile (filePath, data)
  reply("file updated successfully\n");
}

async function updateDirHandler(request, reply) {
  reply().code(constants.HTTP_403)
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  await fs.promise.unlink (filePath)
  reply("file deleted successfully\n");
}

async function deleteDirHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)
  console.log(filePath)
  await rimraf.promise(filePath)
  reply("dir deleted successfully\n");
}
