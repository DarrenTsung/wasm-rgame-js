// NOTE: These must match in application.rs
const KEY_CODE_MAX = 300;
const KEY_DOWN = 1;
const KEY_UP = 3;

let keysMemory;
const initKeyListener = (application, wasm) => {
  keysMemory = new Uint8Array(wasm.memory.buffer, application.keys_ptr(), KEY_CODE_MAX);

  window.onkeyup = function(e) {
    // console.log("UP -- e.keyCode: %O", e.keyCode);
    if (e.keyCode >= 0 && e.keyCode < KEY_CODE_MAX) {
      keysMemory[e.keyCode] = KEY_UP;
    }
  }

  window.onkeydown = function(e) {
    // console.log("DOWN -- e.keyCode: %O", e.keyCode);
    if (e.keyCode >= 0 && e.keyCode < KEY_CODE_MAX) {
      keysMemory[e.keyCode] = KEY_DOWN;
    }
  }
}
