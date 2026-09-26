# Standup board

A Hono app on Node. Sign in, then the board loads today's tasks from `/api/tasks`.

> This repository is a disposable test fixture for [Observed](https://github.com/esau-morais/observed).

## Develop

```bash
npm install
npm start   # http://127.0.0.1:3000 (set PORT to change it)
```

Sign in as `grace@example.com`. The password is not committed: developers have
it in the `BOARD_PASSWORD` environment variable, and CI reads the
`BOARD_PASSWORD` Actions secret.

Tasks reset every morning.
