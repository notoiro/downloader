const { default: axios } = require('axios');
const URL = require('url');
const download = require('./download');
const logger = require('./log.js');

module.exports = class Misskey{
  constructor(save_dir, orig_filename){
    this.save_dir = save_dir;
    this.orig_filename = orig_filename;
  }

  async download(post_url){
    // TODO: parseが非推奨になってる
    const parse_post_url = URL.parse(post_url);

    const note_id = parse_post_url.pathname.match(/notes\/(.+)/)[1];
    const instance_domain = parse_post_url.protocol + "//" + parse_post_url.host;

    try{
      const post_request = await axios.post(`${instance_domain}/api/notes/show`, { noteId: note_id });

      logger.info('Post found.');

      const post_data = post_request.data;

      if(!(post_data.visibility === 'public' || post_data.visibility === 'home')){
        logger.error("Private Post.");
        throw "private";
      }

      if(post_data.uri){
        logger.info("Remote Post. The original post may be of higher quality.");
      }

      if(!post_data.files || post_data.files.length < 1){
        logger.error('No attachments.');
        throw "no_files";
      }

      let image_counter = 0;

      const post_user_name = post_data.user.username;
      const post_host = post_data.uri ? URL.parse(post_data.uri).host : parse_post_url.host;
      const post_id = post_data.uri ? URL.parse(post_data.uri).pathname.match(/.*\/(.+)$/)[1] : post_data.id;

      for(let file of post_data.files){
        const extension = file.name.match(/\.[a-zA-Z0-9]+$/);

        let filename = `mk_${post_user_name}_${post_host}_${post_id}_p${image_counter}${extension}`;
        if(this.orig_filename) filename = file.name;

        await download(file.url, this.save_dir, filename);

        image_counter++;
        logger.info(`File downloaded. (${file.name} also known as ${filename})`);
      }
    }catch(e){
      throw e;
    }
  }
}
