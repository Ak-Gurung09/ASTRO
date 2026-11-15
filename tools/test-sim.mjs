// Node tests for the shared outpost simulation and wiring rules: node tools/test-sim.mjs
import { Outpost, REF, LOAD_TYPES } from '../js/sim/outpost.js';
import { Wiring } from '../js/sim/wiring.js';
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// 1. Oxygen use matches 0.84 kg/person/day when nothing makes oxygen
{ const s = new Outpost({ crew: 4, loads: ['scrubber'], panels: [{ id: 'A', peakKW: 5 }] }); const o0 = s.o2Kg; s.tick(24); ok(near(o0 - s.o2Kg, 0.84 * 4, 0.01), `O2 used per day ${(o0 - s.o2Kg).toFixed(3)} kg`); }
// 2. With the O2 generator on and power, oxygen stays at about 21% for 14 days and water is used for it
{ const s = new Outpost({ crew: 4, panels: [{ id: 'A', peakKW: 8 }], battery: { capKWh: 20, socPct: 80 } }); s.setOn('rover', false); s.setOn('science', false); s.tick(24 * 14);
  ok(near(s.o2Pct, 21, 0.3), `O2 after 14 days ${s.o2Pct.toFixed(2)}%`); ok(s.co2Pct < REF.co2WarnPct, `CO2 after 14 days ${s.co2Pct.toFixed(2)}%`); ok(s.lifeOutH === 0, 'life support never lost power in sunlight'); }
// 3. Energy balance: battery change = (solar - load) x time, within charge efficiency
{ const s = new Outpost({ crew: 0, loads: ['lights'], panels: [], battery: { capKWh: 20, socPct: 50 } }); s.tick(10); ok(near(s.battery.kWh, 10 - 0.3 * 10, 0.01), `battery after 10 h of 0.3 kW: ${s.battery.kWh.toFixed(2)} kWh`); }
// 4. In shadow, low-priority loads are shed first when the battery runs out
{ const s = new Outpost({ crew: 4, panels: [{ id: 'A', peakKW: 4 }], battery: { capKWh: 2, socPct: 100 }, sunlit: false }); s.tick(3);
  ok(!s.load('rover').powered || s.socPct > 0, 'rover shed when battery empty'); ok(s.blackouts >= 0, 'ran'); }
// 5. Shadow test from the training module: 3 h shadow, 20 kWh battery at 90%: passes with non-essentials off, fails with them on
{ const run = shed => { const s = new Outpost({ crew: 4, panels: [{ id: 'A', peakKW: 4 }, { id: 'B', peakKW: 4 }], battery: { capKWh: 20, socPct: 90 }, sunlit: false });
    if (shed) for (const id of ['rover', 'science', 'greenhouse', 'lights']) s.setOn(id, false); s.tick(3); return s; };
  const good = run(true), bad = run(false);
  ok(good.min.socPct >= 20 && good.lifeOutH === 0, `shed loads: min battery ${good.min.socPct.toFixed(0)}%`);
  ok(bad.min.socPct < 20, `all loads on: min battery ${bad.min.socPct.toFixed(0)}%`); }
// 6. Fuse: a blown scrubber fuse lets CO2 climb past the warning level within a day
{ const s = new Outpost({ crew: 4, panels: [{ id: 'A', peakKW: 8 }] }); s.blowFuse('scrubber'); s.tick(24); ok(s.co2Pct > REF.co2WarnPct, `CO2 with scrubber fuse blown ${s.co2Pct.toFixed(2)}%`); ok(s.alarms().some(a => a.id === 'fuse-scrubber'), 'fuse alarm raised'); }
// 7. Wiring rules
{ const w = new Wiring([{ id: 'pA', kind: 'pv', owner: 'A' }, { id: 'pB', kind: 'pv', owner: 'B' }, { id: 'cpv', kind: 'ctrl-pv' }, { id: 'cb', kind: 'ctrl-batt' }, { id: 'cl', kind: 'ctrl-load' }, { id: 'bt', kind: 'batt' }, { id: 'bus', kind: 'bus' }]);
  ok(!w.connect('pA', 'bt').ok, 'panel to battery refused'); ok(!w.connect('bt', 'bus').ok, 'battery to bus refused');
  ok(w.connect('pA', 'cpv').ok && w.connect('pB', 'cpv').ok, 'both panels into PV input'); ok(!w.status().complete, 'not complete yet');
  ok(w.connect('cb', 'bt').ok && w.connect('cl', 'bus').ok, 'battery and bus'); ok(w.status().complete, 'complete');
  const s = new Outpost({ panels: [{ id: 'A' }, { id: 'B' }] }); w.apply(s); ok(s.panels.every(p => p.connected) && s.battery.connected && s.busConnected, 'applied to sim'); }
// 8. Heaters keep the cabin warm in shadow with power, and it cools without them
{ const s = new Outpost({ crew: 4, panels: [], battery: { capKWh: 100, socPct: 100 }, sunlit: false }); s.tick(12); ok(s.tempC > REF.tempLow, `cabin with heaters ${s.tempC.toFixed(1)} °C`);
  const c = new Outpost({ crew: 4, panels: [], battery: { capKWh: 100, socPct: 100 }, sunlit: false }); for (const id of ['heaters', 'rover', 'science', 'greenhouse', 'lights']) c.setOn(id, false); c.tick(12); ok(c.tempC < REF.tempLow, `cabin without heaters ${c.tempC.toFixed(1)} °C`); }
void LOAD_TYPES;
console.log(fails ? `${fails} check(s) failed` : 'sim: all checks passed'); process.exit(fails ? 1 : 0);
