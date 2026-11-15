// ASTRO LAB — wiring rules for a small solar power system, shared by the training test stand and the lunar outpost.
// Correct layout: every solar panel -> charge controller PV input; controller <-> battery; controller load output -> load bus.
// connect() refuses or warns about the classic mistakes and says why, so the same lesson is taught in both places.

// Port kinds: 'pv' (panel output), 'ctrl-pv', 'ctrl-batt', 'ctrl-load', 'batt', 'bus'
const RULES = {
  'pv|ctrl-pv': { ok: true },
  'ctrl-batt|batt': { ok: true },
  'ctrl-load|bus': { ok: true },
  'pv|batt': { ok: false, why: 'A solar panel must never go straight to the battery: the charge controller is what stops it overcharging and overheating.' },
  'pv|bus': { ok: false, why: 'Panel power goes up and down with the sunlight. The machines need steady power, so it has to go through the charge controller first.' },
  'batt|bus': { ok: false, why: 'This would bypass the controller, which protects the battery from being drained so far that it is damaged.' },
  'pv|pv': { ok: false, why: 'Joining two panels together here does nothing useful: each panel has its own lead into the controller.' },
  'ctrl-pv|batt': { ok: false, why: 'That is the controller\'s panel input. The battery goes on the BATTERY terminal.' },
  'ctrl-batt|bus': { ok: false, why: 'That is the controller\'s battery terminal. The machines go on the LOAD output.' },
  'ctrl-load|batt': { ok: false, why: 'That is the controller\'s load output. The battery goes on the BATTERY terminal.' },
  'ctrl-pv|bus': { ok: false, why: 'That is the controller\'s panel input. The machines go on the LOAD output.' },
  'ctrl-load|pv': { ok: false, why: 'Panels plug into the controller\'s PV input, not its load output.' },
  'ctrl-batt|pv': { ok: false, why: 'Panels plug into the controller\'s PV input, not its battery terminal.' }
};
const key = (a, b) => RULES[`${a}|${b}`] ? `${a}|${b}` : `${b}|${a}`;

export class Wiring {
  // ports: [{ id, kind, owner }] (owner = the panel id for 'pv' ports)
  constructor(ports) { this.ports = new Map(ports.map(p => [p.id, p])); this.cables = []; }
  port(id) { return this.ports.get(id); }
  connected(id) { return this.cables.some(c => c.a === id || c.b === id); }
  // returns { ok, why?, cable? }; a refused cable is not added
  connect(aId, bId) {
    const a = this.port(aId), b = this.port(bId);
    if (!a || !b) return { ok: false, why: 'Unknown socket.' };
    if (aId === bId) return { ok: false, why: 'Both ends are on the same socket.' };
    const r = RULES[key(a.kind, b.kind)] || { ok: false, why: 'Those two sockets don\'t belong together.' };
    if (!r.ok) return { ok: false, why: r.why };
    const single = p => p.kind !== 'ctrl-pv';             // the controller's PV input takes several panel leads
    if (single(a) && this.connected(aId)) return { ok: false, why: 'That socket already has a cable.' };
    if (single(b) && this.connected(bId)) return { ok: false, why: 'That socket already has a cable.' };
    const cable = { a: aId, b: bId }; this.cables.push(cable);
    return { ok: true, cable };
  }
  disconnect(cable) { this.cables = this.cables.filter(c => c !== cable); }
  // what the layout achieves
  status() {
    const has = (k1, k2) => this.cables.some(c => { const x = this.port(c.a).kind, y = this.port(c.b).kind; return (x === k1 && y === k2) || (x === k2 && y === k1); });
    const panels = this.cables.map(c => [this.port(c.a), this.port(c.b)]).filter(([x, y]) => (x.kind === 'pv' && y.kind === 'ctrl-pv') || (y.kind === 'pv' && x.kind === 'ctrl-pv')).map(([x, y]) => (x.kind === 'pv' ? x : y).owner);
    const battery = has('ctrl-batt', 'batt'), bus = has('ctrl-load', 'bus');
    const allPanels = [...this.ports.values()].filter(p => p.kind === 'pv').map(p => p.owner);
    return { panels, battery, bus, complete: battery && bus && allPanels.every(id => panels.includes(id)) };
  }
  // copy the layout into an Outpost simulation
  apply(sim) {
    const s = this.status();
    for (const p of sim.panels) p.connected = s.panels.includes(p.id);
    sim.battery.connected = s.battery; sim.busConnected = s.bus;
    return s;
  }
}
