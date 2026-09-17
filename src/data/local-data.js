export function createLocalData({ manifest, readJson }) {
  const resource = name => manifest.resources?.[name];
  const indexes = new Map();
  const segments = new Map();
  const index = async name => indexes.has(name) ? indexes.get(name) : (async () => { const value = await readJson(resource(name)?.index); indexes.set(name, value || []); return value || []; })();
  return {
    async get(name, id) {
      const config = resource(name); if (!config) return undefined;
      const numericId = Number(id);
      const target = Number.isNaN(numericId) ? (await index(name)).find(item => item.name === id || item.names?.en === id || item.names?.pt === id)?.id : numericId;
      const segment = config.segments?.find(item => target >= item.from && target <= item.to);
      if (!segment) return undefined;
      const values = segments.has(segment.file) ? segments.get(segment.file) : (() => { const promise = readJson(segment.file); segments.set(segment.file, promise); return promise; })();
      return (await values)[String(target)];
    },
    async list(name, params = '') { const config = resource(name); if (!config) return undefined; if (new URLSearchParams(params).has('full')) { const values = await Promise.all(config.segments.map(segment => { if (segments.has(segment.file)) return segments.get(segment.file); const promise = readJson(segment.file); segments.set(segment.file, promise); return promise; })); return { count: (await index(name)).length, results: values.flatMap(value => Object.values(value)) }; } return { count: (await index(name)).length, results: await index(name) }; },
    async manifest() { return manifest; }
  };
}

export function createBrowserLocalData({ baseUrl = new URL('../../data/pokeapi/', import.meta.url), fetchImpl = globalThis.fetch } = {}) {
  const readJson = async file => { const relative = file.replace(/^data\/pokeapi\//, ''); const response = await fetchImpl(new URL(relative, baseUrl)); if (!response.ok) throw new Error(`Snapshot indisponível: ${file}`); return response.json(); };
  return readJson('manifest.json').then(manifest => createLocalData({ manifest, readJson }));
}
