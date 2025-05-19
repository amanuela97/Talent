Pages and Functionalities by User Role
The next step is building separate pages (or dashboards) tailored to the type of user in your system.

A. For Talent Accounts

1. Talent Dashboard – Booking Inquiries Page
   URL Example: /dashboard/talent/bookings

Purpose: Display all incoming booking inquiries where booking.talentId equals the logged-in talent’s ID.

Content and Features:

List View: Each row (or card) shows key details:

Customer name (or alias)

Event date, type, location, and any provided notes

Current booking status (e.g., Pending, Accepted, Declined)

Actions:

Accept/Decline Buttons: For a pending inquiry, talent can click to move the booking status to ACCEPTED or DECLINED.

View Details & Communication: A “View More” button opens a detailed view or modal that shows the full booking details and also initiates a messaging thread if further clarification is needed.

Filters/Sorting: Ability to filter by status, event date, or even search by customer name.

B. For Customer Accounts

1. Customer Dashboard – My Bookings Page
   URL Example: /dashboard/customer/bookings

Purpose: List all bookings that the customer has made as the initiator (where booking.customerId equals the logged-in user’s ID).

Content and Features:

Booking List Display: Each booking shows:

Talent’s name and a mini-profile image

Event summary (date, type, location)

Current status (pending, accepted, etc.)

Actions:

Cancel Booking: If the booking is still pending, the customer may cancel it.

View Details: For further communication or to see more specific event details.

Status Updates: Visual cues (colors or icons) for status; for example, a green checkmark when accepted, a red door for cancellations, etc.

C. For Admin Accounts

1. Admin Dashboard – All Bookings Page
   URL Example: /dashboard/admin/bookings

Purpose: Allow admins to view and manage every booking/inquiry on the platform.

Content and Features:

Global List View: Display all bookings with columns for:

Talent name, Customer name

Event details (type, date, location)

Status

Filtering/Sorting: Admins can filter by talent, customer, status, and sort by creation date.

Actions/Overrides:

Edit Booking: Admin can modify a booking’s details if needed.

Status Override: If disputes arise, admins can change a booking’s status (for example, force an accepted booking into a cancelled state).

1. Implementation Details Across the Dashboard Pages
   a. Dynamic Data Fetching
   Next.js Data Fetching: Use SSR, static props, or client-side fetching (with SWR or React Query) to load booking data depending on the role.

Use segmented API endpoints (e.g., GET /bookings?talentId=<talentID> for talents and GET /bookings?customerId=<userID> for customers).

Backend Endpoints: Build secured NestJS endpoints that return the list of bookings filtered by the current user’s role and IDs.

b. Role-Based UI
Conditional Rendering: In your dashboard layout component, check user.role and render:

Talent-specific components (booking inquiry list with accept/decline actions)

Customer-specific components (my bookings list with cancel option)

Admin components (global booking list with additional management actions)

Ensure Security: Include backend guards that verify the current user can only access bookings that belong to them (or, in the admin case, everything).

1. Step-by-Step Booking Connection Process
   Booking Submission:

The customer (or admin) fills out the booking/inquiry form on the talent detail page, and submits it.

The form data is sent to the NestJS API after a check that the talent is not booking themselves.

A new booking record is created (status set to PENDING).

Notifications:

The talent receives a notification and the booking appears in their dashboard.

The customer receives a confirmation, and the booking appears in their “My Bookings” page.

Optionally, the admin is notified if flagged or for global overview.

Review & Response:

The talent reviews the inquiry in their booking dashboard. They can view details, accept, decline, or initiate further discussion via an integrated messaging system.

Once the talent updates the booking status (to ACCEPTED/DECLINED), the customer’s view is updated accordingly.

Post-Booking Actions:

For the Customer: They can see the confirmed booking details, access further communication, and possibly initiate actions like deposit payments or contract signing on an extended booking detail page.

For the Talent: They manage upcoming events, track status changes, and see historical bookings.

For the Admin: They monitor bookings across the platform, make corrections, resolve disputes, and generate reports or analytics.

5. Final Considerations
   User Interface Design: Invest time in making these dashboards easy to navigate with clear calls-to-action and visual cues for statuses.

Backend Data Validation: Always enforce that a talent cannot book themselves and that users only access their own data (unless admin).

Scalability: Design your API so that additional features (like payment integrations or review systems) can be layered on later.
