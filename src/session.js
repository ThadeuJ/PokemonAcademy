const MODES = { infinite: null, 10: 10, 20: 20, 30: 30 };

const defaultNow = () => globalThis.performance?.now?.() ?? Date.now();

export function createSession(gameId, { now = defaultNow } = {}) {
  let state = fresh("10");
  function fresh(mode, filters) {
    return {
      gameId,
      mode,
      filters,
      phase: 0,
      correct: 0,
      incorrect: 0,
      score: 0,
      streak: 0,
      answered: false,
      active: false,
      completed: false,
      paused: false,
      elapsedMs: 0,
      startedAt: null,
      history: [],
    };
  }
  function elapsed() {
    return (
      state.elapsedMs +
      (state.active && !state.paused && state.startedAt !== null
        ? Math.max(0, now() - state.startedAt)
        : 0)
    );
  }
  function freeze() {
    state.elapsedMs = elapsed();
    state.startedAt = null;
  }
  return {
    get state() {
      return state;
    },
    start(mode, filters) {
      state = fresh(mode, filters);
      state.active = true;
      state.startedAt = now();
      return state;
    },
    answer(record) {
      const correct = !!record?.correct;
      if (!state.active || state.answered)
        return { accepted: false, finished: false };
      state.answered = true;
      state.phase++;
      correct ? state.correct++ : state.incorrect++;
      state.history = [
        ...state.history,
        { ...record, phase: state.phase, correct },
      ].slice(-10);
      if (correct) {
        state.streak++;
        state.score += 10 + Math.min(state.streak - 1, 5) * 2;
      } else state.streak = 0;
      const finished =
        state.mode !== "infinite" && state.phase >= MODES[state.mode];
      if (finished) {
        freeze();
        state.completed = true;
      }
      return { accepted: true, finished };
    },
    next() {
      if (!state.active || !state.answered) return false;
      state.answered = false;
      return true;
    },
    refresh() {
      if (state.active) state.answered = false;
    },
    elapsed,
    pause() {
      if (!state.active || state.paused || state.completed) return false;
      freeze();
      state.paused = true;
      return true;
    },
    resume() {
      if (!state.active || !state.paused || state.completed) return false;
      state.paused = false;
      state.startedAt = now();
      return true;
    },
    finish() {
      if (state.active && !state.completed) freeze();
      state.active = false;
      state.completed = true;
      return state;
    },
    reset() {
      state = fresh("10");
      return state;
    },
    isFinite() {
      return state.mode !== "infinite";
    },
    limit() {
      return MODES[state.mode];
    },
  };
}

export const modeLabel = (mode) =>
  mode === "infinite" ? "Infinito" : `${mode} fases`;
