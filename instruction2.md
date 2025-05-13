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

Public reviews if you plan to implement later

3. “Customer” Functionality Suggestions
   To go beyond just displaying data, here are the top features to prioritize for customers:

- Contact Talent
  Simple form: name, email, message

Store/send to talent or email directly

- Request a Gig / Booking
  A form that lets a customer propose a gig:

Date and time

Type of service

Location

Budget

Optional message

Stored as a GigRequest model (you can add this to your schema later)

- Save Favorite Talents
  If customers can log in, let them bookmark talents for later

- Talent Availability Viewer
  Optionally show:

Available days/hours (converted from availability JSON)

Visual calendar (read-only)

---

4. Optional Backend Considerations
   Index talents by location and category for fast filtering

Make sure only published talents are visible (isPublic field = true)

Consider slugified usernames or profile URLs for SEO: /talents/nabeel-baig instead of /talents/clxv3
