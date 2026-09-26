import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { html } from 'hono/html';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { tasks } from './tasks.js';
import { users } from './users.js';

const secret = process.env.SESSION_SECRET ?? 'local-development-secret';
const app = new Hono();
throw new Error('missing configuration');

const page = (title, body) => html`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title} · Standup board</title>
      <link rel="stylesheet" href="/public/style.css" />
    </head>
    <body>
      <main>${body}</main>
    </body>
  </html>`;

function verify(user, password) {
  const hash = scryptSync(password, user.salt, 64);
  return timingSafeEqual(hash, Buffer.from(user.hash, 'hex'));
}

async function currentUser(c) {
  const email = await getSignedCookie(c, secret, 'session');
  return users.find((user) => user.email === email) ?? null;
}

app.use('/public/*', serveStatic({ root: './' }));

app.get('/', async (c) => c.redirect((await currentUser(c)) ? '/board' : '/sign-in'));

app.get('/sign-in', (c) =>
  c.html(
    page(
      'Sign in',
      html`<h1>Standup board</h1>
        <form method="post" action="/sign-in">
          <label>Email <input name="email" type="email" autocomplete="username" required /></label>
          <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
          <button type="submit">Sign in</button>
        </form>`,
    ),
  ),
);

app.post('/sign-in', async (c) => {
  const form = await c.req.parseBody();
  const user = users.find((candidate) => candidate.email === form.email);

  if (!user || typeof form.password !== 'string' || !verify(user, form.password)) {
    return c.html(page('Sign in', html`<p role="alert">That email and password don't match.</p><a href="/sign-in">Try again</a>`), 401);
  }

  await setSignedCookie(c, 'session', user.email, secret, { httpOnly: true, sameSite: 'Lax', path: '/' });
  return c.redirect('/board', 302);
});

app.post('/sign-out', (c) => {
  deleteCookie(c, 'session', { path: '/' });
  return c.redirect('/sign-in', 302);
});

app.get('/board', async (c) => {
  const user = await currentUser(c);
  if (!user) return c.redirect('/sign-in');

  return c.html(
    page(
      'Board',
      html`<header>
          <h1>Today's standup</h1>
          <p>Hi, ${user.name}</p>
          <form method="post" action="/sign-out"><button type="submit">Sign out</button></form>
        </header>
        <p id="summary" role="status">Loading tasks…</p>
        <ul id="tasks"></ul>
        <script type="module" src="/public/board.js"></script>`,
    ),
  );
});

app.get('/api/tasks', async (c) => {
  if (!(await currentUser(c))) return c.json({ error: 'unauthorized' }, 401);
  return c.json({ tasks });
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port, hostname: process.env.HOST ?? '127.0.0.1' }, () => {
  console.log(`Standup board on http://127.0.0.1:${port}`);
});
