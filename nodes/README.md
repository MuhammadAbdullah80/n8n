# Custom nodes

TypeScript sources for the custom n8n nodes used by the workflows in this repo.

## Workflow Guard

Validates items mid-run and decides what happens to the ones that fail, so a
malformed webhook payload no longer takes a whole execution down.

Every workflow here had grown the same IF → Stop-and-Error pair copied inline.
This replaces that with one configurable node.

**Rules** — each rule is a dot path into the item plus a condition:

| Condition | Passes when |
|-----------|-------------|
| `exists` | the path is present, even if empty |
| `notEmpty` | present and not whitespace-only |
| `isEmail` | one `@`, a dot in the domain, no whitespace |
| `isNumber` | finite number; empty strings and booleans rejected |
| `regex` | matches the supplied pattern |

**On failure** — `route` sends failures down a second output with a
`__violations` array attached, `throw` stops the execution, `drop` discards
them silently.

## Layout

`rules.ts` holds the evaluation logic and imports nothing from n8n, so it can be
type-checked and unit-tested on its own. `WorkflowGuard.node.ts` is the thin n8n
binding around it.

## Development

```sh
tsc -p nodes/tsconfig.json     # type-check and build
node --test dist/              # run the rule tests
```
