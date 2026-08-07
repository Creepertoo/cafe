# Urban Plaza Cafe — Cloudflare Worker

The full site rebuilt on Cloudflare's own stack: a static frontend (animated
home page with a draggable 3D coffee-cup showcase, live menu, order-request
page, reviews section) served as static assets from a Cloudflare Worker,
with the backend as API routes in that same Worker, backed by a D1 database,
photo uploads in R2, and order notification emails sent through Resend. No
online payment, order requests save to the admin panel and email you; the
customer pays in person or by phone.

This deploys as a **Worker with static assets** (via `wrangler deploy`),
which is what Cloudflare's dashboard sets up by default now when you connect
a git repo under Workers & Pages, rather than the older separate "Pages"
product. Functionally identical, just a different build path.

## What's real vs. placeholder

Pulled from the cafe's Google Business listing: name, address, phone, price
range, star rating/review count, and the three menu highlights Google shows
(Kitfo with Tibsi, Shiro, Latte), plus a few real customer review quotes.

Everything else is a realistic starting point to confirm in the admin panel
before launch: the rest of the menu, and hours (only the 6:30 PM closing
time was confirmed by Google).

## What you'll set up

- A **GitHub repo** with this code (you push it, Cloudflare builds from it)
- A **Cloudflare Worker** connected to that repo (Workers & Pages > your project)
- A **D1 database** (Cloudflare's serverless SQLite) for menu/orders/reviews/settings
- An **R2 bucket** for uploaded photos
- A free **Resend** account for the order notification email

None of this needs a credit card beyond what you already have for Cloudflare;
D1, R2, and Workers all have generous free tiers for a small business site.

## Step 1: push to GitHub

Push this folder's contents to your GitHub repo (replace what's there now):
via GitHub's "Upload files" in the browser (drag in every file/folder from
this project, keeping the same structure), or
`git add -A && git commit -m "Fix Cloudflare deploy" && git push` from your
machine if you have git installed.

Before you push, open `wrangler.toml` in this project and check the `name`
field matches your actual Cloudflare project name exactly (the one shown at
the top of its dashboard page, `cafe` in the screenshot you shared). Change
it if it's different.

## Step 2: create the D1 database

1. Cloudflare dashboard -> **Workers & Pages > D1** -> **Create database**.
   Name it `urban-plaza-cafe` (matches `schema.sql` and `wrangler.toml`).
2. Open the new database -> **Console** tab.
3. Paste the entire contents of `schema.sql` (in this repo) and run it. This
   creates the tables and loads the starter menu/reviews/settings.
4. On the database's **Overview** tab, copy its **Database ID** (a UUID).
   Open `wrangler.toml` in your repo and replace the placeholder
   `database_id` under `[[d1_databases]]` with it, then commit and push.
   (Skip this if your project's Settings page has its own **Bindings**
   section where you can attach the D1 database directly, either way works,
   just don't do both or they can conflict.)

## Step 3: create the R2 bucket

Cloudflare dashboard -> **R2** -> **Create bucket**. Name it
`urban-plaza-cafe-photos` (matches `wrangler.toml`).

## Step 4: redeploy

Your project is already connected to the repo (that's the screenshot you
showed). With `wrangler.toml` fixed and pushed, go to the project's
**Deployments** tab and retry the failed deployment, or just push a commit
to trigger a new one. The build log should now show
`Executing user deploy command: npx wrangler deploy` completing without the
"Missing entry-point" error.

## Step 5: set secrets and finish bindings

On your project's Settings page, scroll to **Variables and secrets** (the
section visible in your screenshot) and add these, marked **Secret** where
noted:

| Variable | Value | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | a password you choose | Secret. Used the first time you log in; change it from the admin panel afterward. |
| `SESSION_SECRET` | a long random string | Secret. Anything long and random. |
| `RESEND_API_KEY` | your Resend API key | Secret. From Step 6 below. |
| `RESEND_FROM_EMAIL` | e.g. `orders@yourdomain.com` | Only works once that domain is verified in Resend; otherwise leave unset to use Resend's shared test sender. |
| `ADMIN_EMAIL` | your real inbox | Where order notifications are sent. |

If that same Settings page has a **Bindings** section (look below
"Variables and secrets"), you can attach the D1 database and R2 bucket
there instead of editing `wrangler.toml`, use whichever you see; both
achieve the same thing.

After adding these, redeploy again (Deployments tab -> Retry, or push
another commit) so the Worker picks them up.

## Step 6: set up Resend (order notification emails)

1. Create a free account at https://resend.com.
2. Grab an API key from the Resend dashboard, paste it into
   `RESEND_API_KEY` above.
3. For the fastest start, leave `RESEND_FROM_EMAIL` unset, Resend's shared
   sender works without any extra setup for low volume. When you're ready,
   verify your own domain in Resend and switch `RESEND_FROM_EMAIL` to an
   address on it for better deliverability.

If you'd rather skip email entirely, just don't set `RESEND_API_KEY`, orders
will still save and show up in the admin panel, the email step is skipped
silently.

## Using the site

- Public site: your `*.workers.dev` URL (shown on the project dashboard), or
  your own domain once connected under **Custom domains**.
- Admin panel: `/admin/` on that same URL. Log in with `ADMIN_PASSWORD`
  from Step 5, then change it immediately from the Account tab.
- Manage menu items (with photos), watch incoming orders, moderate reviews,
  edit site text/colors/contact info/hours, all from the admin panel.

## Local development (optional)

Requires Node.js. `wrangler.toml` in this folder already declares the DB and
STORAGE bindings for local use (production bindings are separate, set up in
Step 5 above). From this folder:

```bash
npm install -g wrangler
wrangler d1 execute DB --local --file=schema.sql
wrangler dev --local --var ADMIN_PASSWORD:changeme123 --var SESSION_SECRET:devsecret
```

This runs a local copy of Cloudflare's Worker/D1/R2 stack on your machine
(via Miniflare) with local, disposable data, nothing touches your real
Cloudflare account. Run the `d1 execute` command above before starting the
dev server each time you delete `.wrangler/` (that folder holds the local
database file).

## A note on how this was built

I wrote and reviewed every file by hand and syntax-checked every route with
Node, then ran the whole thing locally with Wrangler's Cloudflare
Worker/D1/R2 simulator (Miniflare, via `wrangler dev`, the same command
path your dashboard uses for `wrangler deploy`) and exercised every page
and API route end to end before handing it to you: page loads, static
assets, auth gating, admin login, order placement with server-side pricing,
order status updates, review posting, and a full photo upload/retrieve
round trip through R2. I could not reach your actual Cloudflare account or
a real Resend account from this sandbox, so the very last mile (your real
bindings, secrets, and email delivery) still needs your own verification
after deploying.

## Manual test checklist (please run after deploying)

- [ ] Homepage loads, 3D cup renders and responds to drag, featured dishes
      and reviews show
- [ ] Leaving a review on the homepage works and appears immediately
- [ ] Menu page shows all items grouped by category, filters work
- [ ] Order page: add items, submit a test order with your own phone number
- [ ] Test order appears under the admin panel's Orders tab
- [ ] Test order email arrives (check spam folder first)
- [ ] Admin panel: add a menu item with a photo, confirm the photo shows on
      the Menu and Order pages
- [ ] Admin panel: change a color, confirm the live site updates
- [ ] About page shows your real address/phone/hours

## File structure

```
urban-plaza-cafe-cloudflare/
  wrangler.toml            Worker config: name, D1/R2 bindings, static assets directory
  worker/index.js          The Worker entry point: routes /api and /uploads, serves everything else as static assets
  public/                  Static frontend (the [assets] directory)
    index.html, menu.html, order.html, about.html
    admin/                  Admin panel
    css/, js/                Styles + the 3D showcase, cart, page scripts
  functions/                Route handlers, imported by worker/index.js (kept in the
                             Pages-Functions file layout so nothing had to be rewritten)
    _shared/auth.js          Password hashing + signed session cookies (Web Crypto, no dependencies)
    api/menu.js, menu/[id].js
    api/reviews.js, reviews/[id].js
    api/orders.js, orders/[id].js    Order creation + Resend email
    api/settings.js
    api/admin/login.js, logout.js, session.js, change-password.js
    api/upload.js             Saves photos to R2
    uploads/[filename].js     Serves photos back out of R2
  schema.sql                 D1 tables + starter content
```
