// Vice Cover Studio — entry point.
// A `?shot=` query runs a fixed scene for a screenshot (see shots.js);
// otherwise the editor opens with a sample photo already in place.
import { createEditor } from './editor.js';
import { runShot } from './shots.js';

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query).catch((err) => console.error(err));
} else {
  const ed = createEditor();
  ed.loadSample('pier').then(() => ed.dealPhotos()).catch(() => {});
  document.fonts.ready.then(() => ed.draw());
}
