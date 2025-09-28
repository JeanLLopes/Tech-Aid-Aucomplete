import React, { useEffect, useRef, useState, useId } from "react";
import { searchCities } from "./api";
import type { AutocompleteProps } from "./Autocomplete.types";

/**
 * Autocomplete component for searching and selecting city names.
 *
 * This component provides an accessible, keyboard-navigable autocomplete input field.
 * It supports debounced async search, result caching, keyboard and mouse navigation,
 * and closes the dropdown when clicking outside.
 *
 * @param {AutocompleteProps} props - The props for the Autocomplete component.
 * @param {string} [props.placeholder="Search for a city..."] - Placeholder text for the input field.
 * @param {(value: string) => void} props.onSelect - Callback invoked when a city is selected.
 * @param {number} [props.minQueryLength=1] - Minimum number of characters required to trigger a search.
 *
 * @returns {JSX.Element} The rendered Autocomplete component.
 *
 * @example
 * <Autocomplete
 *   onSelect={(city) => console.log(city)}
 *   placeholder="Type a city name"
 *   minQueryLength={2}
 * />
 */
export function Autocomplete({
  placeholder = "Search for a city...",
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const listboxId = `${uid}-listbox`;

  // Cleanup
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fecha dropdown ao clicar fora
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

  // Efeito: debounce + fetch + cache + abort
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const q = query.trim();
    if (q.length < minQueryLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      if (cacheRef.current.has(q)) {
        setResults(cacheRef.current.get(q) || []);
        setLoading(false);
        setHighlightedIndex(-1);
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await searchCities(q, { signal: controller.signal });
        cacheRef.current.set(q, res);
        setResults(res);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
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

  // Teclado
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
        City
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
            <div style={{ padding: 8 }}>Loading...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 8 }}>No results found</div>
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
