- Build a calendar component that integrates with the existing weekly availability logic and extends into event-based interaction (like setting unavailability, booking/events, or other statuses), here's a complete breakdown

- Recommended Calendar Library "FullCalendar"
- Events will be color-coded to help easily identify the type of calendar entry
- Here is an example of what the model could look like but you can create a different one if a better model exists.
  model CalendarEvent {
  id String @id @default(uuid())
  talentId String
  type String // "available" | "unavailable" | "booked" | etc.
  title String
  start DateTime
  end DateTime
  color String? // For frontend customization
  talent Talent @relation(fields: [talentId], references: [id])
  createdAt DateTime @default(now())
  }

- Make sure to create the API routes or endpoints and implement the backend logic as well.

- Here is how to "Add new events"
- 1 Click in the white space of the specific date or time you want to add to (or click and drag to make multiple selections).
- 2 Select the "Add a new event" option.
- 3 Enter the event title, client's name (optional), dates, and start and end times, or choose All-day event if you want to cover all 24 hours.
  Note: The client's name will not be displayed publicly. This is only included to help you more easily distinguish between events.
- 4 Click Add to <date> to create a single event, or Add to multiple dates to create a repeating event.

- Here is how to "Add unavailability"
- 1 Click in the white space of the specific date or time you want to add to (or click and drag to make multiple selections).

- 2 Select the "Add unavailability" option.

- 3 Enter a title (optional), the dates, and the start and end times, or choose All-day event if you want to cover all 24 hours.

- 4 Click Add to <date> to add one day of unavailability, or Add to multiple dates to add repeating unavailability.

- Lastly, add the "Calendar" component as a section in the "Details" component once complete.
