📋 Talent Onboarding Flow – Updated Implementation Instructions
🧩 Overview
Implement a protected, guided process at the /join route for onboarding new talents. Talents must be registered users, submit profile details via a multi-step form, verify their email, and await admin approval. Create a page for admin approval or rejection. Then send email once admin approves.

✅ Step-by-Step Instructions

1. Handle /join Route Access
   If the user is not authenticated:

Show a UI message:

“You need to have an account before becoming a talent.”

Include a button:
➡️ “Log in or Sign up” → redirects to /login?redirect=/join

If the user is authenticated:

Proceed to the multi-step form.

2. Multi-Step Talent Registration Form
   🔧 Technologies:
   Use React Hook Form with Zod or Yup validation, and store data in form context or Zustand between steps.

🔄 Form Steps and Fields:

| Step   | Fields                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------- |
| Step 1 | `firstName`, `lastName`                                                                           |
| Step 2 | `generalCategory` → Dropdown (e.g., Musician, Dancer, Magician)                                   |
| Step 3 | `specificCategory` → Filtered Dropdown (e.g., Folk Band, Country Singer) based on generalCategory |
| Step 4 | `serviceName` → Input (catchy title of act shown on public profile)                               |
| Step 5 | `address` → Input (used internally for location/distance only; not public)                        |
| Step 6 | `phoneNumber`                                                                                     |
| Step 7 | Review + Submit                                                                                   |

✅ On submit, call POST /talent and send all form data with:

{
emailVerified: false,
status: "pending",
verificationToken: "some-random-uuid"
}

1. Trigger Email Verification
   After the form is submitted:

Backend sends a verification email with a link:

https://yourapp.com/verify-email?token=<token>

Use Nodemailer from the NestJS backend.

4. Verify Email
   Create a public route /verify-email in Next.js.

On load:

Extract token from query string.

Send POST /talent/verify-email { token } to backend.

On success:

Redirect to /join/pending.'

5. Pending UI (on /join/pending)
   This is shown to users after email verification.

Display message:

"Thank you! Your profile is under review. We’ll notify you once it’s approved."

6. Approval Workflow
   In the NestJS admin panel or manually:

Admin reviews submitted talents and updates:

talent.status = "approved" or "denied"

Once status === "approved", users get access to the Talent Dashboard (/dashboard)

8. Send Email Upon Approval
   Once talent is approved:

Backend sends email:

Subject: "You're Approved!"
Body: “Your talent profile has been approved. You can now log in and access your dashboard.”

🔐 Route Access Summary

| Route                 | Public | Authenticated | Special Condition                                          |
| --------------------- | ------ | ------------- | ---------------------------------------------------------- | --- |
| `/join`               | ✅     | ✅            | Form shown only if not pending or approved                 |
| `/verify-email`       | ✅     | —             | Token in query                                             |
| `/join/pending`       | —      | ✅            | `emailVerified && status === 'pending'`                    |
| `/dashboard` & others | —      | ✅            | Redirect to `/join/pending` unless `status === 'approved'` |     |

create the API Endpoints if they do not already exists
