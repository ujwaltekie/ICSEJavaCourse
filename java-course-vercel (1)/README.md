# Make the enquiry form email you (Vercel + Resend)

Your site is one page (`index.html`) plus one small serverless function (`api/enroll.js`).
When a parent submits the form, the page sends the details to `/api/enroll`, and that function emails them to you.

Folder layout (keep it exactly like this):

```
your-project/
  index.html
  api/
    enroll.js
```

## 1. Get a free Resend account (the email sender)
1. Go to https://resend.com and sign up using the email address where you want to receive enquiries.
2. In the dashboard open **API Keys** > **Create API Key** (permission: "Sending access"). Copy the key (starts with `re_`). You only see it once.

## 2. Put the project on Vercel
Pick whichever you prefer:

**Option A: GitHub (recommended)**
1. Create a new GitHub repository and upload `index.html` and the `api` folder.
2. On https://vercel.com click **Add New > Project**, import the repository and press **Deploy**.

**Option B: Vercel CLI**
1. Install Node.js, then run `npm i -g vercel`.
2. In the project folder run `vercel` and follow the prompts (use `vercel --prod` for the final deploy).

## 3. Add the environment variables
In Vercel open your project > **Settings > Environment Variables** and add:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the key you copied from Resend |
| `TO_EMAIL` | the email address that should receive enquiries |
| `FROM_EMAIL` (optional) | e.g. `Code Craft Club <enquiries@yourdomain.com>` |

Then go to **Deployments**, open the latest one, and choose **Redeploy** (variables only apply to new deployments).

## 4. Test it
Open your live site, fill the form and submit. The email should arrive within a few seconds (check Spam the first time).

## Good to know
- **Testing sender:** without `FROM_EMAIL`, emails are sent from `onboarding@resend.dev`. Resend only allows this sender to deliver to the email address you signed up with, which is fine if `TO_EMAIL` is that same address.
- **Your own sender address:** to send from your domain (or to deliver to a different inbox), add and verify your domain in Resend (**Domains**), then set `FROM_EMAIL`.
- **Spam protection:** the form has a hidden honeypot field, and the function validates every field on the server.
- **Limits:** Resend's free plan comfortably covers enquiry forms. Check Resend's pricing page for the current limits.
- **If the form shows an error:** open Vercel > your project > **Logs** and look at the `/api/enroll` function. Most issues are a missing environment variable (redeploy after adding) or a typo in the API key.
- **Phone validation:** accepts 10-digit Indian mobile numbers starting with 6 to 9, optionally with +91.
- **Prefer no code?** A hosted form service such as Web3Forms or Formspree also works: point the form's `fetch` URL to their endpoint instead of `/api/enroll`. The Resend setup above keeps everything in your own project and your keys private.
