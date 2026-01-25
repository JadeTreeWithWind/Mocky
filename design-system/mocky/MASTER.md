# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Mocky
**Generated:** 2026-01-25 21:18:19
**Category:** Financial Dashboard

---

## Global Rules

### Color Palette

### Color Palette (Dark Mode - High Contrast)

| Role              | Hex       | CSS Variable                | Description                          |
| ----------------- | --------- | --------------------------- | ------------------------------------ |
| Background        | `#09090b` | `--color-background`        | Very dark gray/black (Zinc 950)      |
| Surface           | `#18181b` | `--color-surface`           | Dark gray card background (Zinc 900) |
| Surface Highlight | `#27272a` | `--color-surface-highlight` | Hover state (Zinc 800)               |
| Border            | `#3f3f46` | `--color-border`            | Subtle borders (Zinc 700)            |
| Text Primary      | `#f8fafc` | `--color-text-primary`      | Main text (Zinc 50)                  |
| Text Secondary    | `#a1a1aa` | `--color-text-secondary`    | Subtitles/Muted (Zinc 400)           |
| Primary Accent    | `#fafafa` | `--color-primary`           | White for key actions                |
| Secondary Accent  | `#52525b` | `--color-secondary`         | Gray for secondary actions           |

**Color Notes:**

- Strict Zinc/Slate grayscale.
- High contrast text for readability.
- No colorful distractions.

### Typography

- **Heading Font:** Inter, system-ui, sans-serif
- **Body Font:** Inter, system-ui, sans-serif
- **Mood:** Professional, Clean, Developer-focused
- **Google Fonts:** [Inter](https://fonts.google.com/specimen/Inter)

### Spacing Variables

| Token         | Value  | Usage                     |
| ------------- | ------ | ------------------------- |
| `--space-xs`  | `4px`  | Tight gaps                |
| `--space-sm`  | `8px`  | Icon gaps, inline spacing |
| `--space-md`  | `16px` | Standard padding          |
| `--space-lg`  | `24px` | Section padding           |
| `--space-xl`  | `32px` | Large gaps                |
| `--space-2xl` | `48px` | Section margins           |

### Shadow Depths (Dark Mode)

| Level           | Value                             | Usage             |
| --------------- | --------------------------------- | ----------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0,0,0,0.3)`       | Subtle separation |
| `--shadow-md`   | `0 4px 6px rgba(0,0,0,0.4)`       | Cards, dropdowns  |
| `--shadow-glow` | `0 0 15px rgba(255,255,255,0.05)` | Highlights        |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-background);
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: var(--color-text-primary);
  background: var(--color-surface-highlight);
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}
```

### Inputs

```css
.input {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 10px;
  border-radius: 6px;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}
```

---

## Page Pattern

**Pattern Name:** Developer Dashboard
**Structure:**

1. Sidebar Navigation (Left)
2. Top Bar (Context/Search)
3. Main Content Area (Scrollable)
4. Context Panels (Right/Bottom)

---

## Anti-Patterns (Do NOT Use)

- ❌ Light mode default
- ❌ Slow rendering

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
