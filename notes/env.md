Secret Variables: (e.g., STRIPE_SECRET_KEY)
How to name: Just name it normally in .env.local.
Where it works: Only in API routes or Server Components. The browser will never see this.

Public Variables: (e.g., NEXT_PUBLIC_ANALYTICS_ID)
How to name: You must prefix it with NEXT_PUBLIC_.
Where it works: Both the server and the browser (your React components) can see this.