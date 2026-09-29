# 06 - API Bootstrap

Source: `apps/api/src/main.ts`

## Why This File Matters

This is the entry point for the NestJS API process. In backend apps, bootstrap files are where cross-cutting HTTP behavior gets installed: security headers, validation, CORS, global prefixes, and ports.

## Line-By-Line Reading Notes

Line 1 imports `reflect-metadata`. NestJS uses decorators heavily, and decorator metadata requires this runtime support.

Line 2 imports `ValidationPipe`. This is the Nest mechanism that applies DTO validation.

Line 3 imports `NestFactory`, which creates the application.

Line 4 imports `helmet`, a middleware that sets safer HTTP headers.

Line 5 imports `AppModule`, the root module that connects all feature modules.

Line 7 starts `bootstrap()`. This pattern keeps async startup clean.

Line 8 creates the Nest app from `AppModule`.

Line 9 sets the global API prefix to `/api`. This means `HealthController` at `health` becomes `/api/health`.

Lines 10-13 enable CORS for the local web app. The frontend runs on port 3000 and the API runs on port 4000, so browsers require CORS.

Line 14 installs Helmet.

Lines 15-21 install the global validation pipe. `whitelist: true` removes unexpected request properties. `transform: true` converts payloads into DTO instances and handles decorated conversions. `forbidNonWhitelisted: true` rejects extra properties instead of silently dropping them.

Line 23 reads the API port, defaulting to 4000.

Line 24 starts listening.

Line 27 calls `bootstrap()` and intentionally ignores the returned promise with `void`. That makes it clear startup begins here.

## Codebase Connections

- All controllers depend on the validation pipe to enforce DTO decorators.
- The web client assumes the API is reachable at `http://localhost:4000/api`.
- Helmet and CORS apply to every route.

## Senior-Level Questions

- Should CORS origins come from environment config instead of being hardcoded?
- Should startup failures be logged through structured logging?
- Should global exception filters be added for consistent error responses?
