const { Input, Confirm } = require("enquirer");
const Misskey = require("./misskey.js");
const fs = require('fs');
const home_path = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const path = require('path');

const main = async () => {
  const save_dir_input = new Input({ message: "Please enter a save location", initial: path.resolve(home_path, 'Downloads/') });
  const save_dir = await save_dir_input.run();
  if (!(fs.existsSync(save_dir) && fs.statSync(save_dir).isDirectory())){
    console.log("No folder.");
    process.exit(1);
  }

  const filename_orig_confirm = new Confirm({ message: "Do you want to keep the original filename?" });
  const filename_orig = await filename_orig_confirm.run();

  const misskey = new Misskey(save_dir, filename_orig);

  console.log("Enter the post url you want to download, Ctrl+C to exit.");
  for(;;){
    const post_url_input = new Input({ message: "post URL" });
    const post_url = await post_url_input.run();

    try{
      await misskey.download(post_url);
      console.log("All downloads are complete.");
    }catch(e){
      console.log(`Download failed. ${e}`);
    }
  }
}

main();
