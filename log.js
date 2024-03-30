const xa = require('xa');

module.exports = class Logger{
  static info(...args){
    xa.custom("info", args, { titleColor: "white", backgroundColor: "lightblue" });
  }

  static warn(...args){
    xa.custom("warn", args, { titleColor: "white", backgroundColor: "#FFC800" });
  }

  static success(...args){
    xa.custom("success", args, { titleColor: "white", backgroundColor: "lightgreen" });
  }

  static error(...args){
    xa.custom("error", args, { titleColor: "white", backgroundColor: "#FFCCCB" });
  }
}
