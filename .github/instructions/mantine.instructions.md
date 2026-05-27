---
applyTo: 'apps/web/src/**/*.{ts,tsx,css},apps/web/src/theme.ts,apps/web/src/main.tsx'
---

# Mantine Instructions (BigBatch)

Use these rules whenever editing Mantine-based UI in this repository.

## Version We Use

- Installed in lockfile: Mantine v8.3.18 (`@mantine/core` and `@mantine/hooks`).
- Declared range in `apps/web/package.json`: `^8.1.2`.
- Treat this project as Mantine v8.x and write code compatible with v8 APIs.

## Documentation Source of Truth

- Primary reference: https://mantine.dev/llms.txt
- If you need the full combined documentation file: https://mantine.dev/llms-full.txt
- Prefer pages linked from `/llms` over blog posts or third-party examples.
- Do not introduce v9-only APIs unless the project is explicitly upgraded.

## Implementation Guidelines

- Prefer components and hooks from `@mantine/core` and `@mantine/hooks` before adding new UI dependencies.
- Keep styling aligned with Mantine v8 patterns: `MantineProvider`, theme overrides, `classNames`, `styles`, and style props.
- Favor theme-driven values (spacing, radius, colors, breakpoints) instead of hard-coded one-off values.
- For responsiveness, use Mantine layout primitives (`Container`, `Grid`, `Flex`, `Stack`, `Group`) and theme breakpoints.
- Keep accessibility intact by using Mantine component semantics and labeling patterns from docs.

## Skills to Load On Demand

Load the appropriate skill file before starting work in these scenarios:

| Scenario                                                                                                                                                                                                    | Skill to load               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Building a custom dropdown, searchable select, autocomplete, multi-select, or tags input using `Combobox` primitives (`useCombobox`, `Combobox.Target`, `Combobox.Option`, `Combobox.Dropdown`)             | `mantine-combobox`          |
| Creating or modifying a form with `useForm`, `getInputProps`, `onSubmit`, nested/array fields, `createFormContext`, `useField`, or async validation                                                         | `mantine-form`              |
| Creating a new custom component that uses `factory()`, `polymorphicFactory()`, `useProps`, `useStyles`, `createVarsResolver`, `StylesApiProps`, or needs to register with `MantineProvider` via `.extend()` | `mantine-custom-components` |

## Common Checks

- Ensure imports are from the correct Mantine packages and match v8 docs.
- Avoid private CSS variables and undocumented internals.
- If styles look broken, verify required Mantine package styles are imported per docs.
