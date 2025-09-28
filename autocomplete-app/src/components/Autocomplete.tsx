import React, { useEffect, useRef, useState, useId } from "react";

/*
Step-by-step / resumo (lê o código completo abaixo na mesma arquivo):
1) A fake API `searchCities` (fornecida no enunciado) está incluída.
2) Componente <Autocomplete /> implementado em TypeScript com:
   - debounce de 300ms
   - cancelamento de requisições em voo com AbortController
   - cache por query (Map)
   - navegação por teclado (ArrowUp/ArrowDown, Enter, Esc)
   - roles ARIA (combobox, listbox, option) e aria-activedescendant
   - fecha o dropdown ao clicar fora
3) Um componente demo (default export) mostra como usar o componente.

Como usar
- Copie este arquivo para `src/components/Autocomplete.tsx` no seu projeto React+TS.
- Importe onde precisar: `import Autocomplete from './components/Autocomplete';` e use `<Autocomplete onSelect={v => console.log(v)} />`.

Observações técnicas
- Usa `useId()` (React 18+) para gerar ids únicos. Se sua versão for anterior, troque por um gerador de id.
- A fake API demora 400ms (intencional): o debounce de 300ms + a latência da API simula cancelamentos em digitação rápida.
*/

// --- Fake API (mesma função do enunciado) ---
export function searchCities(
  q: string,
  { signal }: { signal?: AbortSignal } = {}
) {
  return new Promise<string[]>((resolve, reject) => {
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

// --- Autocomplete component ---
interface AutocompleteProps {
  placeholder?: string;
  onSelect?: (value: string) => void;
  minQueryLength?: number; // default 1
}

export function Autocomplete({
  placeholder = "Buscar cidade...",
  onSelect,
  minQueryLength = 1,
}: AutocompleteProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const cacheRef = useRef<Map<string, string[]>>(new Map());

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const listboxId = `${uid}-listbox`;

  // Cleanup on unmount: abort any in-flight request and clear timeouts
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Main effect: debounce + fetch + cache + abort
  useEffect(() => {
    // clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const q = query.trim();
    if (q.length < minQueryLength) {
      // if query too short, clear results and stop
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      // use cached value when available
      if (cacheRef.current.has(q)) {
        setResults(cacheRef.current.get(q) || []);
        setLoading(false);
        setHighlightedIndex(-1);
        return;
      }

      // cancel previous in-flight request
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await searchCities(q, { signal: controller.signal });
        cacheRef.current.set(q, res);
        setResults(res);
      } catch (err: unknown) {
        // ignore abort errors (expected behavior when user types fast)
        if (err instanceof DOMException && err.name === "AbortError") {
          // aborted - do nothing
        } else {
          // unexpected
          console.error(err);
        }
      } finally {
        setLoading(false);
        controllerRef.current = null;
        setHighlightedIndex(-1);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query, minQueryLength]);

  // keyboard handling
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (results.length === 0) return;
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (results.length === 0) return;
      setHighlightedIndex((prev) =>
        prev <= 0 ? results.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0) {
        e.preventDefault();
        select(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const select = (value: string) => {
    setQuery(value);
    setIsOpen(false);
    setHighlightedIndex(-1);
    controllerRef.current?.abort();
    onSelect?.(value);
  };

  return (
    <div
      ref={rootRef}
      style={{
        width: 320,
        position: "relative",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <label
        htmlFor={`${uid}-input`}
        style={{ display: "block", marginBottom: 6 }}
      >
        Cidade
      </label>
      <input
        id={`${uid}-input`}
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `${uid}-option-${highlightedIndex}`
            : undefined
        }
        aria-haspopup="listbox"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
        style={{ width: "100%", padding: "8px 10px", boxSizing: "border-box" }}
      />

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #ddd",
            background: "#fff",
            zIndex: 1000,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          {loading ? (
            <div style={{ padding: 8 }}>Carregando...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 8 }}>Nenhum resultado</div>
          ) : (
            results.map((item, idx) => {
              const isActive = idx === highlightedIndex;
              return (
                <div
                  key={`${item}-${idx}`}
                  id={`${uid}-option-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => {
                    // onMouseDown em vez de onClick evita que o input perca foco antes do select
                    e.preventDefault();
                    select(item);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    background: isActive ? "#e6f7ff" : "transparent",
                  }}
                >
                  {item}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// --- Demo (default export) ---
export default function AutocompleteDemo() {
  const handleSelect = (v: string) => alert(`Selecionou: ${v}`);

  return (
    <div style={{ padding: 24 }}>
      <h2>Demo: Autocomplete (TypeScript + React)</h2>
      <p>Comece a digitar: ex. "b" ou "bo" para ver resultados.</p>
      <Autocomplete onSelect={handleSelect} />

      <div style={{ marginTop: 24, color: "#666", fontSize: 13 }}>
        <strong>Notas:</strong>
        <ul>
          <li>
            Debounce: 300ms. A fake API tem 400ms de latência; digitação rápida
            cancela chamadas anteriores.
          </li>
          <li>
            Cache: mesma query usa resultados em cache (veja a variável{" "}
            <code>cacheRef</code>).
          </li>
          <li>
            Keyboard: ↑/↓ para navegar, Enter para selecionar, Esc para fechar.
          </li>
        </ul>
      </div>
    </div>
  );
}
