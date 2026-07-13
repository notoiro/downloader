const path = require('path');
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const { Confirm } = require("enquirer");
const logger = require('./log.js');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

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
  let res;
  try{
    res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }catch(e){
    throw 'download file';
  }

  try{
    const output_path = path.join(save_dir, filename);

    if (fs.existsSync(output_path)) {
      // Web ReadableStream はネイティブに tee() で複製できる
      const [webStream1, webStream2] = res.body.tee();
      const stream1 = Readable.fromWeb(webStream1);
      const stream2 = Readable.fromWeb(webStream2);

      const exist_hash = await hashfile(output_path);
      const download_hash = await hashstream(stream1);

      if (exist_hash !== download_hash) {
        logger.warn('A file with the same name but different contents already exists!');
        logger.warn(`exist hash: ${exist_hash}, download hash: ${download_hash}`);
        logger.warn(`file path: ${output_path}`);
        const file_override_confirm = new Confirm({ message: "Override?" });
        const confirm_result = await file_override_confirm.run();
        if (!confirm_result) {
          logger.info("Skipped.");
          return "null";
        }
      } else {
        logger.info('Skip because the file exists and the content is the same.');
        return null;
      }

      await pipeline(stream2, fs.createWriteStream(output_path));
    } else {
      await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(output_path));
    }
  }catch(e){
    console.log(e)
    throw 'write file';
  }

  return null;
}
