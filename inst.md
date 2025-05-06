🌍 Public-Facing Pages
These are accessible to all users — both guests and logged-in users (talents or clients).
| **Page** | **Purpose** | **Why Public?** |
|----------|-------------|-----------------|
| `/` | Landing/Home page | First point of interaction |
| `/search` | Browse and search talents | Allow exploration without account |
| `/talent/[id]` | Talent profile page | Showcase talents publicly |
| `/become-a-talent` | Registration form for talents | Encourage sign-ups |
| `/login` & `/register` | Auth pages | Needed to onboard users |
| `/terms`, `/privacy`, `/faq` | Informational | Required for legal and trust reasons |

🔐 Authenticated Pages
These require login. Use route protection for both clients (users who book) and talents (users who perform) — possibly with role-based access.

🧑‍🎤 Authenticated for Talents
| **Page** | **Purpose** | **Role** |
|----------|-------------|----------|
| `/dashboard` | Overview page for talents | Talent |
| `/dashboard/profile` | Edit profile (bio, images, etc.) | Talent |
| `/dashboard/availability` | Manage available dates | Talent |
| `/dashboard/bookings` | View booking requests | Talent |
| `/dashboard/reviews` | See received ratings | Talent |

📆 Authenticated for Clients/Users
| **Page** | **Purpose** | **Role** |
|----------|-------------|----------|
| `/talent/[id]/rate` | Leave a rating | Client (user who booked) |
| `/bookings` | View bookings (optional) | Client |
| `/messages` | Inbox or chat with talents | Client |

🔁 Routes Mapping (Next.js ↔ NestJS)
| Page/Component | Backend Endpoint | Method |
|----------------------------------------|----------------------------------------------|--------|
| `/search` | `GET /talent?location=&category=` | GET |
| `/talent/[id]` | `GET /talent/:id` | GET |
| `/dashboard/availability` | `GET /talent/:id/availability` | GET |
| | `POST /talent/:id/availability` | POST |
| `/dashboard` | `PUT /talent/:id` | PUT |
| `/talent/[id]/rate` | `POST /talent/:id/rate` | POST |
| `/become-a-talent` | `POST /talent` | POST |

🧱 Component Breakdown
Some reusable UI components:

TalentCard: Compact preview of a talent

SearchFilters: Dropdowns and inputs for filters

AvailabilityCalendar: Shows and edits date slots

RatingStars: Star input + display

TalentForm: For profile creation/edit

LocationAutocomplete: (Google Maps API or OpenStreetMap)

🔍 2. Search Results Page (/search)
Route: /search?location=helsinki&category=musician

Data: Calls GET /talent?location=xyz&category=xyz

Components:

Filters: location, category, date availability

Talent cards: thumbnail, name, short description, rating

Next.js Strategy: useSearchParams() + server-side fetching (or SWR for client fetch)

👤 3. Talent Profile Page (/talent/[id])
Route: /talent/123

Data: GET /talent/:id

Features:

Full bio, category, pricing

Availability calendar (pulled from backend)

Contact/Booking CTA

Ratings & reviews section (read + post if logged in)

📆 4. Availability Management (/dashboard/availability)
Only for talents

Data: Uses GET /talent/:id/availability, POST /talent/:id/availability

Components:

Calendar UI (e.g., react-big-calendar or FullCalendar)

Add/remove availability slots

✍️ 5. Rate a Talent (/talent/[id]/rate)
Can be modal or embedded in /talent/[id]

POST to: /talent/:id/rate

Should include:

Star rating input

Text feedback

🔐 6. Talent Dashboard (/dashboard)
Route: /dashboard

Only accessible to logged-in talents

Tabs/pages:

Profile: View/edit profile (PUT /talent/:id)

Bookings: List of incoming requests (future feature)

Availability

Ratings/Feedback

➕ 7. Signup / Become a Talent (/become-a-talent)
Form for new talents to register

POST to: /talent
