export function bindRunnerControls(shell, handlers) {
  const keyMap = {
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ArrowUp: "jump",
    " ": "jump",
    Spacebar: "jump",
    ArrowDown: "slide",
    s: "slide",
    S: "slide",
  };

  shell.onKey((event) => {
    if (event.repeat) return;
    if (event.key === "Escape") {
      event.preventDefault();
      handlers.pause();
      return;
    }
    const action = keyMap[event.key];
    if (!action) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }
    if (!handlers.canControl()) return;
    if (action === "left") handlers.left();
    if (action === "right") handlers.right();
    if (action === "jump") handlers.jump();
    if (action === "slide") handlers.slide();
  });

  shell.enableSwipe((direction) => {
    if (!handlers.canControl()) return;
    if (direction === "left") handlers.left();
    if (direction === "right") handlers.right();
    if (direction === "up") handlers.jump();
    if (direction === "down") handlers.slide();
  });
}
