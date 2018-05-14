const GRAPHICS_DEBUG = false;

// NOTE: These must match in graphics/mod.rs
const MAX_DRAW_ARRAY_SIZE = 500;
const MAX_STRING_ARRAY_SIZE = 1000;

// NOTE: These must match in graphics/drawables.rs
const DRAW_RECT_SIZE = 5;
const DRAW_ACTION_COLOR_SIZE = 5;
const STRING_PROPERTIES_SIZE = 4;

let rectMemory;
let stringMemory;
let stringPropertyMemory;
let colorMemory;

const initGraphics = (graphics, wasm) => {
  rectMemory = new Float32Array(wasm.memory.buffer, graphics.draw_rects_ptr(), MAX_DRAW_ARRAY_SIZE * DRAW_RECT_SIZE);
  stringMemory = new Uint8Array(wasm.memory.buffer, graphics.strings_ptr(), MAX_STRING_ARRAY_SIZE);
  stringPropertyMemory = new Float32Array(wasm.memory.buffer, graphics.string_properties_ptr(), MAX_DRAW_ARRAY_SIZE * STRING_PROPERTIES_SIZE);
  colorMemory = new Uint8Array(wasm.memory.buffer, graphics.draw_action_colors_ptr(), MAX_DRAW_ARRAY_SIZE * DRAW_ACTION_COLOR_SIZE);
}

const drawGraphics = (ctx, canvas, graphics) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  // Right now we only support text that is center aligned
  ctx.textAlign = 'center';

  let rectArrayLength = graphics.draw_rects_len();
  let stringArrayLength = graphics.string_properties_len();
  let colorArrayLength = graphics.draw_action_colors_len();
  if (GRAPHICS_DEBUG) { console.log("rectArrayLength: %O | stringArrayLength: %O | colorArrayLength: %O", rectArrayLength, stringArrayLength, colorArrayLength) }

  let rectIndex = 0;
  let stringPropertyIndex = 0;
  let stringIndex = 0;
  let colorIndex = 0;

  let endOrdering = rectArrayLength + stringArrayLength;
  for (let ordering = 1; ordering <= endOrdering; ordering++) {
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

    let stringPropertyStartIndex = stringPropertyIndex * STRING_PROPERTIES_SIZE;
    let rectStartIndex = rectIndex * DRAW_RECT_SIZE;
    // truncate float to int
    let rectOrdering = rectMemory[rectStartIndex] | 0;
    let stringPropertyOrdering = stringPropertyMemory[stringPropertyStartIndex] | 0;

    if (rectOrdering == ordering) {
      let pos_x = rectMemory[rectStartIndex + 1];
      let pos_y = rectMemory[rectStartIndex + 2];
      let width = rectMemory[rectStartIndex + 3];
      let height = rectMemory[rectStartIndex + 4];

      // The native canvas renders from top-left as (0, 0)
      // Let's flip the y axis so that it renders from bottom-left (sanely)
      pos_y = canvas.height - pos_y - height;

      if (GRAPHICS_DEBUG) { console.log("DrawRect " + "| pos_x: " + pos_x + "| pos_y: " + pos_y + "| width: " + width + "| height: " + height); }
      ctx.fillRect(pos_x, pos_y, width, height);

      rectIndex++;
    } else if (stringPropertyOrdering == ordering) {
      let pos_x = stringPropertyMemory[stringPropertyStartIndex + 1];
      let pos_y = stringPropertyMemory[stringPropertyStartIndex + 2];
      let fontSize = stringPropertyMemory[stringPropertyStartIndex + 3];

      // The native canvas renders from top-left as (0, 0)
      // Let's flip the y axis so that it renders from bottom-left (sanely)
      pos_y = canvas.height - pos_y;

      // Consume the current string in stringMemory, incrementing the stringIndex
      let lastIndex;
      for (lastIndex = stringIndex; stringMemory[lastIndex] != 0; lastIndex++);
      let data = stringMemory.slice(stringIndex, lastIndex);
      stringIndex = lastIndex;

      let string = stringFromUTF8Array(data);
      if (string == null) {
        console.log("Failed to parse string from raw data! Investigate this.");
      }

      if (GRAPHICS_DEBUG) { console.log("DrawString | string: " + string + " | pos_x: " + pos_x + " | pos_y: " + pos_y + " | fontSize: " + fontSize); }

      let fontText = fontSize.toFixed(2) + 'px sans-serif';
      if (ctx.font != fontText) {
        ctx.font = fontText;
      }

      ctx.fillText(string, pos_x, pos_y);

      stringPropertyIndex++;
    } else {
      // Incident Report (05/14/2018): One possibility is that the WASM memory
      // reached its limit and reallocated? Reducing buffer size fixed this.
      throw new Error("Failed to find ordering in rect / string arrays! This is not good, investigate!");
    }
  }

  ctx.stroke();

  graphics.reset();
};

function stringFromUTF8Array(data) {
  const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
  var count = data.length;
  var str = "";

  for (var index = 0;index < count;)
  {
    var ch = data[index++];
    if (ch & 0x80)
    {
      var extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || ((index + extra) > count))
      return null;

      ch = ch & (0x3F >> extra);
      for (;extra > 0;extra -= 1)
      {
        var chx = data[index++];
        if ((chx & 0xC0) != 0x80)
        return null;

        ch = (ch << 6) | (chx & 0x3F);
      }
    }

    str += String.fromCharCode(ch);
  }

  return str;
}
