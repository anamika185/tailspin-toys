---
description: 'Coding standards for comments, documentation, and TypeScript formatting'
---

# Coding Standards

This file defines the coding standards for comments, documentation, and TypeScript formatting in the Tailspin Toys project.

## Comment Philosophy

### Comment Intent, Not Mechanics

Comments should explain *why* a piece of code exists or the reasoning behind a non-obvious decision, not restate *what* the code already says. Avoid comments that merely paraphrase the line below them.

**Good:**
```typescript
// We need to sort by date descending so the newest games appear first
const sortedGames = games.sort((a, b) => b.date - a.date);
```

**Avoid:**
```typescript
// Sort games by date descending
const sortedGames = games.sort((a, b) => b.date - a.date);
```

### Keep Comments Current

Treat outdated comments as bugs — update or delete them in the same change that touches the related code. If code changes make a comment incorrect or redundant, fix the comment alongside the code change.

## Documentation Standards

### TSDoc/JSDoc for Data Layer

Every exported function in `db/` and `src/lib/` must have a TSDoc/JSDoc comment describing:
- Purpose of the function
- Parameter descriptions (including types)
- Return value description (including type)
- Any side effects or important notes

**Example:**
```typescript
/**
 * Retrieves a game by its ID from the database.
 * 
 * @param db - The database connection (injected for testability)
 * @param id - The unique identifier of the game to retrieve
 * @returns The game object if found, otherwise undefined
 * @throws Will throw an error if the database query fails
 */
export async function getGameById(db: Database, id: string): Promise<Game | undefined> {
  // Implementation...
}
```

### Component Props Documentation

Each reusable `.astro` component should document its `Props` interface using JSDoc-style comments so the component API is self-explanatory.

**Example:**
```typescript
---
interface Props {
  /** The game to display in the card */
  game: Game;
  /** Whether to show the purchase button */
  showPurchaseButton?: boolean;
}
---
```

## TypeScript Formatting Rules

### Type Definitions

- Use explicit types for function parameters and return values, especially in the data layer (`db/`, `src/lib/`)
- Prefer interfaces over types for object shapes that may be implemented or extended
- Use type aliases for primitive types, unions, and intersections when appropriate

### Formatting Preferences

These rules should be enforced through ESLint where possible:
- Use single quotes for strings
- Prefer arrow functions for concise callbacks
- Include explicit return types for functions
- Sort imports: built-in modules first, then external, then internal
- No unused variables or imports

## Implementation Notes

These standards should be verified through:
- Code review (manual)
- ESLint configuration (where applicable)
- The `quality-checks` skill for validation before commits