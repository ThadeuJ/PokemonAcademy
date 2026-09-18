import test from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../src/session.js";

test("cronômetro acumula apenas enquanto a sessão está ativa", () => {
  let currentTime = 0;
  const session = createSession("silhouette", { now: () => currentTime });
  session.start("infinite", {});

  currentTime = 5_000;
  assert.equal(session.elapsed(), 5_000);
  assert.equal(session.pause(), true);

  currentTime = 20_000;
  assert.equal(session.elapsed(), 5_000);
  assert.equal(session.resume(), true);

  currentTime = 23_000;
  assert.equal(session.finish().elapsedMs, 8_000);
  currentTime = 30_000;
  assert.equal(session.elapsed(), 8_000);
});

test("última resposta congela o tempo de uma sessão finita", () => {
  let currentTime = 0;
  const session = createSession("types", { now: () => currentTime });
  session.start("10", {});

  for (let phase = 1; phase <= 10; phase++) {
    currentTime = phase * 1_000;
    const result = session.answer({ correct: true });
    assert.equal(result.finished, phase === 10);
    if (phase < 10) assert.equal(session.next(), true);
  }

  assert.equal(session.state.completed, true);
  assert.equal(session.state.elapsedMs, 10_000);
  currentTime = 50_000;
  assert.equal(session.elapsed(), 10_000);
});

test("reset descarta placar, histórico e cronômetro", () => {
  let currentTime = 0;
  const session = createSession("stronger", { now: () => currentTime });
  session.start("infinite", { gen: "all" });
  currentTime = 2_000;
  session.answer({ correct: false });
  session.reset();

  assert.equal(session.state.active, false);
  assert.equal(session.state.phase, 0);
  assert.equal(session.state.incorrect, 0);
  assert.equal(session.state.elapsedMs, 0);
  assert.deepEqual(session.state.history, []);
});
