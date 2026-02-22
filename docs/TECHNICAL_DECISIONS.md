# Technical Decisions

This document outlines the major architectural choices made for the dashboard project. It explains the problems we faced, the options we looked at, and why we settled on these specific tools.

## Next.js 16

Next.js was chosen as the core framework because it provides a complete toolkit for building modern web apps.

**The Problem:** Building a dashboard requires fast page loads, easy routing, and a way to handle both client side and server side logic without jumping between different systems.

**Alternatives:** We looked at Vite with a custom backend or Remix. While Vite is fast, it leaves too many decisions about routing and data fetching to the developer. Remix is great, but the ecosystem around Next.js is larger.

**Why it was chosen:** The App Router makes it easy to organize features and handle data fetching on the server. This results in less JavaScript sent to the browser and better performance.

**Trade-offs:** The App Router has a steeper learning curve than the older Pages Router. It requires a different way of thinking about component boundaries.

## Prisma 7

Prisma serves as the bridge between our code and the database.

**The Problem:** Writing raw SQL is error prone and doesn't provide type safety. We needed a way to ensure our database queries always match our TypeScript definitions.

**Alternatives:** Drizzle ORM or Kysely. Drizzle is closer to SQL, which some prefer. However, Prisma has a more mature feature set and better developer tools for migrations.

**Why it was chosen:** Prisma 7 offers excellent type safety and a clean API. The biggest factor was its Client Extensions, which allowed us to build a solid tenant isolation system.

**Trade-offs:** Prisma can be slightly slower than raw SQL or lightweight ORMs like Drizzle in high load scenarios.

## better-auth

Authentication is handled by better-auth to keep user data secure and simplify the login flow.

**The Problem:** Managing sessions, cookies, and OAuth providers is complex and easy to get wrong.

**Alternatives:** NextAuth.js or Clerk. Clerk is a great managed service but it's expensive as you scale. NextAuth is popular but can feel clunky and lacks some of the modern TypeScript patterns found in better-auth.

**Why it was chosen:** It's built specifically for TypeScript and fits perfectly with the Next.js App Router. It makes it easy to handle sessions without the boilerplate required by other libraries.

**Trade-offs:** Since it's newer than NextAuth, it has a smaller community and fewer third party plugins.

## Client Extensions for Tenant Isolation

We use Prisma Client Extensions to make sure users only see data belonging to their organization.

**The Problem:** In a multi tenant app, accidentally leaking data from one customer to another is a critical failure. We needed a way to automatically filter every database query by an organization ID.

**Alternatives:** Database level Row Level Security or manual filtering in every API call. Row Level Security is powerful but can be hard to manage and debug. Manual filtering is dangerous because it's easy to forget a filter in one place.

**Why it was chosen:** Client Extensions allow us to inject the organization filter at the code level for every query. It's safer than manual filtering and easier to test than database settings.

**Trade-offs:** This adds a small amount of overhead to every database request.

## Google OAuth Only

We decided to support only Google OAuth for user accounts.

**The Problem:** Supporting passwords requires building features like "forgot password", email verification, and secure hashing. This increases the surface area for security attacks.

**Alternatives:** Email and password login or Magic Links.

**Why it was chosen:** Most users in our target market already have Google accounts. By using Google as the identity provider, we don't have to store or manage sensitive passwords. This simplifies the app and improves security.

**Trade-offs:** This excludes users who don't want to use a Google account.

## Zod

Zod is used to validate data coming into the app from forms or API requests.

**The Problem:** TypeScript only checks types during development. We need a way to verify that data is correct at runtime before we process it.

**Alternatives:** Yup or Joi. These are older libraries that don't have the same level of TypeScript integration.

**Why it was chosen:** Zod allows us to define a schema once and use it for both runtime validation and TypeScript type definitions. It integrates perfectly with the rest of our stack.

**Trade-offs:** Validating large, complex objects can have a minor impact on performance.

## Neon PostgreSQL

Neon provides the database for the app.

**The Problem:** Managing a database server is a lot of work. We needed a database that scales easily and doesn't cost much when the app isn't being used.

**Alternatives:** Supabase or a traditional RDS instance on AWS. Supabase is a whole platform, which we didn't need. AWS RDS is expensive and doesn't scale to zero.

**Why it was chosen:** Neon is a serverless PostgreSQL provider. It handles scaling automatically and allows us to create database branches for development, similar to git branches.

**Trade-offs:** Serverless databases can sometimes have a "cold start" delay if they haven't been used for a while.
