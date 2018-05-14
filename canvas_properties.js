// NOTE: These must match in canvas.rs
const CANVAS_WIDTH_INDEX = 0;
const CANVAS_HEIGHT_INDEX = 1;

let canvasPropertiesMemory;
const initCanvasConfig = (application, canvas, wasm) => {
  canvasPropertiesMemory = new Uint32Array(wasm.memory.buffer, application.canvas_properties_ptr(), 2);
  canvasPropertiesMemory[CANVAS_WIDTH_INDEX] = canvas.width;
  canvasPropertiesMemory[CANVAS_HEIGHT_INDEX] = canvas.height;
}

const updateCanvasConfig = (canvas) => {
  let canvas_width = canvasPropertiesMemory[CANVAS_WIDTH_INDEX];
  let canvas_height = canvasPropertiesMemory[CANVAS_HEIGHT_INDEX];

  if (canvas.width != canvas_width) { canvas.width = canvas_width; }
  if (canvas.height != canvas_height) { canvas.height = canvas_height; }
};
