// Mockscii entry point. The real editor is assembled here task-by-task.
import { APP_NAME, cellKey } from './state.js';

export function init(doc = document) {
  const canvas = doc.getElementById('grid');
  if (canvas) {
    // Placeholder sizing; the layout/canvas task will replace this with auto-fit logic.
    canvas.width = canvas.clientWidth || 320;
    canvas.height = canvas.clientHeight || 240;
  }
  return { name: APP_NAME, cellKey };
}

if (typeof document !== 'undefined') {
  init();
}
