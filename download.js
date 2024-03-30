const { default: axios } = require('axios');
const path = require('path');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const fs = require('fs');
const crypto = require('crypto');
const { Confirm } = require("enquirer");
const logger = require('./log.js');
const { ReadableStreamClone } = require("readable-stream-clone");

function hashfile(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha3-512');
    const stream = fs.createReadStream(path);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function hashstream(stream){
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha3-512');
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}


module.exports = async (url, save_dir, filename) => {
  let body;
  try{
    body = await axios.get(url, { responseType: 'stream'});
  }catch(e){
    throw 'donwload file';
  }

  try{
    let data = body.data;
    const output_path = path.join(save_dir, filename);

    if(fs.existsSync(output_path)){
      const stream1 = new ReadableStreamClone(data);
      const stream2 = new ReadableStreamClone(data);

      data = stream2;

      const exist_hash = await hashfile(output_path);
      const download_hash = await hashstream(stream1);

      if(exist_hash !== download_hash){
        logger.warn('A file with the same name but different contents already exists!');
        logger.warn(`exist hash: ${exist_hash}, download hash: ${download_hash}`);
        logger.warn(`file path: ${output_path}`);
        const file_override_confirm = new Confirm({ message: "Override?" });
        const confirm_result = await file_override_confirm.run();

        if(!confirm_result){
          logger.info("Skipped.");
          return "null";
        }
      }else{
        logger.info('Skip because the file exists and the content is the same.');
        return null;
      }
    }

    await pipeline(data, fs.createWriteStream(path.join(save_dir, filename)));
  }catch(e){
    console.log(e)
    throw 'write file';
  }

  return null;
}
