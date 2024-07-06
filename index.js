const { Input, Confirm } = require("enquirer");
const Misskey = require("./misskey.js");
const logger = require('./log.js');
const fs = require('fs');
const home_path = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const path = require('path');
const cac = require('cac');
const Clipboard = require('./clipboard.js');

const cli = cac();

cli.option('-c, --clipboard', 'Use clipboard check');
cli.option('-h, --help', 'help');

const handle_opt = (opt) => {
  if(opt.options.help){
    cli.outputHelp();
    process.exit(0);
  }
}

const main = async () => {
  const opt = cli.parse();
  let clipboard;

  handle_opt(opt);

  const save_dir_input = new Input({ message: "Please enter a save location", initial: path.resolve(home_path, 'Downloads/') });
  const save_dir = await save_dir_input.run();
  if (!(fs.existsSync(save_dir) && fs.statSync(save_dir).isDirectory())){
    logger.error("No folder.");
    process.exit(1);
  }

  const filename_orig_confirm = new Confirm({ message: "Do you want to keep the original filename?" });
  const filename_orig = await filename_orig_confirm.run();

  const misskey = new Misskey(save_dir, filename_orig);

  if(opt.options.clipboard){
    clipboard = new Clipboard();
    clipboard.on('update', async (current) => {
      try{
        await misskey.download(current);
        logger.success("All downloads are complete.");
      }catch(e){
        logger.error(`Download failed. ${e}`);
      }
    });

    clipboard.start();

    logger.info('Clipboard check is enabled')
  };

  logger.info("Enter the post url you want to download, Ctrl+C to exit.");
  for(;;){
    const post_url_input = new Input({ message: "post URL" });
    const post_url = await post_url_input.run();

    try{
      await misskey.download(post_url);
      logger.success("All downloads are complete.");
    }catch(e){
      logger.error(`Download failed. ${e}`);
    }
  }
}

main();
