// src/components/Autocomplete/Autocomplete.types.ts

export interface AutocompleteProps {
  placeholder?: string;
  onSelect?: (value: string) => void;
  minQueryLength?: number; // default: 1
}
