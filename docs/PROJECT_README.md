# Lead Management Dashboard

This project is a multi-tenant dashboard designed for small and medium businesses in India. It helps these businesses track their leads and manage customer relationships in one place.

## Why this exists

Small businesses often struggle to keep track of potential customers. They use spreadsheets or paper notes, which makes it hard to follow up or see the big picture. This tool provides a central hub to capture and organize those leads.

## Phase 1 Scope

We are currently in Phase 1, which focuses on building a secure foundation. This phase handles user accounts and makes sure each business can only see its own data. We haven't built the lead management features like creating or editing leads yet. Those come in the next phase.

## Tech Stack

We use modern tools to keep the app fast and reliable:

*   **Next.js 16:** The framework for the website and its logic.
*   **TypeScript:** Helps us catch coding errors early.
*   **Prisma 7:** Manages how we talk to our database.
*   **PostgreSQL (Neon):** The database where we store all information.
*   **Better-auth:** Handles user login and security.
*   **Vitest:** Runs our automated tests.

## Progress So Far

We've finished the first seven tasks of the project:

1.  Set up the initial project structure with Next.js.
2.  Created the database schema and connected it to Neon.
3.  Set up the testing environment.
4.  Added validation for environment variables.
5.  Built shared types and data schemas.
6.  Configured the database client for the app.
7.  Implemented tenant isolation to keep data separate between different businesses.

## What's Next

The next steps involve finishing the authentication system:

*   Setting up the login and signup logic.
*   Creating the actual login and signup pages.
*   Building the initial dashboard layout.

## How to Run

To start working on the project, use these commands in your terminal:

*   `pnpm dev`: Starts the development server.
*   `pnpm build`: Prepares the app for production.
*   `pnpm test`: Runs all the automated tests.
