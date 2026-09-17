const MODES = {infinite: null, '10': 10, '20': 20, '30': 30};

export function createSession(gameId) {
  let state = fresh('10');
  function fresh(mode, filters) { return {gameId, mode, filters, phase: 0, correct: 0, incorrect: 0, score: 0, streak: 0, answered: false, active: false, history: []}; }
  return {
    get state() { return state; },
    start(mode, filters) { state = fresh(mode, filters); state.active = true; return state; },
    answer(record) {
      const correct = !!record?.correct;
      if (!state.active || state.answered) return {accepted: false, finished: false};
      state.answered = true; state.phase++; correct ? state.correct++ : state.incorrect++;
      state.history = [...state.history, {...record, phase: state.phase, correct}].slice(-10);
      if (correct) { state.streak++; state.score += 10 + Math.min(state.streak - 1, 5) * 2; } else state.streak = 0;
      return {accepted: true, finished: state.mode !== 'infinite' && state.phase >= MODES[state.mode]};
    },
    next() { if (!state.active || !state.answered) return false; state.answered = false; return true; },
    refresh() { if (state.active) state.answered = false; },
    finish() { state.active = false; return state; },
    isFinite() { return state.mode !== 'infinite'; },
    limit() { return MODES[state.mode]; }
  };
}

export const modeLabel = mode => mode === 'infinite' ? 'Infinito' : `${mode} fases`;
