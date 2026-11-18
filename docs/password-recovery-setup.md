# Password recovery setup

The application now includes a request page at `/forgot-password` and a new-password page at `/reset-password`. The flow uses Supabase Auth's `resetPasswordForEmail` and `updateUser({ password })` methods.

## Required Supabase configuration

1. In the Supabase Dashboard, open Authentication → URL Configuration.
2. Keep the production app URL as the Site URL.
3. Add this exact production redirect URL to the Redirect URLs allowlist:
   `https://masir-noor-learning-circle.lovable.app/reset-password`
4. If testing from the Lovable preview, add that preview's exact `/reset-password` URL separately. Do not add broad wildcards unless there is a clear operational need.
5. Verify that email sending is configured and that the password recovery email template sends users to the supplied redirect URL.

## Verification checklist

- Request recovery for an existing account and confirm the email arrives.
- Request recovery for an unknown email and confirm the page gives the same generic success message (do not reveal whether an account exists).
- Open a valid recovery link and set a password of at least eight characters.
- Confirm a mismatched confirmation is rejected.
- Confirm an expired or already-used link cannot change the password.
- Sign in with the new password and confirm the old password no longer works.
- Confirm the recovery URL remains on the approved application origin.

## Operational note

Supabase's default email sender is intended for trying out the service and is rate-limited. Configure a reliable custom SMTP provider before relying on password recovery for a public production launch.

No database schema change is required for this feature. The recovery flow is not considered production-verified until the redirect allowlist and email delivery are configured and the checklist above is completed.
