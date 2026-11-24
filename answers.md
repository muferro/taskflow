# Technical Questions

## 1. ReactJS and NextJS: Rendering and Strategies

### a) Differences between CSR, SSR, and SSG

* **Client-Side Rendering (CSR):** This is how standard React (SPA) works by default. The server sends a nearly empty HTML file along with the JavaScript bundle. All the work of fetching data from the API and building the UI happens inside the user's browser.
* **Server-Side Rendering (SSR):** On every user request, the server fetches the required data, builds the full HTML for that page on the fly, and sends it ready to the browser. The user sees the content right away, and then React loads in the background just to make the page interactive (hydration).
* **Static Site Generation (SSG):** The HTML is also built on the server, but this happens only once during the build (deploy) time, not on every user visit. The pages are saved as static files and delivered instantly. In Next.js, we can also combine this with ISR (Incremental Static Regeneration) to update these static pages in the background from time to time.

### b) When each approach is advantageous or problematic (with practical examples)

* **CSR:**
  * **When it is good:** Private applications (behind a login) with lots of constant user interaction where SEO does not matter. *Examples:* Admin dashboards, internal company systems (ERP), or web apps like Trello and Figma.
  * **When it is problematic:** Public pages that need to rank on Google (bad SEO because search engine bots might only see the empty HTML) or for users on slow devices/internet, since they see a blank or loading screen until all the JavaScript is downloaded and executed.
* **SSR:**
  * **When it is good:** Public pages that need strong SEO and have data that changes all the time or is customized for the logged-in user. *Examples:* An e-commerce product page with real-time price and stock, a social media feed, or dynamic search result pages.
  * **When it is problematic:** Since the server has to fetch data and build the page on every single request, the initial response time (TTFB) can be slower if the database or API takes too long. It also increases server load and hosting costs during high traffic spikes.
* **SSG:**
  * **When it is good:** Pages where the content is the same for everyone and does not change every second. It gives you near-instant loading and great SEO. *Examples:* Blogs, landing pages, company websites, and technical documentation.
  * **When it is problematic:** Websites with tens of thousands of pages (the build time becomes way too long) or screens with live data (like live stock market prices), because the static content would get outdated right away.

---

## 2. Backend: Concepts and Approaches

### a) Main ways to implement a backend for a web application

The main and most common way in the market is building a **REST API**, and in practice, we usually implement the backend using one of these approaches:

* **Dedicated REST API (Traditional Server):** This is the industry standard. We build a server separated from the frontend (using Node.js with Express, Fastify, or NestJS, or other languages like Python, Go, or C#) that communicates over HTTP (`GET`, `POST`, `PUT`, `DELETE`) and returns JSON. For the architecture, it usually starts as a **Monolith** (all business logic in a single project, which is simple and solves most real-world cases) or it can be split into **Microservices** (smaller independent services, used in very large-scale systems).
* **Integrated Fullstack Backend (Next.js / Serverless):** Very common today in the React ecosystem. Instead of maintaining a separate Node server running 24/7, we build the backend routes (*Route Handlers* / *API Routes*) or *Server Actions* right inside the Next.js project, running on demand as Serverless functions.
* **BaaS (Backend as a Service):** Using platforms like **Supabase** or **Firebase**, which already provide a database, authentication, permissions, and auto-generated REST APIs out of the box. It is great for launching products fast (MVPs) or when working in small teams.
* **Alternatives to REST (WebSockets, GraphQL, and RPC):** When standard REST is not the best fit for a specific feature, we can use **WebSockets** (for real-time two-way communication like live chats and notifications), **GraphQL** (when the frontend needs flexibility to query complex data in a single request), or **tRPC** (for fullstack TypeScript apps).

### b) About tRPC (Pros and Cons)

Yes, I am familiar with it. tRPC is a library made for fullstack TypeScript projects that lets us build APIs without manually defining HTTP routes or schemas. It allows the frontend to call backend functions directly with full type safety.

**Advantages:**
* **Typing (End-to-End Type Safety):** This is the biggest advantage. The frontend imports only the TypeScript types from the backend. If I change a field name or the return value of a function on the backend, my frontend immediately shows a TypeScript error in the code editor, and it gives me full autocomplete.
* **Security and Validation:** It integrates directly with validation libraries like **Zod**. This ensures that all input data coming from the user (and output data leaving the server) is validated at runtime, protecting the business logic against broken or malicious payloads.
* **Productivity:** Since we do not need to maintain duplicated interfaces on both front and back or run code generators after every change, building new features is much faster.

**Disadvantages:**
* **Scalability for multiple clients (Coupling):** tRPC requires both the backend and frontend to use TypeScript (usually inside the same Monorepo). If the product grows and we need to expose that same API to a native mobile app (Swift/Kotlin), to external partners (public API), or to other microservices written in Python or Go, tRPC becomes a limitation. In these cases, a traditional **REST API** scales much better because it is a universal standard.
* **HTTP Caching and Standards:** Because tRPC hides the standard HTTP layer behind function calls (RPC), some things that are very simple and natural in REST (like fine control over HTTP status codes, CDN caching via HTTP headers, or quick manual testing with Postman/cURL) are less straightforward to handle.
