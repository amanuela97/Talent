Initiating the Connection
When a customer clicks “Book Now” on the talent detail page, the connection process begins.

a. Booking / Inquiry Form Page or Modal
Build a separate page (for example, /talents/[serviceName]/book). This page has a multi step form that should capture all necessary details for the inquiry. (Build everything as components, use existing components when possible to avoid duplications)
Essential Fields & Data Input:
Event Details:

- Event Type: (e.g., Wedding, Corporate Event, Birthday, etc.) (dropdown select from EventTypes.json)
- What equipment will you need the performer to provide?
- How many guests are you expecting at the event? (approximate)
- Location: Event Location/Address: If applicable (or at least the city/region).
- Event Date & Time: Date picker, optional time input.
- Event Duration: How many hours or days.
- Budget Information: Budget Range: Allow customers to submit an estimated budget or select from preset ranges.
- Service Requirements: Specific Services Needed: (Optional checkboxes or additional text fields if the talent offers multiple services.)
- Additional Comments: Notes/Questions: A text area where the customer can describe special requirements, questions, or any personalization that might help the talent prepare a quote.
- After form submission, redirect the customer to a confirmation page that: Displays the details of their inquiry. Provides guidance on next steps. Suggests checking their email or dashboard regularly for status updates.
- update the EventBooking model in schema.prisma file if missing any of the fields required in booking form.

b. Data Flow
API Request: Once the customer submits the inquiry form, make an API call to a NestJS endpoint (for example, POST /bookings) that accepts all the information.

Backend Processing:

Create a new record in the EventBooking (or Inquiries) table.

Tag the booking with a status (e.g., PENDING by default).

Link it to both the talent’s ID and the customer’s ID (if logged in).

c. Email Notifications
For Talents: When a new inquiry is submitted, send an email with the booking details and a link to the talent’s dashboard.

For Customers: After submission, send a confirmation email that the request has been booked; if the talent responds, notify the customer immediately.

d. Talent’s Dashboard & Communication View
Once a booking/inquiry is submitted:

- Talent Dashboard
  Booking Requests List: A page where talents can see incoming inquiries, their details, and statuses.

  Action Buttons:
  Accept / Decline: Allow talents to accept or decline the booking request.
  Update Booking Status: Once a talent accepts, update the status to ACCEPTED and trigger a notification to the customer.

- Customer Dashboard
  Booking Summary Page: A page where a customer can view the inquiries they’ve sent, see the status updates, and track communication.
  Cancellation: Additional functionalities if the customer wishes to modify or cancel their request.
