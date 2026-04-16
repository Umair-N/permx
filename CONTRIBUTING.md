# Contributing to PermX

Thank you for considering contributing to PermX! This document outlines how to get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/permx.git
cd permx

# Install dependencies
bun install

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Build
bun run build

# Type check
bun run typecheck

# Validate package exports
bun run lint
```

## Project Structure

```
src/
├── types/           Type definitions (Permission, Role, Module, UserRole, etc.)
├── engine/          Core algorithms (key parser, DFS resolver, circular detector, path matcher)
├── cache/           Generic TTL cache
├── mongoose/        Mongoose adapter (schemas, data provider, factory, tenant plugin)
├── middleware/       Express middleware
├── errors.ts        Error class hierarchy
├── permx.ts         Core factory (createPermXCore)
├── index.ts         Main entry point
├── mongoose.ts      Mongoose entry point
└── express.ts       Express entry point
```

## Making Changes

1. Fork the repository and create a feature branch from `main`
2. Write tests first (TDD approach preferred)
3. Make your changes
4. Ensure all tests pass: `bun run test`
5. Ensure the build succeeds: `bun run build`
6. Ensure types are clean: `bun run typecheck`
7. Submit a pull request

## Code Style

- TypeScript strict mode is enabled
- Use `snake_case` for variables and function names (project convention)
- Avoid `any` — use proper types or `unknown` with narrowing
- Keep files under 400 lines (800 max)
- Write descriptive test names that explain the behavior under test

## Testing

- Unit tests go in `tests/` mirroring the `src/` structure
- Integration tests (Mongoose, Express) use `mongodb-memory-server` and `supertest`
- Coverage threshold: 70% statements, 80% branches/functions

## Commit Messages

Follow conventional commits:

```
feat: add prisma data provider
fix: handle expired role assignments in getUserRoles
test: add integration tests for mongoose schema factory
docs: update API reference for middleware configuration
```

## Reporting Issues

- Use GitHub Issues
- Include a minimal reproduction if reporting a bug
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)
