// src/components/Autocomplete/api.ts

export function searchCities(
  q: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const data = [
      "Boston",
      "Bogotá",
      "Buenos Aires",
      "Bangalore",
      "Berlin",
      "Barcelona",
      "Beijing",
      "Brisbane",
    ];

    const id = window.setTimeout(() => {
      const res = data.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
      resolve(res);
    }, 400);

    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
