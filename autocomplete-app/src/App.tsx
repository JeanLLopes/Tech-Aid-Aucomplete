import React from "react";
import Autocomplete from "./components/Autocomplete";

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Demo Autocomplete</h1>
      <Autocomplete onSelect={(v) => console.log("Selecionou:", v)} />
    </div>
  );
}
