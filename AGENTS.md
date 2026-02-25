# AGENTS.md - Developer Guide for This Project

## Overview

This is a Next.js 16 (App Router) dashboard application with:
- **Framework**: Next.js 16.1.6 with React 19
- **Database**: PostgreSQL with Prisma 7.4
- **Auth**: Better-auth 1.4
- **Testing**: Vitest 4
- **Styling**: Tailwind CSS 3.4
- **Validation**: Zod 3.24
- **State**: Zustand 5
- **Package Manager**: pnpm

---

## Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm typecheck   # Run TypeScript type checking
```

### Testing
```bash
pnpm test         # Run all tests (vitest run)
pnpm test:watch  # Run tests in watch mode
```

**Run a single test file:**
```bash
pnpm vitest run src/__tests__/smoke.test.ts
```

**Run a single test by name:**
```bash
pnpm vitest run -t "works"
```

### Prisma
```bash
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate   # Run migrations (dev)
pnpm prisma:deploy    # Deploy migrations (prod)
pnpm prisma:studio    # Open Prisma Studio
```

---

## Code Style Guidelines

### Imports

**Order (eslint-plugin-import groups):**
1. Built-in Node.js (`node:`)
2. External packages (React, Next.js, Prisma, Zod, etc.)
3. Internal imports (`@/` path aliases)
4. Relative imports (`./*`)
5. Type imports (`import type { ... }`)

```typescript
// ✅ Good
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

import type { SessionUser } from "@/types/auth";
import { sessionUserSchema } from "@/validations/auth";
```

**Use `server-only` for server-only modules:**
```typescript
import "server-only";
// ... server-only code
```

### Path Aliases

Always use `@/` for internal imports:
```typescript
// ✅ Good
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";

// ❌ Bad
import { env } from "../../lib/env";
```

### TypeScript

**Always enable strict mode:**
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strict: true`

**Use proper typing - avoid `any`:**
```typescript
// ✅ Good
function greet(name: string): string {
  return `Hello, ${name}`;
}

// ❌ Bad - never use any
function greet(name: any): any { ... }
```

**Prefer interfaces for object shapes, types for unions/primitives:**
```typescript
// ✅ Good - object shape
interface User {
  id: string;
  email: string;
  name: string;
}

// ✅ Good - union type
type UserRole = "admin" | "manager" | "agent";
```

**Use `import type` for type-only imports:**
```typescript
import { prisma } from "@/lib/prisma";        // value import
import type { SessionUser } from "@/types/auth"; // type only
```

### Naming Conventions

**Files:**
- PascalCase for components: `UserProfile.tsx`, `AuthForm.tsx`
- camelCase for utilities/hooks: `useAuth.ts`, `formatDate.ts`
- kebab-case for configs: `vitest.config.ts`, `eslint.config.mjs`

**Variables/Functions:**
- camelCase: `getSession`, `userData`, `isLoading`
- PascalCase: React components, TypeScript classes
- SCREAMING_SNAKE_CASE: constants, enum values

**Constants:**
```typescript
// ✅ Good - const for values that don't change
const MAX_RETRY_COUNT = 3;
const USER_ROLE_VALUES = ["superadmin", "admin", "manager", "agent"] as const;

// ✅ Good - TypeScript const object for enums
export const UserRole = {
  superadmin: "superadmin",
  admin: "admin",
  manager: "manager",
  agent: "agent",
} as const;
```

### Error Handling

**Never swallow errors:**
```typescript
// ❌ Bad - empty catch
catch (e) {}

// ✅ Good - handle or re-throw
catch (error) {
  console.error("Failed to fetch user:", error);
  throw new Error("User fetch failed");
}
```

**Use Result patterns or Zod for validation:**
```typescript
// ✅ Good - Zod validation
const parsed = userSchema.safeParse(data);
if (!parsed.success) {
  return { error: parsed.error.flatten() };
}
```

**Use proper error types:**
```typescript
// ✅ Good - custom error classes
class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthError";
  }
}
```

### React/Next.js Patterns

**Server vs Client Components:**
```typescript
// Server Component (default) - no "use client" directive
export default async function DashboardPage() {
  const data = await fetchData();
  return <div>{data.name}</div>;
}

// Client Component - interactive UI
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  // ...
}
```

**Use proper prop typing:**
```typescript
// ✅ Good - explicit prop types
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ children, onClick, variant = "primary" }: ButtonProps) {
  // ...
}
```

### Prisma

**NEVER import PrismaClient directly:**
```typescript
// ✅ Good - use centralized prisma instance
import { prisma } from "@/lib/prisma";

// ❌ Bad - don't create new instances
import { PrismaClient } from "@/generated/prisma/client";
```

**Generated types location:** `src/generated/prisma/`

### CSS/Tailwind

**Use `clsx` and `tailwind-merge` for conditional classes:**
```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn("base-class", isActive && "active-class")} />
```

### Testing

**Test file location:** `src/**/*.test.ts` or `src/**/*.test.tsx`

**Basic test structure:**
```typescript
describe("module name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = process(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── lib/                 # Core utilities
│   ├── auth.ts          # Better-auth configuration
│   ├── prisma.ts        # Prisma client singleton
│   ├── env.ts           # Environment validation
│   └── tenant.ts        # Multi-tenant utilities
├── types/               # TypeScript types
├── validations/         # Zod schemas
├── components/          # React components (add here)
└── __tests__/           # Test files
```

---

## Environment Variables

Required `.env` file:
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="your-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## Troubleshooting

**"Cannot find module" errors:**
```bash
pnpm prisma:generate
```

**Type errors after updating schema:**
```bash
pnpm prisma:generate && pnpm typecheck
```

**Test failures:**
```bash
pnpm test -- --reporter=verbose
```
