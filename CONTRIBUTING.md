# Contributing

## Getting set up

```sh
tsc -p nodes/tsconfig.json --noEmit
node --test dist/
```

The repo root holds exported workflow JSON. The TypeScript under `nodes/` is the custom-node source; `rules.ts` imports nothing from n8n so it type-checks and tests standalone.

## Before opening a pull request

- The test command above passes
- New behaviour has a test alongside it
- Public functions carry a comment saying *why*, not restating the signature

## Commit messages

Explain why the change is needed. The diff already says what it does.
