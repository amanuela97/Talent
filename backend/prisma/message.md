💬 Conversation
Represents one chat — either between two people or a group.

Has a list of:

Participants → who’s in the chat.

Messages → all messages sent in this chat.

updatedAt helps you sort chats by most recent activity.

🧍‍♂️🧍‍♀️ UserOnConversation
This is the link between a user and a conversation.

Allows many users in one conversation (group chat).

And allows each user to be in many conversations.

The @@unique([userId, conversationId]) makes sure a user can't be added twice to the same chat.

You can also add roles later (e.g. admin, muted, etc.) by expanding this model.

📨 Message
Represents a single message.

Belongs to one conversation.

Has:

senderId → who sent it.

read flag → whether the recipient(s) have read it.

For group chats, you may need to track who has read the message, not just a single read boolean — we’ll touch on that below.

🧑 User
This is your standard user model.

Keeps track of:

Messages they’ve sent.

Conversations they’re part of.

✅ Is this structure flexible for:
✅ 1-on-1 chats? Yes.

✅ Group chats? Yes.

✅ Message history per chat? Yes.

✅ Multiple conversations per user? Yes.
