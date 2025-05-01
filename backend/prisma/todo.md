GET /conversations # List user's conversations
POST /conversations # Create new conversation (group or 1-on-1)
GET /conversations/:id # Get specific conversation
PATCH /conversations/:id # Update (e.g., rename group)
DELETE /conversations/:id # Delete conversation

GET /conversations/:id/messages # Get messages in a conversation
POST /conversations/:id/messages # Send a new message
GET /conversations/:id/messages/:mid # Get a specific message

POST /messages/:id/read-status # Mark message as read by current user
GET /messages/:id/read-status # See which users have read it (for group chats)
