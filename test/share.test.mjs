import test from "node:test";
import assert from "node:assert/strict";
import { createShareUrl, decodeShareUrl } from "../src/share.js";

const encode = (value) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

test("link compartilhado preserva a duração total", () => {
  const previousLocation = globalThis.location;
  globalThis.location = {
    origin: "https://example.test",
    pathname: "/academy/",
  };
  try {
    const url = createShareUrl("Quem é esse Pokémon?", {
      correct: 1,
      incorrect: 0,
      elapsedMs: 65_432,
      filters: {},
      history: [],
    });
    const decoded = decodeShareUrl(url.split("/share/")[1]);
    assert.equal(decoded.elapsedMs, 65_432);
    assert.equal(decoded.correct, 1);
  } finally {
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
  }
});

test("link v2 sem duração continua válido", () => {
  const payload = encode({ v: 2, g: "Jogo antigo", c: 2, i: 1, f: {}, h: [] });
  const decoded = decodeShareUrl(payload);
  assert.equal(decoded.elapsedMs, 0);
  assert.equal(decoded.game, "Jogo antigo");
});
