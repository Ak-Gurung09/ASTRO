// ASTRO LAB Career — the training dashboard terminal: your ID, level, every module's status, and Start for the next one.
import { h, openModal } from '../../ui/dom.js';
import { progress } from '../../systems/core.js';
import { career, playerLevel, levelRange } from '../state/careerSave.js';
import { MODULES, moduleState } from '../data/modules.js';
import { drawIdCard } from './idCard.js';

export function openDashboard({ onStart, intro = '' } = {}) {
  const c = career(), lv = playerLevel(), [a, b] = levelRange(lv), pct = Math.round((progress.xp - a) / (b - a) * 100);
  const card = h('canvas', { width: 640, height: 400 }); drawIdCard(card.getContext('2d'), { name: c.player.name, idNo: c.player.idNo, look: c.player.look });
  const done = MODULES.filter(m => !m.practiceOnly && moduleState(m.id) === 'done').length, total = MODULES.filter(m => !m.practiceOnly).length;
  let m;
  const rows = MODULES.filter(md => !md.practiceOnly).map(md => {
    const st = moduleState(md.id), t = c.training[md.id];
    const label = { done: `✓ Done · best ${t?.best ?? 100}/100`, open: '▶ Ready to start', locked: '🔒 Finish the earlier modules first', soon: '🛠 Coming in a later build' }[st];
    const canStart = (st === 'open' || st === 'done') && md.scene && !md.storyOnly;
    return h('div', { class: `cx-module ${st === 'locked' || st === 'soon' ? 'locked' : ''}` },
      h('span', { class: 'cx-mi' }, st === 'locked' || st === 'soon' ? '🔒' : md.icon),
      h('div', {}, h('b', {}, md.name), h('small', {}, md.desc), h('small', { class: st === 'done' ? 'good' : st === 'open' ? '' : 'muted' }, label)),
      canStart ? h('button', { class: `btn sm ${st === 'open' ? 'primary' : ''}`, onclick: () => { m.close(); onStart?.(md); } }, st === 'done' ? 'Replay' : 'Start') : null);
  });
  m = openModal({ title: '🖥 Training dashboard', label: 'Training dashboard', wide: true, body: h('div', {},
    intro ? h('p', {}, intro) : null,
    h('div', { class: 'cx-dash-head' }, card, h('div', {}, h('b', {}, `${c.player.name || 'Cadet'} · ${c.player.idNo || ''}`), h('p', { class: 'muted tiny' }, `Level ${lv} · ${progress.xp} XP · ${done} of ${total} modules complete`),
      h('div', { class: 'xpbar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: `width:${pct}%` })))),
    h('div', { class: 'cx-modules' }, rows)) });
  return m;
}
