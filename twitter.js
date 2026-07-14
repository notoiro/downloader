const { URL } = require('url');
const download = require('./download');
const logger = require('./log.js');

module.exports = class Twitter{
  constructor(save_dir){
    this.save_dir = save_dir;
  }

  check(post_url){
    const post_url_sp = post_url.split('\n');
    return post_url_sp.length === 2 && post_url_sp[0] === "TWEET_INFO";
  }

  async download(post_url, from_clipboard = false){
    try{
      const body = JSON.parse(post_url.split('\n')[1]);

      if(!body.media || body.media.length < 1){
        logger.error('No attachments.');
        throw "no_files";
      }

      let image_counter = 0;

      const post_user_name = body.user_id.replace('@', '');
      const post_id = body.id;

      for(let file of body.media){
        const pathname = new URL(file.url).pathname
        const extension = pathname.match(/\.[a-zA-Z0-9]+$/);

        let filename = `tw_${post_user_name}_${post_id}_p${image_counter}${extension}`;
        if(this.orig_filename) filename = file.name;

        await download(file.url, this.save_dir, filename, from_clipboard);

        image_counter++;
        logger.info(`File downloaded.`);
      }
    }catch(e){
      throw e;
    }
  }
}
