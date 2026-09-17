export function createCache({ storage, prefix = 'pokeacademy:data:' } = {}) {
  const memory = new Map();
  const pending = new Map();
  const read = key => {
    if (memory.has(key)) return memory.get(key);
    try { const value = storage?.getItem(prefix + key); if (value !== null) { const parsed = JSON.parse(value); memory.set(key, parsed); return parsed; } } catch {}
    return undefined;
  };
  return {
    get: read,
    has: key => read(key) !== undefined,
    set: (key, value) => { memory.set(key, value); try { storage?.setItem(prefix + key, JSON.stringify(value)); } catch {} return value; },
    delete: key => { memory.delete(key); try { storage?.removeItem(prefix + key); } catch {} },
    clear: () => memory.clear()
    ,async getOrSet(key, loader) {
      if (memory.has(key)) return memory.get(key);
      if (pending.has(key)) return pending.get(key);
      const promise = Promise.resolve().then(loader).then(value => { memory.set(key, value); pending.delete(key); return value; }, error => { pending.delete(key); throw error; });
      pending.set(key, promise);
      return promise;
    }
  };
}
