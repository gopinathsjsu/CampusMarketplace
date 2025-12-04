# Campus Marketplace - 6-Day Completion Plan

## Current Status Assessment
- **Backend**: Strong start. Core routes (`auth`, `products`, `chat`) exist.
    - **Missing**: AI Search integration, Admin routes (partial), and consistent S3 usage (currently `products.ts` uses local storage while `file.ts` uses S3).
- **Frontend**: Significantly behind. Only Auth pages (`signIn`, `signUp`) and Profile exist.
    - **Missing**: Home, Search, Product Details, Create Listing, Chat UI, Admin Dashboard.

## Strategic Push-Backs (to save time)
1.  **Auto-Scaled EC2 Cluster**: **Push back**. Setting up an Auto Scaling Group (ASG) with a Load Balancer and shared state (Redis/S3) is complex and overkill for a student demo.
    -   **Suggestion**: Deploy to a **single EC2 instance** using `docker-compose`. This meets the "Cloud Deployment" requirement without the DevOps headache.
2.  **Complex Chat**: **Push back**. Real-time websockets (Socket.io) are great but time-consuming to debug.
    -   **Suggestion**: Stick to the current REST-based polling implementation (fetch messages every 5-10 seconds). It’s easier to implement and "good enough" for a demo.

---

## Team Checklists

### Eugene: Backend & Infrastructure
*Focus: APIs, AI search, admin, deployment.*
- [x] **Stabilize existing APIs**: Quick pass over `products`, `chat`, `auth`, `users` routes for obvious bugs and missing validations.
- [x] **Standardize responses**: Ensure error and success responses follow a consistent `{ success, message, data }` shape.
- [x] **AI Search Endpoint**: Add `routes/ai.ts` with `POST /api/ai/search`.
- [x] **Admin APIs**: Add endpoints to list reported products and mark them as reviewed / taken down.
- [x] **Deployment**: Finalize Docker/Docker Compose for backend + MongoDB + frontend. Fixed Express 5 and Node 22 issues.
- [x] **Security**: Secured product update/delete routes.
- [x] **Frontend Config**: Fixed frontend port mapping and environment variables.

### Seth: Frontend Listings (Seller Experience)
*Focus: Creating and managing listings.*
- [x] **Create Listing Page**: Build a form for title, description, price, category, condition, location, and tags.
- [x] **Image Upload**: Implement a file picker and submit using `FormData` to `POST /api/products` (multipart/form-data).
- [ ] **Edit Listing**: Prefill the form from `GET /api/products/:id` and submit updates to `PUT /api/products/:id`.
- [x] **My Listings Page**: Show a list of the logged-in user’s products with edit/delete actions.
- [x] **Product Details Page**: Display full listing details (images, seller info, description, price, condition, location, tags).

### Faye: Frontend Home, Search & Filters
*Focus: Discovery experience for buyers.*
- [ ] **Home / Browse Page**: Fetch from `GET /api/products` and render a grid of product cards.
- [ ] **Search Bar**: Wire text search to the `?search=` query param.
- [ ] **Filters**: Add UI controls for category, condition, and min/max price and pass them as query params to the products API.
- [ ] **Pagination / Load More**: Implement basic pagination using `page` and `limit` from the API.

### Ananya: Frontend Chat & Project Artifacts
*Focus: Chat UI and course-required artifacts.*
- [ ] **Chat UI**: Build conversations + message thread views wired to `GET /api/chat`, `GET /api/chat/:id/messages`, and `POST /api/chat/:id/messages`.
- [ ] **Start Chat Flow**: Wire the "Message Seller" button on Product Details to `POST /api/chat` to create/open a chat for a product.
- [ ] **Admin View (Minimal)**: Simple page to show reported products using the admin APIs.
- [ ] **Docs & Diagrams**: Keep `docs/implementation_plan.md` and diagrams updated.

## Immediate Next Steps
1.  **Frontend Team**: Start building the pages listed above. The backend is fully ready on `http://localhost:5001`.
2.  **Verification**: Use the `sign-in` flow (already working) to get a token, then start calling other APIs.
