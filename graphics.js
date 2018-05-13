const GRAPHICS_DEBUG = false;

// NOTE: These must match in graphics/mod.rs
const MAX_DRAW_ARRAY_SIZE = 1000;

// NOTE: These must match in graphics/drawables.rs
const DRAW_RECT_SIZE = 5;
const DRAW_ACTION_COLOR_SIZE = 5;

let rectMemory;
let colorMemory;
const initGraphics = (graphics, wasm) => {
  rectMemory = new Int32Array(wasm.memory.buffer, graphics.draw_rects_ptr(), MAX_DRAW_ARRAY_SIZE * DRAW_RECT_SIZE);
  colorMemory = new Uint8Array(wasm.memory.buffer, graphics.draw_action_colors_ptr(), MAX_DRAW_ARRAY_SIZE * DRAW_ACTION_COLOR_SIZE);
}

const drawGraphics = (ctx, canvas, graphics) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  let rectArrayLength = graphics.draw_rects_len();
  let colorArrayLength = graphics.draw_action_colors_len();
  if (GRAPHICS_DEBUG) { console.log("rectArrayLength: %O | colorArrayLength: %O", rectArrayLength, colorArrayLength) }

  let rectIndex = 0;
  let colorIndex = 0;

  let endOrdering = rectArrayLength - 1;
  for (let ordering = 0; ordering <= endOrdering; ordering++) {
    // check if we need to change the fillStyle first
    if (colorIndex < colorArrayLength) {
      let colorStartIndex = colorIndex * DRAW_ACTION_COLOR_SIZE;
      let color_ordering = colorMemory[colorStartIndex];
      if (color_ordering == ordering) {
        let alpha = colorMemory[colorStartIndex + 4] / 255;
        ctx.fillStyle = 'rgba(' +
          colorMemory[colorStartIndex + 1] + ',' +
          colorMemory[colorStartIndex + 2] + ',' +
          colorMemory[colorStartIndex + 3] + ',' +
          alpha +
        ')';

        colorIndex++;
      }
    }

    let rectStartIndex = rectIndex * DRAW_RECT_SIZE;
    let rectOrdering = rectMemory[rectStartIndex];
    if (rectOrdering == ordering) {
      let pos_x = rectMemory[rectStartIndex + 1];
      let pos_y = rectMemory[rectStartIndex + 2];
      let width = rectMemory[rectStartIndex + 3];
      let height = rectMemory[rectStartIndex + 4];

      // The native canvas renders from top-left as (0, 0)
      // Let's flip the y axis so that it renders from bottom-left (sanely)
      pos_y = canvas.height - pos_y - height;

      if (GRAPHICS_DEBUG) { console.log("DrawRect " + "| offset: " + offset + "| pos_x: " + pos_x + "| pos_y: " + pos_y + "| width: " + width + "| height: " + height); }
      ctx.fillRect(pos_x, pos_y, width, height);

      rectIndex++;
    }
  }

  ctx.stroke();

  graphics.reset();
};
