const svgNS = "http://www.w3.org/2000/svg";
const canvas = document.getElementById('canvas');
let stateCount = 0;
let selectedElement = null;
let connectionSource = null;
let selectedItem = null;
let startState = null;
let multiSelect = []; 
let dragData = null;
const radius = 30;
const transitions = [];

function clearSelection() {
    document.querySelectorAll('.state').forEach(c => c.classList.remove('highlight'));
    multiSelect = [];
}

canvas.addEventListener('dblclick', e => {
  if (e.target === canvas) {
    clearSelection();
    const pt = canvas.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(canvas.getScreenCTM().inverse());
    const lbl = prompt('Enter state label:', 'q' + stateCount);
    if (lbl) createState(loc.x, loc.y, lbl);
  }
});

function createState(x, y, label) {
  const g = document.createElementNS(svgNS, 'g');
  g.classList.add('state-group');
  g.setAttribute('transform', `translate(${x},${y})`);
  g.setAttribute('data-label', label);
  g.setAttribute('data-final', 'false');

  const c = document.createElementNS(svgNS, 'circle');
  c.classList.add('state');
  c.setAttribute('r', radius);
  g.appendChild(c);

  const t = document.createElementNS(svgNS, 'text');
  t.classList.add('state-label');
  t.textContent = label;
  g.appendChild(t);

  g.addEventListener('mousedown', startDrag);
  g.addEventListener('click', onStateClick);
  g.addEventListener('dblclick', onStateDblClick);
  canvas.appendChild(g);
  stateCount++;
}

function onStateClick(evt) {
  const g = evt.currentTarget;
  evt.stopPropagation();
  if (evt.altKey) { clearSelection(); toggleStart(g); return; }
  if (evt.shiftKey) { clearSelection(); toggleFinal(g); return; }
  if (connectionSource !== null) {
    const lbl = prompt('Enter transition label:', '');
    if (lbl !== null) drawTrans(connectionSource, g, lbl);
    connectionSource.querySelector('circle').classList.remove('highlight');
    connectionSource = null;
    return;
  }
  clearSelection();
  g.querySelector('circle').classList.add('highlight');
  selectedItem = { type: 'state', element: g };
}

function onStateDblClick(evt) {
  const g = evt.currentTarget;
  evt.stopPropagation();
  clearSelection();
  connectionSource = g;
  g.querySelector('circle').classList.add('highlight');
}

function toggleStart(g) {
  if (startState === g) {
    const m = g.querySelector('.start-marker'); if (m) m.remove();
    g.removeAttribute('data-start');
    startState = null;
  } else {
    if (startState) {
      const mOld = startState.querySelector('.start-marker'); if (mOld) mOld.remove();
      startState.removeAttribute('data-start');
    }
    const mk = document.createElementNS(svgNS, 'polyline');
    mk.classList.add('start-marker');
    const p1 = -radius - 12;
    mk.setAttribute('points', `${p1},-12 ${-radius},0 ${p1},12`);
    g.insertBefore(mk, g.firstChild);
    g.setAttribute('data-start', 'true');
    startState = g;
  }
}

function toggleFinal(group) {
    const isFinal = group.getAttribute('data-final') === 'true';
    group.setAttribute('data-final', (!isFinal).toString());
  
    // Remove existing final marker if present
    const existing = group.querySelector('.inner-state');
    if (existing) {
      existing.remove();
    } else {
      const inner = document.createElementNS(svgNS, 'circle');
      inner.setAttribute('class', 'inner-state');
      inner.setAttribute('r', radius - 6);
  
      // Insert right after the main circle so it's drawn on top
      const mainCircle = group.querySelector('circle.state');
      group.insertBefore(inner, mainCircle.nextSibling);
    }
  }

function drawTrans(src, dst, label) {
  const tg = document.createElementNS(svgNS, 'g');
  tg.classList.add('transition-group');
  tg.dataset.src  = src.dataset.label;
  tg.dataset.dest = dst.dataset.label;
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('stroke', '#333');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  path.setAttribute('marker-end', 'url(#arrow)');
  tg.appendChild(path);

  const txt = document.createElementNS(svgNS, 'text');
  txt.classList.add('transition-label');
  txt.textContent = label;
  tg.appendChild(txt);

  tg.addEventListener('click', onTransClick);
  canvas.insertBefore(tg, canvas.firstChild);

  const tr = { src, dest: dst, group: tg, path, text: txt };
  transitions.push(tr);
  updateTrans(tr);
}

function onTransClick(evt) {
  const tg = evt.currentTarget;
  evt.stopPropagation();
  clearSelection();
  tg.querySelector('path').classList.add('highlight');
  selectedItem = { type: 'transition', element: tg };
}

function updateTrans(tr) {
  const { src, dest, path, text } = tr;
  const s = src.getCTM(), d = dest.getCTM();
  const x1 = s.e, y1 = s.f, x2 = d.e, y2 = d.f;
  if (src === dest) {
    const x = x1, y = y1;
    const loopRadius = radius;
    const offsetX = radius * 2;
    const offsetY = radius * 2;
    const dstr = `M${x},${y - loopRadius}`
               + ` C${x + offsetX},${y - loopRadius - offsetY}`
               + ` ${x - offsetX},${y - loopRadius - offsetY}`
               + ` ${x},${y - loopRadius}`;
    path.setAttribute('d', dstr);
    text.setAttribute('x', x);
    text.setAttribute('y', y - loopRadius - offsetY - 5);
    return;
  }
  const dx = x2 - x1, dy = y2 - y1;
  const ang = Math.atan2(dy, dx);
  const sx = x1 + Math.cos(ang) * radius, sy = y1 + Math.sin(ang) * radius;
  const ex = x2 - Math.cos(ang) * radius, ey = y2 - Math.sin(ang) * radius;
  const mx = (sx + ex) / 2, my = (sy + ey) / 2;
  let nx = dy, ny = -dx;
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const off = 40;
  const cx = mx + nx * off, cy = my + ny * off;
  path.setAttribute('d', `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`);
  text.setAttribute('x', cx);
  text.setAttribute('y', cy - 5);
}

function refreshTrans(moved) {
  transitions.forEach(t => {
    if (t.src === moved || t.dest === moved) updateTrans(t);
  });
}

window.addEventListener('keydown', e => {
  if (e.key === 'Delete' && selectedItem) {
    if (selectedItem.type === 'state') {
      const g = selectedItem.element;
      transitions.filter(t => t.src === g || t.dest === g)
                 .forEach(t => { t.group.remove(); transitions.splice(transitions.indexOf(t), 1); });
      if (g.getAttribute('data-start') === 'true') startState = null;
      g.remove();
    } else {
      const tg = selectedItem.element;
      transitions.splice(transitions.findIndex(t => t.group === tg), 1);
      tg.remove();
    }
    selectedItem = null;
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    clearSelection();
    multiSelect = Array.from(document.querySelectorAll('.state-group'));
    multiSelect.forEach(g => g.querySelector('circle.state').classList.add('highlight'));
  }
});

function startDrag(evt) {
    evt.stopPropagation();
    const targetG = evt.currentTarget;
    if (!multiSelect.includes(targetG)) {
      clearSelection();
      multiSelect = [ targetG ];
      targetG.querySelector('circle.state').classList.add('highlight');
    }
  
    // compute and store offsets for each selected element
    const p = canvas.createSVGPoint();
    p.x = evt.clientX; p.y = evt.clientY;
    const loc = p.matrixTransform(canvas.getScreenCTM().inverse());
  
    dragData = multiSelect.map(g => {
      const ctm = g.getCTM();
      return {
        g,
        offsetX: loc.x - ctm.e,
        offsetY: loc.y - ctm.f
      };
    });
  
    window.addEventListener('mousemove', dragAll);
    window.addEventListener('mouseup',   endDragAll);
  }

  function dragAll(evt) {
    if (!dragData) return;
  
    const p = canvas.createSVGPoint();
    p.x = evt.clientX; p.y = evt.clientY;
    const loc = p.matrixTransform(canvas.getScreenCTM().inverse());
  
    dragData.forEach(item => {
      const dx = loc.x - item.offsetX;
      const dy = loc.y - item.offsetY;
      item.g.setAttribute('transform', `translate(${dx},${dy})`);
      refreshTrans(item.g);
    });
  }
  
  function endDragAll() {
    window.removeEventListener('mousemove', dragAll);
    window.removeEventListener('mouseup',   endDragAll);
    dragData = null;
  }

  canvas.querySelectorAll('.state-group').forEach(g => {
    g.removeEventListener('mousedown', startDrag); // if already bound
    g.addEventListener('mousedown', startDrag);
  });

function drag(evt) {
  if (!selectedElement) return;
  const p = canvas.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
  const loc = p.matrixTransform(canvas.getScreenCTM().inverse());
  const dx = loc.x - offset.x, dy = loc.y - offset.y;
  selectedElement.setAttribute('transform', `translate(${dx},${dy})`);
  refreshTrans(selectedElement);
}

function endDrag() {
  window.removeEventListener('mousemove', drag);
  window.removeEventListener('mouseup', endDrag);
  selectedElement = null;
}
