export function createApi({ baseUrl = 'https://pokeapi.co/api/v2', fetchImpl = globalThis.fetch, timeout = 10000, retries = 2 } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Fetch não está disponível');
  return async path => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetchImpl(new URL(path.replace(/^\/+/, ''), baseUrl.replace(/\/+$/, '') + '/'), { signal: controller.signal });
        if (!response.ok) throw new Error(`PokéAPI respondeu HTTP ${response.status}`);
        return await response.json();
      } catch (error) { lastError = error; if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt)); }
      finally { clearTimeout(timer); }
    }
    throw lastError;
  };
}
