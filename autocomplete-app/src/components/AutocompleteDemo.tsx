// src/components/Autocomplete/AutocompleteDemo.tsx
import { Autocomplete } from "./Autocomplete";

export default function AutocompleteDemo() {
  const handleSelect = (v: string) => alert(`Selecionou: ${v}`);

  return (
    <div style={{ padding: 24 }}>
      <h2>Autocomplete (TypeScript + React)</h2>
      <p>Digite por exemplo: "b" ou "bo" para ver resultados.</p>
      <Autocomplete onSelect={handleSelect} />
    </div>
  );
}
