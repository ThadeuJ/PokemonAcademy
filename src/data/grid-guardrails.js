let promise;
export function loadGridGuardrails() {
  if (!promise) promise = fetch(new URL('../../data/pokemon-grid-puzzle/guardrails.json', import.meta.url)).then(response => {
    if (!response.ok) throw new Error(`Guardrails indispon?veis (HTTP ${response.status})`);
    return response.json();
  });
  return promise;
}
export const pairKey = (left, right) => [left, right].sort().join('|');
