# Accessibility notes (WCAG 2.2 AA target)

**Method and limits.** This pass was done by reading and editing the code. No
tooling was run: not ESLint, axe, Lighthouse, a screen reader, or a browser.
Nothing here is verified, and the app is **not** claimed to be WCAG 2.2 AA
conformant. Run `npm run lint`, axe and a manual keyboard and screen-reader
pass before relying on any of it.

## What was changed

| Criterion | Change |
| --- | --- |
| 3.1.1 Language | `<html lang="en">` was already present. |
| 2.4.2 Page titled | Per-page `metadata.title` with a `%s \| Sadhusanga` template; `/login` gets a title through its own layout. |
| 1.3.1 / 2.4.1 Landmarks, bypass blocks | Skip link to `#main-content`; `<main>` on app pages and the login page; the two `<nav>` landmarks are labelled "Main" and "Mobile"; `aria-current="page"` in the mobile nav; the decorative background is `aria-hidden`. |
| 1.3.1 Headings | Login and song pages now have an `<h1>`. |
| 2.4.7 / 2.4.13 Focus visible | One global `:focus-visible` outline (2px, `--ring` gold) that is not in a CSS layer, so it overrides the components' `outline-none`. |
| 2.4.11 Focus not obscured | `scroll-padding` for the sticky header and fixed bottom nav. |
| 4.1.2 Name, role, value | Account menu trigger, remove/add/move buttons in the setlist builder, transpose and font-size controls, performance-mode exit and the install banner are labelled. Log-out is a real menu item instead of a `<button>` wrapping one. The wake-lock toggle exposes `aria-pressed`. Chord diagrams have `role="img"` with a text description of the fingering. |
| 2.5.7 Dragging movements | Move up/down buttons beside each setlist row, with a toast announcing the new position. |
| 3.3.1 / 4.1.3 Errors and status | Form errors use `role="alert"`, successes use `role="status"`, the login fields get `aria-invalid` and `aria-describedby` on failure. |
| 1.3.5 / 3.3.7 / 3.3.8 Autocomplete, authentication | `autocomplete` on email, password and name fields. |
| 3.3.2 Labels | A non-control `<Label>` on the profile form became plain text. |
| 1.4.3 / 1.4.11 Contrast | Muted text raised to 70% white; placeholders use the muted colour instead of 60% of it; `text-zinc-500/600` on dark surfaces became `zinc-400`; input borders raised from 15% to 40% white. Text below 12px was raised to 12px. These are estimates, not measured. |
| 2.5.8 Target size | Coarse-pointer sizes (`pointer-coarse:`) for buttons, aiming at 40-48px on touch devices. Fine-pointer sizes of 24px and up already met the 24px minimum. |
| 2.3.3 / motion | A global `prefers-reduced-motion` rule shortens all animations and transitions. |
| 2.1.2 / 2.4.3 Performance mode | The full-screen reader is a `role="dialog" aria-modal`, moves focus in on open and restores it on close. Escape already closed it. |
| Lint | The full `jsx-a11y` rule set is enabled in `eslint.config.mjs`. |

## Known remaining issues (honest list)

- **Not verified.** The ESLint rule set was enabled without being run, so it
  may report findings in files I did not touch.
- **Performance mode has no focus trap.** Focus starts inside the dialog, but
  Tab can still reach the page behind it. The background is not `inert`.
- **Contrast is unmeasured.** Text sits on translucent panels over an image, so
  the real ratio varies. Some amber, blue and red tinted badges were not
  checked.
- **Native `confirm()` and `alert()`** are still used for deletes and for an
  unsupported wake lock. They are accessible but inconsistent with the rest of
  the UI.
- **Link purpose.** "Listen" links open a new tab without saying so.
- **Desktop nav links** have no `aria-current`.
- **Drag handle text.** Keyboard dragging comes from `@hello-pangea/dnd`; its
  built-in instructions were not reviewed.
- **Chord buttons** inside lyrics rely on a popover; popover focus handling
  was not tested.
- **Print styles and the offline page** were not reviewed.
- **Touch target spacing** for dense rows (RSVP lists, admin table) was not
  checked.
