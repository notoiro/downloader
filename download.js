const { default: axios } = require('axios');
const path = require('path');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const fs = require('fs');

module.exports = async (url, save_dir, filename) => {
  let body;
  try{
    body = await axios.get(url, { responseType: 'stream'});
  }catch(e){
    throw 'donwload file';
  }

  try{
    await pipeline(body.data, fs.createWriteStream(path.join(save_dir, filename)));
  }catch(e){
    console.log(e)
    throw 'write file';
  }

  return null;
}
