# Feature 17 - CI Pipeline

## Plan

### Goal

Add a GitHub Actions workflow that runs the core verification steps for every push or pull request.

### Impacted Codebase Areas

- `.github/workflows/ci.yml`: new CI workflow.
- `docs/features/17-ci-pipeline.md`: plan and build journal.

### Implementation Approach

1. Check out the repository.
2. Set up Node.js.
3. Enable Corepack/pnpm.
4. Install dependencies.
5. Generate Prisma Client and OpenAPI types.
6. Run typecheck, tests, and build.

### Design Considerations

- The first CI workflow does not require Docker because not every feature test is integration-level yet.
- Testcontainers integration tests remain opt-in.
- CI should grow with the project: linting, migrations, Playwright, and Docker-backed tests can be added as the codebase matures.

## Build Journal

Added `.github/workflows/ci.yml` to run on pushes and pull requests. The workflow checks out the repository, sets up pnpm, sets up Node 22 with pnpm dependency caching, installs dependencies, generates Prisma Client and OpenAPI types, then runs typecheck, tests, and build.

The workflow intentionally keeps Docker-backed integration tests out of the default path for now. That makes CI useful immediately without requiring service containers. A later CI slice can add PostgreSQL/Redis services and run `RUN_INTEGRATION_TESTS=1` once the integration suite becomes a regular quality gate.

Local verification matched the workflow shape: dependency install, Prisma generation, contract generation, typecheck, tests, and production build all ran successfully.

The key lesson is that CI is part of the architecture. It encodes what "healthy enough to merge" means. As the codebase grows, that definition should grow too: linting, migrations, browser tests, integration tests, and security checks can become separate jobs.
