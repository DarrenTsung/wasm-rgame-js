// NOTE: These must match in application/mouse/mod.rs
const MOUSE_EVENT_MAX = 100;

// NOTE: These must match in application/mouse/event.rs
const MOUSE_EVENT_SIZE = 4;

const MOUSE_EVENT_TYPE_NONE = 0;
const MOUSE_EVENT_TYPE_CLICK = 1;
const MOUSE_EVENT_TYPE_MOVE = 2;
const MOUSE_EVENT_TYPE_OVER = 3;
const MOUSE_EVENT_TYPE_OUT = 4;

const MOUSE_DEBUG = false;

let mouseEventsIndex = 0;
let mouseEventsMemory;
const initMouseListener = (application, canvas, wasm) => {
  mouseEventsMemory = new Uint32Array(wasm.memory.buffer, application.mouse_events_ptr(), MOUSE_EVENT_MAX);

  canvas.addEventListener('click', function(evt) {
    if (MOUSE_DEBUG) { console.log("MouseClick - %O", evt); }
    addMouseEvent(canvas, evt, MOUSE_EVENT_TYPE_CLICK);
  }, false);

  canvas.addEventListener('mouseover', function(evt) {
    if (MOUSE_DEBUG) { console.log("MouseOver - %O", evt); }
    addMouseEvent(canvas, evt, MOUSE_EVENT_TYPE_OVER);
  }, false);

  canvas.addEventListener('mouseout', function(evt) {
    if (MOUSE_DEBUG) { console.log("MouseOut - %O", evt); }
    addMouseEvent(canvas, evt, MOUSE_EVENT_TYPE_OUT);
  }, false);

  canvas.addEventListener('mousemove', function(evt) {
    if (MOUSE_DEBUG) { console.log("MouseMove - %O", evt); }
    addMouseEvent(canvas, evt, MOUSE_EVENT_TYPE_MOVE);
  }, false);
}

const mouseListenerFinalize = () => {
  if (MOUSE_DEBUG) { console.log("Ending the written mouse data with a MOUSE_EVENT_TYPE_NONE."); }
  // Set the mouse event to NONE to signify ending the written data
  let nextStartIndex = (mouseEventsIndex + 1) * MOUSE_EVENT_SIZE;
  mouseEventsMemory[nextStartIndex] = MOUSE_EVENT_TYPE_NONE;
}

const mouseListenerPostTick = () => {
  if (MOUSE_DEBUG) { console.log("Resetting the mouse events index."); }
  mouseEventsIndex = 0;
}

function addMouseEvent(canvas, evt, event_type) {
  let startIndex = mouseEventsIndex * MOUSE_EVENT_SIZE;

  var mousePosition = getMousePosition(canvas, evt);
  if (MOUSE_DEBUG) { console.log("Mouse Position: %O", mousePosition); }
  mouseEventsMemory[startIndex] = event_type;
  mouseEventsMemory[startIndex + 1] = evt.buttons;
  mouseEventsMemory[startIndex + 2] = mousePosition.x * 1000;
  mouseEventsMemory[startIndex + 3] = mousePosition.y * 1000;

  mouseEventsIndex++;
}

function getMousePosition(canvas, evt) {
  var rect = canvas.getBoundingClientRect();

  let x = evt.clientX - rect.left;
  let y = evt.clientY - rect.top;

  // Sometimes x / y can go out of bounds because of MouseOut events
  // but this breaks the interface types (u32)
  x = Math.min(canvas.width, Math.max(0, x));
  y = Math.min(canvas.height, Math.max(0, y));

  // The native canvas starts from top-left as (0, 0)
  // Let's flip the y axis so that it starts from bottom-left (sanely)
  y = canvas.height - y;

  return { x: x, y: y };
}
