# lucas-construction

Lucas Construction website and assets (static site + lightweight leads endpoint).

## Project Structure

- `/index.html` – Home page
- `/services.html` – Services details
- `/projects.html` – Portfolio gallery with lightbox
- `/about.html` – Company background
- `/contact.html` – Contact form submitting to API
- `/css/styles.css` – Shared styles and responsive layout
- `/js/main.js` – Navigation, lightbox, and form handling
- `/api/leads.js` – Netlify serverless function for lead intake
- `/netlify.toml` – Netlify function/publish configuration
- `/robots.txt` and `/sitemap.xml` – SEO basics

## Local Development

This is a static site. You can run any static server from the repository root, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Leads Endpoint

The contact form sends `POST /api/leads` with:

- `name`
- `email`
- `phone`
- `serviceType`
- `message`
- `company` (honeypot field)

The function validates input, applies a best-effort in-memory rate limit, blocks honeypot spam, and optionally sends email through Resend.
For production-grade distributed rate limiting across serverless cold starts, use a shared datastore or provider-native rate-limiting controls.

### Environment Variables

Set these in Netlify site settings:

- `ALLOWED_ORIGIN` (optional, recommended; example: `https://www.lucasconstructionco.com`)
- `RESEND_API_KEY` (optional; required if sending email)
- `LEADS_TO_EMAIL` (optional; required if sending email)
- `LEADS_FROM_EMAIL` (optional; required if sending email)

If email variables are not configured, submissions still return success and can be extended later for storage/notifications.

## Deployment (Netlify)

1. Connect this repository to Netlify.
2. Netlify will use `netlify.toml` to publish the static site and serve `api/leads.js` as a function.
3. Configure environment variables.
4. Configure custom domain and HTTPS in Netlify.

## Post-Launch Checklist

- Replace placeholder project media with optimized WebP images.
- Update company address, phone, email, and service area details.
- Add analytics snippet (for example Plausible) once domain is finalized.
- Submit `sitemap.xml` to Google Search Console.
