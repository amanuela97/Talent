- build an inbox/chat for chating following these instructions below.
- when building the UI for the following features try seperating parts into components and importing them instead of dumping all jsx in a single page.tsx file.
- The backend logic for this feature is already presesent inside /chat folder you can modify it only if required but try and integrate it.
- Enable Chat capabilities only After the Talent Accepts an Inquiry
- have the backend create the conversation once booking status is "ACCEPTED" and notify both parties that messaging is now available by displaying a UI for starting a conversation.

1. Pages & Dashboards to Build
   The chat feature should include two primary pages:

A. Inbox / Conversation List Page
Purpose: Show all the conversations pertinent to the logged-in user (whether an ADMIN, TALENT, or CUSTOMER).

Key Features:

Fetch Conversations: When the page loads, make an API call (e.g., GET //conversations?userId=...) to retrieve conversation metadata. Each conversation should include:

Conversation ID

Conversation name (or the names/avatars of the other participant(s))

Last message snippet

Timestamp from the latest message

Unread count

Role-Based Considerations:

Talents: Their inbox shows inquiries for which they are the booked talent. (Make sure to avoid showing conversations if a talent is trying to book themselves.)

Customers: They see all the booking inquiries they have initiated along with any approved conversations.

Admins: They see all conversations platform-wide (or they may have separate filtering).

Navigation: Each conversation should be clickable to navigate to the detailed chat view (e.g., dashboard/inbox/[conversationId]).

UI Example: A list or card layout with each conversation rendered as a row containing the conversation title, last message, and a badge with the unread number. Optionally, sorting or filtering options can be provided.

B. Conversation Detail (Chat Room) Page
Purpose: Allow real-time communication within a specific conversation.

Key Features:

Message List: Display messages in chronological order including:

Sender’s name and/or avatar

Message content

Time stamps and read receipts (if available)

Input Area & Controls:

A text input box to draft messages

A “Send” button that sends the message via websockets

Real-Time Updates:

Listen for newMessage events from the ChatGateway using Socket.IO.

Show typing status indicators by handling the typing event.

Read Status:

Automatically mark messages as read (via a socket event like markMessageRead as messages come into view).

UI Example: A full-page chat room that displays the entire conversation. The top can include the conversation header (showing the names/avatars of participants) and the message history below. The bottom has a persistent input field and send button.

1. Frontend-Backend Integration (Next.js + NestJS via Socket.IO)
   A. Setting Up Socket.IO Client in Next.js
   - Install Socket.IO Client Library:
   - Create a Custom Hook or Context: Build a reusable hook (for example, useChatSocket.js) to connect to your WebSocket server. Here’s a simplified version:

Use the Hook Inside Your Pages: In your conversation detail page (dashboard/inbox/[conversationId]).

B. Inbox / Conversation List Page

Role-Based Filtering: Make sure your backend API filters conversations based on the authenticated user’s ID so that talents only see their inquiries and customers see the ones they initiated.

C. Conversation Detail Page
Load Conversation History: When the conversation page is rendered, fetch the conversation’s history via an API endpoint (for example, GET /conversations/:conversationId).

Integrate Real-Time Chat: Use the socket hook created above to connect to the WebSocket server and join the corresponding room. The gateway code automatically joins the user to conversation-${conversation.id} rooms, so your messages automatically update for all participants.

- UI and Message Input: Create a component that:

- Displays a scrollable chat history (updates in real time when newMessage events arrive).

- Has an input field for the user to type a message.

- Calls sendMessage({ conversationId, content }) on submit.

- Triggers typing events as the user types.

- Emits markMessageRead when the user scrolls/read messages.

1. In Summary
   Pages to Build:

Inbox Page (/dashboard/inbox): Lists conversations relevant to the logged-in user, sorted and filtered by their role (talent, customer, admin).

Conversation Detail Page (dashboard/inbox/[conversationId]): Displays the thread of messages, a message input area, read receipts, typing indicators, and real-time updates.

Backend-Frontend Connection via WebSockets:

The ChatGateway in NestJS handles authentication, room joins, and listening to events.

Your Next.js frontend uses socket.io-client (wrapped in a hook or context) to connect, send, and receive real-time messages.

Events such as sendMessage, markMessageRead, and typing are all handled by your gateway and then broadcast to the appropriate rooms.
