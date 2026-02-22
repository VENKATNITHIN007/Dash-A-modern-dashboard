# System Architecture

This document describes how the dashboard components interact to provide a secure, multi-tenant experience.

## System Overview

The application follows a standard modern stack. Next.js handles both the user interface and the backend logic. Data persistence happens in a PostgreSQL database hosted on Neon. Prisma acts as the bridge between the application code and the database, providing type safety and query abstraction.

## Data Flow

### User Login Flow

1. A user initiates login through the dashboard interface.
2. The request goes to Google OAuth for identity verification.
3. Upon success, better-auth processes the callback.
4. A new user or session record is created in the database.
5. The user receives a session cookie and gains access to protected routes.

```text
[User] -> [Google OAuth] -> [better-auth] -> [PostgreSQL Database]
```

### Dashboard Access and Query Flow

1. The user visits a dashboard page.
2. The server component identifies the active session and organization.
3. The application uses the tenant-scoped client for data fetching.
4. Prisma automatically adds organization filters to the query.
5. The database returns only the records belonging to that specific organization.

```text
[Dashboard] -> [Tenant Client] -> [Prisma Extension (filters)] -> [PostgreSQL]
```

## Key Components

### src/lib/prisma.ts
This file contains the base Prisma client. It's a singleton to prevent the application from exhausting database connections during development and production.

### src/lib/tenant.ts
This is a specialized database client. It uses Prisma Client Extensions to wrap the standard client. It ensures that every database operation automatically includes an organization filter. This helps prevent data leaks between different users or companies.

### src/lib/auth.ts
All authentication logic lives here. It configures better-auth to work with Google OAuth and manages how sessions are stored and retrieved.

### src/lib/env.ts
This utility validates environment variables at startup. It uses Zod to make sure required keys like database URLs and OAuth secrets are present and correctly formatted.

## Security Model

Security relies on strict tenant isolation. Instead of manually adding filters to every query, the system handles it at the database client level. Every time the application requests data through the tenant client, the system injects the current organization ID. This approach makes it difficult to accidentally view data from another organization.

## File Map

- **prisma/**: Contains the database schema definition and migration history.
- **src/app/**: Houses the Next.js App Router pages, layouts, and API routes.
- **src/components/**: Includes shared React components for the user interface.
- **src/lib/**: Stores core logic, database clients, and utility functions.
- **public/**: Static assets like images and fonts.
