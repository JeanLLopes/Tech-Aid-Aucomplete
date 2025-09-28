# React Autocomplete Component

A simple, accessible, and reusable Autocomplete component built with React and TypeScript. This project serves as a demonstration of best practices in component design, including debouncing, caching, and accessibility.

## Features

- **Debounced Search**: API calls are debounced to prevent excessive requests while the user is typing.
- **Request Caching**: Caches results for previously made queries to improve performance.
- **Abortable Fetch**: Cancels previous in-flight requests when a new one is initiated.
- **Keyboard Navigation**: Full support for keyboard navigation (Up/Down arrows, Enter to select, Escape to close).
- **Accessibility**: Implements WAI-ARIA patterns for combobox widgets to ensure it's accessible to screen reader users.
- **Clean Architecture**: Organized into separate files for the component, API logic, and types for better maintainability.

## Getting Started

To run this project locally, follow these steps:

1.  Clone the repository:

    ```bash
    git clone <your-repo-url>
    cd autocomplete-app
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

## Testing

This project uses Vitest for the test runner and React Testing Library for rendering and interacting with components in a test environment.

To run the test suite, execute the following command:

```bash
npm test
```

## Usage

Here's a basic example of how to use the `Autocomplete` component.

```tsx
import { Autocomplete } from "./components/Autocomplete";

function MyApp() {
  const handleSelect = (city: string) => {
    alert(`You selected: ${city}`);
  };

  return (
    <div>
      <h1>Search for a City</h1>
      <Autocomplete onSelect={handleSelect} />
    </div>
  );
}
```

## Component Props

| Prop             | Type                      | Default                  | Description                                                |
| ---------------- | ------------------------- | ------------------------ | ---------------------------------------------------------- |
| `placeholder`    | `string`                  | `"Search for a city..."` | Placeholder text for the input field.                      |
| `onSelect`       | `(value: string) => void` | `undefined`              | Callback function invoked when an item is selected.        |
| `minQueryLength` | `number`                  | `1`                      | Minimum number of characters required to trigger a search. |
