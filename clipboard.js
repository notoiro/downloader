const clipboard = require('clipboardy').default;

module.exports = class Clipboard{
  constructor(){
    this.check_interval;
    this.prev;
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        cb(...args);
      }
    }
  }

  start(){
    try{
      this.prev = clipboard.readSync();
    }catch(e){
      this.prev = "";
    }

    this.check_interval = setInterval(this.check.bind(this), 500);
  }

  check(){
    let current;
    try{
      current = clipboard.readSync();
    }catch(e){
      current = this.prev;
    }

    if(this.prev === current) return;

    this.prev = current;

    if(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(current)){
      this.emit('update', current);
    }
  }
}
