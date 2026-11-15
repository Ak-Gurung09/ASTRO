// ASTRO LAB Career — the power and life-support panel. The SAME panel opens on the Academy test stand and on the Moon,
// so what the player practises in training is exactly what they use on the mission.
// sim = an Outpost (js/sim/outpost.js). The panel reads it live; switches and priorities write back to it.
import { h, openModal } from '../../ui/dom.js';

const f1 = n => (Math.round(n * 10) / 10).toFixed(1);
const hrs = x => !isFinite(x) ? '—' : x > 99 ? '99+ h' : x >= 1 ? `${f1(x)} h` : `${Math.round(x * 60)} min`;

// opts: { title, sub, canEdit = true, review: () => void (shows "Review training"), onChange: (what) => void, onClose }
export function openPowerPanel(sim, { title = 'Power and life support', sub = '', canEdit = true, review, onChange, onClose } = {}) {
  const body = h('div', { class: 'cx-power' });
  const foot = [];
  if (review) foot.push(h('button', { class: 'btn', onclick: () => review() }, '📘 Review training'));
  const closeBtn = h('button', { class: 'btn primary' }, 'Close ▸'); foot.push(closeBtn);
  let timer = null, lastSig = '';
  const m = openModal({ title, label: title, wide: true, body, foot, onClose: () => { clearInterval(timer); onClose?.(); } });
  closeBtn.onclick = () => m.close();

  const top = h('div', { class: 'cx-pw-top' }), env = h('div', { class: 'cx-pw-env' }), table = h('div', { class: 'cx-pw-loads', role: 'table', 'aria-label': 'Machines on the power bus' }), alarms = h('div', { class: 'cx-pw-alarms', 'aria-live': 'polite' });
  if (sub) body.append(h('p', { class: 'muted' }, sub));
  body.append(top, env, h('h3', {}, 'Machines (most essential at the top)'), table, alarms);

  const tile = (label, value, cls = '', note = '') => h('div', { class: `cx-pw-tile ${cls}` }, h('small', {}, label), h('b', {}, value), note ? h('small', { class: 'muted' }, note) : null);
  function render() {
    const soc = sim.socPct, net = sim.netKW;
    top.replaceChildren(
      tile('Solar in', `${f1(sim.solarKW)} kW`, sim.solarKW > 0.05 ? 'good' : 'warn', sim.sun < 0.05 ? 'no sunlight' : `${Math.round(sim.sun * 100)}% sun`),
      tile('Machines use', `${f1(sim.loadKW)} kW`),
      tile(net >= 0 ? 'Charging' : 'Draining', `${net >= 0 ? '+' : ''}${f1(net)} kW`, net >= 0 ? 'good' : 'warn'),
      h('div', { class: `cx-pw-tile cx-pw-batt ${soc < 10 ? 'bad' : soc < 20 ? 'warn' : 'good'}` }, h('small', {}, `Battery ${sim.battery.connected ? '' : '(not connected)'}`), h('b', {}, `${Math.round(soc)}%`),
        h('div', { class: 'cx-pw-bar', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(soc), 'aria-label': 'Battery charge' }, h('i', { style: `width:${Math.max(0, Math.min(100, soc))}%` }), h('em', { style: 'left:20%' })),
        h('small', { class: 'muted' }, `${f1(sim.battery.kWh)} of ${sim.battery.capKWh} kWh · lasts ${hrs(sim.reserveHours('battery'))}`))
    );
    env.replaceChildren(
      tile('Oxygen', `${f1(sim.o2Pct)}%`, sim.o2Pct < 19.5 ? 'bad' : 'good', 'safe 19.5 to 23.5%'),
      tile('CO2', `${sim.co2Pct.toFixed(2)}%`, sim.co2Pct > 1 ? 'bad' : sim.co2Pct > 0.5 ? 'warn' : 'good', 'keep under 0.5%'),
      tile('Cabin', `${Math.round(sim.tempC)} °C`, sim.tempC < 15 || sim.tempC > 30 ? 'bad' : sim.tempC < 18 || sim.tempC > 27 ? 'warn' : 'good', '18 to 27 °C'),
      tile('Water', `${Math.round(sim.waterL)} L`, sim.waterL < 50 ? 'warn' : 'good')
    );
    const rows = sim.byPriority();
    const sig = rows.map(l => [l.id, l.on, l.powered, l.fuseBlown, l.starved].join(':')).join('|') + canEdit;
    if (sig !== lastSig) { lastSig = sig; const focusId = document.activeElement?.dataset?.pw; table.replaceChildren(h('div', { class: 'cx-pw-row head', role: 'row' }, h('span', {}, 'Machine'), h('span', {}, 'Power'), h('span', {}, 'Status'), h('span', {}, 'Switch'), h('span', {}, 'Priority')),
      ...rows.map((l, i) => {
        const status = l.fuseBlown ? ['Fuse blown', 'bad'] : !l.on ? ['Off', 'muted'] : l.powered ? ['Running', 'good'] : l.starved ? ['No power', 'bad'] : ['Standby', 'muted'];
        return h('div', { class: 'cx-pw-row', role: 'row' },
          h('span', {}, l.life ? h('b', { title: 'Life support' }, '♥ ') : null, l.name),
          h('span', {}, `${l.kW} kW`),
          h('span', { class: status[1] }, status[0]),
          h('span', {}, h('button', { 'data-pw': 'sw-' + l.id, class: `btn small ${l.on ? 'on' : ''}`, disabled: !canEdit, 'aria-pressed': String(l.on), 'aria-label': `${l.name} ${l.on ? 'on' : 'off'}`, onclick: () => { l.on = !l.on; onChange?.({ kind: 'switch', id: l.id, on: l.on }); lastSig = ''; render(); } }, l.on ? 'ON' : 'OFF')),
          h('span', { class: 'cx-pw-prio' },
            h('button', { 'data-pw': 'up-' + l.id, class: 'btn small', disabled: !canEdit || i === 0, 'aria-label': `Move ${l.name} up`, onclick: () => { const a = rows[i - 1]; [a.priority, l.priority] = [l.priority, a.priority]; onChange?.({ kind: 'priority', id: l.id }); lastSig = ''; render(); } }, '▲'),
            h('button', { 'data-pw': 'dn-' + l.id, class: 'btn small', disabled: !canEdit || i === rows.length - 1, 'aria-label': `Move ${l.name} down`, onclick: () => { const b = rows[i + 1]; [b.priority, l.priority] = [l.priority, b.priority]; onChange?.({ kind: 'priority', id: l.id }); lastSig = ''; render(); } }, '▼')));
      }));
      if (focusId) table.querySelector(`[data-pw="${focusId}"]`)?.focus(); }
    const al = sim.alarms();
    alarms.replaceChildren(...(al.length ? al.map(a => h('div', { class: `cx-pw-alarm ${a.level}` }, a.level === 'critical' ? '⛔ ' : '⚠ ', a.text)) : [h('div', { class: 'cx-pw-alarm ok' }, '✓ No alarms')]));
  }
  render();
  timer = setInterval(render, 300);
  return { close: () => m.close(), render };
}

// one-line HUD readout rows for the same numbers (used while the panel is closed)
export function powerReadout(sim) {
  const soc = sim.socPct;
  return [['Battery', `${Math.round(soc)}%`, soc < 10 ? 'bad' : soc < 20 ? 'warn' : 'good'], ['Solar', `${f1(sim.solarKW)} kW`, sim.solarKW > 0.05 ? 'good' : 'warn'], ['Net', `${sim.netKW >= 0 ? '+' : ''}${f1(sim.netKW)} kW`, sim.netKW >= 0 ? 'good' : 'warn'], ['O2 / CO2', `${f1(sim.o2Pct)}% / ${sim.co2Pct.toFixed(2)}%`, sim.co2Pct > 0.5 ? 'warn' : 'good']];
}
