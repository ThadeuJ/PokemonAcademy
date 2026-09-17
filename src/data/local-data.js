export function createLocalData({ manifest, readJson }) {
  const resource = name => manifest.resources?.[name];
  const indexes = new Map();
  const index = async name => indexes.has(name) ? indexes.get(name) : (async () => { const value = await readJson(resource(name)?.index); indexes.set(name, value || []); return value || []; })();
  return {
    async get(name, id) {
      const config = resource(name); if (!config) return undefined;
      const numericId = Number(id);
      const target = Number.isNaN(numericId) ? (await index(name)).find(item => item.name === id || item.names?.en === id || item.names?.pt === id)?.id : numericId;
      const segment = config.segments?.find(item => target >= item.from && target <= item.to);
      return segment ? (await readJson(segment.file))[String(target)] : undefined;
    },
    async list(name) { const config = resource(name); return config ? { count: (await index(name)).length, results: await index(name) } : undefined; },
    async manifest() { return manifest; }
  };
}

export function createBrowserLocalData({ baseUrl = new URL('../../data/pokeapi/', import.meta.url), fetchImpl = globalThis.fetch } = {}) {
  const readJson = async file => { const relative = file.replace(/^data\/pokeapi\//, ''); const response = await fetchImpl(new URL(relative, baseUrl)); if (!response.ok) throw new Error(`Snapshot indisponível: ${file}`); return response.json(); };
  return readJson('manifest.json').then(manifest => createLocalData({ manifest, readJson }));
}
