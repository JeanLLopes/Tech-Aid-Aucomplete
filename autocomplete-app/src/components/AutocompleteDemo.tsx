import { Autocomplete } from "./Autocomplete";

export default function AutocompleteDemo() {
  const handleSelect = (v: string) => alert(`Selected: ${v}`);

  return (
    <div style={{ padding: 24 }}>
      <h2>Autocomplete (TypeScript + React)</h2>
      <p>Start typing, e.g., "b" or "bo" to see results.</p>
      <Autocomplete onSelect={handleSelect} />
    </div>
  );
}
