# I need you to implement the following routes.

- /forgot-password POST JSON body { email }
- /reset-password POST JSON body { token, newPassword }

# Additional instrucions

- The forgot-password logic needs to check if the email in the body exists
- If it does then create a unique token (use crypto-js togenerate token) linked to the user to generate a password reset url
- Add a token expiration eg. 15min to ensure reset links sent to the users email becomes invalid after a set time (15min)
- Allow only one active reset token at a time per user to prevent abuse.
- Then send the reset url (http://localhost:3000/reset-password/{token}) to the users email using nodemailer
- Then when /reset-password gets called, query the database by the reset token. return an error if invalid or expired.
- Otherwise hash the new password and update it in the databse
- clear the reset token and expiry time and send a success message to client.
- const transporter = nodemailer.createTransport({
  service: "gmail", // For example, using Gmail
  auth: {
  user: process.env.MAIL_USER, // Your email
  pass: process.env.MAIL_PASS, // Your email password
  },
  });
