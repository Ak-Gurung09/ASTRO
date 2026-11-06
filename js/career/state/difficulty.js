// ASTRO LAB Career — one difficulty table that every training module reads.
import { settings } from '../../systems/core.js';

export const DIFFICULTIES = {
  easy: {
    id: 'easy', name: 'Easy', blurb: 'Generous supplies, no timers, wide tolerances. Good for learning.',
    budget: 1.5, timeLimit: null, quizOptions: 3, quizPool: 'basic', tolerance: 1.6, faults: 'single',
    drift: 0.5, randomEvents: false, scoreMult: 0.8, mistakePenalty: 5, hints: true
  },
  normal: {
    id: 'normal', name: 'Normal', blurb: 'Standard supplies and timers. The intended experience.',
    budget: 1, timeLimit: 1.5, quizOptions: 4, quizPool: 'standard', tolerance: 1, faults: 'single',
    drift: 1, randomEvents: false, scoreMult: 1, mistakePenalty: 8, hints: true
  },
  hard: {
    id: 'hard', name: 'Hard', blurb: '20% fewer supplies, tight timers, linked spacecraft faults.',
    budget: 0.8, timeLimit: 1, quizOptions: 4, quizPool: 'hard', tolerance: 0.7, faults: 'linked',
    drift: 1.6, randomEvents: false, scoreMult: 1.2, mistakePenalty: 10, hints: true
  },
  realistic: {
    id: 'realistic', name: 'Realistic', blurb: '35% fewer supplies, no refunds, chained faults, random greenhouse events, no hints.',
    budget: 0.65, timeLimit: 1, quizOptions: 4, quizPool: 'hard', tolerance: 0.6, faults: 'chained',
    drift: 1.6, randomEvents: true, scoreMult: 1.5, mistakePenalty: 12, hints: false
  }
};
export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'realistic'];
export function difficulty() { return DIFFICULTIES[settings.difficulty] || DIFFICULTIES.normal; }
