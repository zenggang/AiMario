export function createInput({ onRestart }) {
  const keys = { left: false, right: false, up: false, shift: false, lastUp: false };
  const debugFlags = { grid: false, hitbox: false, anchor: false, tileBounds: false };

  function onKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyR') onRestart();

    if (e.code === 'F2') debugFlags.grid = !debugFlags.grid;
    if (e.code === 'F3') debugFlags.hitbox = !debugFlags.hitbox;
    if (e.code === 'F4') debugFlags.anchor = !debugFlags.anchor;
    if (e.code === 'F5') {
      e.preventDefault();
      debugFlags.tileBounds = !debugFlags.tileBounds;
    }
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return { keys, debugFlags };
}
