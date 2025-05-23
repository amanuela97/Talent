- Implement public-facing pages for showcasing talents and individual talent profiles. The UI layout already exists and i want you to build on top of it by improving it and making it functional by connecting it to the backend. Remember to use the existing axiosInstance when making api calls, so dont use fetch or create unrequired /api routes. Below is more details on what needs to be implemented:

1. Explore All Talent. /talents
   Purpose: Acts as the main discovery or “marketplace” page where customers browse all available talents.

Functionality to include:

Search by keyword (e.g., name, category, service)

- Filter by:

General Category (e.g., Photographer, Musician)

Specific Services (e.g., Wedding Photographer)

City or Location

Languages spoken

Hourly rate range

Availability (optional)

- Sort by:

Newest

Most reviewed / Highest rated

- Pagination

2. View Individual Talent Profile
   /talents/[username]
   Purpose: Displays the full public profile of a single talent, similar to a freelancer profile on Fiverr or Upwork.

Functionality to include:

Talent profile picture, bio, categories

Service offerings (from services field)

Availability (show weekly availability and calendar)

Embedded portfolio (images, videos, audios)

Social links (from socialLinks)

Option to contact or request booking (even if simple for now)

Option to leave a public reviews

1. “Customer” Functionality Suggestions
   To go beyond just displaying data, here are the top features to prioritize for customers:

- Booking Request Flow: On a talent’s profile page (e.g., /profiles/[username]), include a clear call-to-action (CTA) like “Book Now” or “Send a Request.” When a customer clicks this button, they should be directed to a form where they can specify event details (date, type of event, location, special requirements, budget, etc.). When submitted, the form sends a POST request to your backend (e.g., an endpoint like /bookings). The NestJS backend then creates a booking record that ties together the talent and customer profiles.
- Booking Status & Updates: Design your data model to include a booking status (e.g., pending, accepted, declined, completed). Allow talents to update the status, and have the customer’s dashboard automatically reflect these changes. This enhances trust and transparency.
- Bookings Table: This table could have fields like: id, talent_id, customer_id, event_date, description, status (pending, accepted, etc.), created_at and updated_at.
- Booking Module: Create a module dedicated to handling bookings. This module should include controllers that expose endpoints for: Creating a new booking, Fetching booking details (for both talents and customers), Updating booking statuses.
- Auth & Role-Based Access Control: Ensure that the endpoints are secured. Use guards to check authentication and authorization, verifying that a user is allowed to send a booking request or view a particular conversation.
- Save Favorite Talents. If customers can log in, let them bookmark talents for later.

- Talent Availability Viewer
  Optionally show: Available days/hours (converted from availability JSON), Visual calendar (read-only).
- Profile Page Enhancements: Integrate the booking/request form directly on the talent’s profile page. Use Next.js API routes or directly hit your NestJS API endpoints.

- Dynamic Dashboards: Both talents and customers should have dashboard pages where they can see all their bookings and messages. Use Next.js’s SSR (server-side rendering) or ISR (incremental static regeneration) where necessary, to ensure data is fresh and SEO-friendly.

---

4. Optional Backend Considerations
   Index talents by location and category for fast filtering

Make sure only published talents are visible (isPublic field = true)

Consider slugified usernames or profile URLs for SEO: /talents/nabeel-baig instead of /talents/clxv3
