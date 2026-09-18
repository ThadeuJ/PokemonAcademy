import test from "node:test";
import assert from "node:assert/strict";
import { formatDuration } from "../src/duration.js";

test("formata durações sem limitar a quantidade de horas", () => {
  assert.equal(formatDuration(0), "00:00");
  assert.equal(formatDuration(65_000), "01:05");
  assert.equal(formatDuration(3_661_000), "1:01:01");
  assert.equal(formatDuration(360_000_000), "100:00:00");
});

test("normaliza durações negativas ou inválidas", () => {
  assert.equal(formatDuration(-1_000), "00:00");
  assert.equal(formatDuration(Number.POSITIVE_INFINITY), "00:00");
  assert.equal(formatDuration("inválido"), "00:00");
});
