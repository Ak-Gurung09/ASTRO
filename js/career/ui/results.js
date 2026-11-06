// ASTRO LAB Career — the results card shown after every exercise.
import { h, openModal } from '../../ui/dom.js';
import { BADGE_MAP } from '../../data/missions.js';
import { bus } from '../../systems/core.js';

export function stars(score) { return score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0; }
export function openResults({ title, chapter = false, passed = true, score = 100, mistakes = [], science = '', rewards = {}, next = '', onContinue, continueLabel = 'Continue' }) {
  const st = stars(score);
  bus.emit('sfx', passed ? 'complete' : 'wrong');
  const body = h('div', { class: 'cx-results' },
    h('div', { class: `cx-status ${passed ? 'ok' : 'retry'}` }, chapter ? '✓ CHAPTER COMPLETE' : passed ? '✓ COMPLETE' : '↻ TRY AGAIN'),
    chapter ? null : h('div', { class: 'cx-score' }, h('b', {}, `${score}`), h('small', {}, '/100'), h('span', { class: 'cx-stars', 'aria-label': `${st} of 3 stars` }, '★'.repeat(st) + '☆'.repeat(3 - st))),
    chapter ? null : h('h3', {}, 'Mistakes'),
    chapter ? null : mistakes.length ? h('ul', { class: 'cx-mistakes' }, mistakes.map(m => h('li', {}, m))) : h('p', { class: 'muted' }, 'None. Clean run.'),
    science ? [h('h3', {}, chapter ? '🔬 Did you know?' : '🔬 The science'), h('p', {}, science)] : null,
    h('h3', {}, 'Rewards'),
    h('div', { class: 'chips' },
      rewards.xp ? h('span', { class: 'chip' }, `✨ +${rewards.xp} XP`) : null,
      ...(rewards.badges || [rewards.badge]).filter(b => b && BADGE_MAP[b]).map(b => h('span', { class: 'chip' }, `${BADGE_MAP[b].icon} ${BADGE_MAP[b].name}`)),
      rewards.card ? h('span', { class: 'chip' }, `🃏 ${rewards.card}`) : null,
      !rewards.xp && !rewards.badge && !rewards.card ? h('span', { class: 'muted' }, 'Already earned on an earlier run.') : null),
    next ? [h('h3', {}, 'Next objective'), h('p', { class: 'cx-next-obj' }, next)] : null);
  const m = openModal({ title, label: `${title} results`, body, closable: false, foot: [h('button', { class: 'btn primary', onclick: () => { m.close(); onContinue?.(); } }, continueLabel)] });
  return m;
}
