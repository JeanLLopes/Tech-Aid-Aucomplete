import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Autocomplete } from "../Autocomplete";
import * as api from "../api";

vi.mock("../api");

const mockedSearchCities = vi.mocked(api.searchCities);

describe("<Autocomplete />", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedSearchCities.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders the input with correct ARIA attributes", () => {
    render(<Autocomplete />);
    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-autocomplete", "list");
  });
});
