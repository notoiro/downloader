const { default: axios } = require('axios');
const { URL } = require('url');
const download = require('./download');
const logger = require('./log.js');
const config = require("./config.js");

module.exports = class Misskey{
  constructor(save_dir, orig_filename){
    this.save_dir = save_dir;
    this.orig_filename = orig_filename;
  }

  async check(post_url){
    let u;
    try {
      u = new URL(post_url);
    } catch (e) {
      return false;
    }

    // まずURLパターンで足切り
    if (!/^\/notes\/[a-zA-Z0-9]+$/.test(u.pathname)) {
      return false;
    }

    try {
      // Misskeyは /api/meta にPOSTするとインスタンス情報が返る
      const res = await fetch(`${u.origin}/api/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) return false;

      const data = await res.json();
      // Misskey特有のフィールド(version, features など)が含まれているかで判定
      return typeof data === "object" && ("version" in data || "features" in data);
    } catch (e) {
      return false;
    }
  }

  async download(post_url){
    const parse_post_url = new URL(post_url);

    const note_id = parse_post_url.pathname.match(/notes\/(.+)/)[1];
    const instance_domain = parse_post_url.protocol + "//" + parse_post_url.host;

    try{
      let header = {};
      if(config.MISSKEY_HOST === parse_post_url.host){
        if(config.MISSKEY_TOKEN) header.Authorization = `Bearer ${config.MISSKEY_TOKEN}`;
      }

      const post_request = await axios.post(`${instance_domain}/api/notes/show`, { noteId: note_id }, {headers : header} );

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
