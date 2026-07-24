# Contributing

Thank you for helping improve JSON-LD Checker.

## Before You Start

- Search existing issues before opening a new one.
- Use an issue to discuss large features or behavior changes first.
- Never include API keys, private page data, or other credentials in issues,
  screenshots, fixtures, or commits.

## Local Setup

```bash
git clone https://github.com/simonguo/json-ld-checker.git
cd json-ld-checker
npm ci
npm run check
```

Node.js 20.19+ and npm 10+ are required. The repository's `.nvmrc` selects
the Node.js version used in CI.

## Development Guidelines

- Keep top-level React pages focused on state orchestration.
- Put reusable UI primitives in `src/components/ui/`.
- Put provider metadata in `src/config/ai-providers.ts`; do not duplicate
  provider endpoints or model IDs in components.
- Preserve existing Chrome Storage keys unless a migration is included.
- Add or update tests for validation rules, JSONPath behavior, provider request
  formats, and user-visible workflows.
- Keep English and Simplified Chinese interfaces functionally equivalent.
- Use semantic colors: blue for interaction, green for success, and red or
  yellow only for problems.

## Pull Requests

1. Create a focused branch from `main`.
2. Make the smallest coherent change.
3. Run `npm run check`.
4. Update documentation and `CHANGELOG.md` when behavior changes.
5. Open a pull request using the repository template.

Pull requests should explain the user impact, implementation approach, test
coverage, and any remaining limitations.

## Updating AI Providers

AI model lists change frequently. Use official provider documentation as the
source of truth and include the source links in the pull request. Verify:

- exact model IDs;
- default API endpoint and authentication format;
- `max_tokens` versus `max_completion_tokens`;
- unsupported sampling parameters;
- non-streaming response shape.

## Reporting Security Problems

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).
