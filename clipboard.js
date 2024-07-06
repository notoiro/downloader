const clipboard = require('clipboardy').default;
const EventEmitter = require('events');

module.exports = class Clipboard extends EventEmitter{
  constructor(){
    super();

    this.check_interval;
    this.prev;
  }
  start(){
    this.prev = clipboard.readSync();
    this.check_interval = setInterval(this.check.bind(this), 500);
  }

  check(){
    const current = clipboard.readSync();
    if(this.prev === current) return;

    this.prev = current;

    if(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(current)){
      this.emit('update', current);
    }
  }
}
