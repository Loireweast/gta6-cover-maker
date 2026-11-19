// Fixed scenes for screenshots: ?shot=cover shows the poster alone at the
// export size, ?shot=editor shows the editor with a sample photo loaded.
// `photos` names the samples in order, one per panel; `title`, `subtitle`,
// `layout`, `grade` and `size` set the scene. window.__shotReady is set
// once the poster is painted with its font in place.
import { createEditor } from './editor.js';

export async function runShot(shot, query) {
  const ed = createEditor();
  ed.setSize(query.get('size') ?? 'square');
  ed.setLayout(query.get('layout') ?? 'grid');
  ed.setGrade(query.get('grade') ?? 'sunset');
  ed.setCaption(query.get('title') ?? 'Sunset Heist', query.get('subtitle') ?? 'One last score');
  const names = (query.get('photos') ?? query.get('photo') ?? 'pier').split(',');
  for (const name of names) {
    try {
      await ed.loadSample(name.trim());
    } catch {
      // A missing sample leaves its panel empty; the shot still goes on.
    }
  }
  ed.dealPhotos();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    ed.setSelectionVisible(false);
  }
  await document.fonts.ready;
  ed.draw();
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.__shotReady = true;
}
