$PROJECT_NAME("./$PROJECT_NAME_bg.wasm").then(() => {
  const {$PROJECT_NAME_EntryPoint, Graphics, Application, wasm} = $PROJECT_NAME;

  const DEBUG = false;
  const FPS = 60;

  const canvas = document.getElementById("main-canvas");
  const ctx = canvas.getContext('2d');

  const application = Application.new(canvas.width, canvas.height);
  const graphics = Graphics.new();
  initKeyListener(application, wasm);
  initGraphics(graphics, wasm);
  initCanvasConfig(application, canvas, wasm);
  initMouseListener(application, canvas, wasm);

  $PROJECT_NAME_EntryPoint.init(application);

  let prev_time = 0;
  const renderLoop = (time) => {
    if (prev_time == 0) {
      prev_time = time;
    }

    let delta_ms = time - prev_time;
    let delta_s = delta_ms / 1000;
    application.tick(graphics, delta_s);
    mouseListenerPostTick();

    drawGraphics(ctx, canvas, graphics);
    updateCanvasConfig(canvas);

    prev_time = time;
    setTimeout(function() {
      requestAnimationFrame(renderLoop);
    }, 1000 / FPS);
  };

  requestAnimationFrame(renderLoop);
})
