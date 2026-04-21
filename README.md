# Resume as Code

YAML-driven, print-ready resume built with **React + TypeScript + Vite**.

`resume.yaml` is the repo source of truth. A small generator validates it, emits typed TS data, React renders the A4 resume, and Playwright exports a PDF to `dist/resume.pdf`. The browser UI also includes a local YAML editor for quick preview changes.

Target role: **DevOps / SRE / Platform Engineer**.

---

## Architecture

```text
resume.yaml
  -> scripts/generate-resume.ts
  -> src/resume.generated.ts
  -> src/App.tsx
  -> npm run export:pdf
  -> dist/resume.pdf
```

- **Content** lives in [resume.yaml](resume.yaml).
- **Schema + shared types** live in [src/resumeSchema.ts](src/resumeSchema.ts) and [src/resumeTypes.ts](src/resumeTypes.ts).
- **Generated data** lives in `src/resume.generated.ts`; do not edit it manually.
- **Layout, YAML editor, font picker, print CSS, and preview-fit logic** live in [src/App.tsx](src/App.tsx).
- **PDF export** is automated by [scripts/export-pdf.ts](scripts/export-pdf.ts) using Playwright Chromium.

`public/resume.pdf` is kept as the historical/reference PDF that seeded this resume. Generated output goes to `dist/resume.pdf`.

---

## Data Model

The YAML file defines:

- `profile`: name, title, contact bar.
- `summary`: rich text spans.
- `projects`: highlighted projects with optional link metadata.
- `experience`: roles, periods, metric-heavy bullets.
- `skills`: compact grouped skills.
- `education`: school entries and bullets.
- `certifications`: credentials with optional verification URLs.

Rich text uses structured spans instead of JSX or markdown:

```yaml
summary:
  - text: "DevOps / SRE / Platform Engineer"
    marks: [bold]
  - text: " with "
  - text: "3+ years"
    marks: [bold]
  - text: " building cloud-native systems."
```

Supported span fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `text` | yes | Text to render. |
| `marks` | no | `bold`, `code`, or both. |
| `href` | no | Renders the span as a link. |

Validation uses `zod`. If the YAML shape is invalid, `npm run generate:resume` prints the failing schema path.

---

## Commands

### Install

```bash
npm install
```

Playwright needs a local Chromium binary before PDF export:

```bash
npx playwright install chromium
```

### Generate typed resume data

```bash
npm run generate:resume
```

This reads `resume.yaml`, validates it, and rewrites `src/resume.generated.ts`.

### Run in dev

```bash
npm run dev
```

The dev script generates resume data once, then starts Vite. Open the URL shown by Vite, usually `http://localhost:5173`.

### Type-check and build

```bash
npm run build
```

The build script regenerates resume data, runs `tsc -b`, and builds the Vite app into `dist/`.

### Export PDF

```bash
npm run export:pdf
```

This runs the build, starts a local Vite preview server, opens it with Playwright Chromium, resets any preview zoom, and writes:

```text
dist/resume.pdf
```

### Lint

```bash
npm run lint
```

---

## Browser UI

The browser app supports local YAML preview, manual review, and printing:

1. Run `npm run dev`.
2. Edit YAML in the left panel.
3. Click **Apply YAML** to update the resume preview.
4. Pick a font from the **Font** dropdown.
5. Click **Preview fit** to apply the one-page scaling on screen.
6. Click **Download PDF** to open the browser print dialog.

For manual browser printing, choose **Save as PDF** and uncheck **Headers and footers** in the print dialog.

The browser editor stores drafts in `localStorage`; it does not write back to repo files. The automated `npm run export:pdf` command avoids the manual print dialog and exports from repo `resume.yaml`.

---

## Editing

### Change content

Edit [resume.yaml](resume.yaml), then run:

```bash
npm run generate:resume
```

Do not edit `src/resume.generated.ts`; it is overwritten by the generator.

For browser-only drafts, edit the YAML panel and click **Apply YAML**. Use **Reset** to clear the browser draft and return to repo `resume.yaml`.

### Change layout or theme

Edit [src/App.tsx](src/App.tsx). The current layout keeps:

- A4 print styling through `@media print`.
- A compact LaTeX-style resume layout.
- Font picker with persisted browser choice.
- Preview-only fit scaling for browser review. PDF export resets zoom and uses print CSS at 100%.

### Change the photo

Replace [public/avatar.jpg](public/avatar.jpg) with another image using the same filename. Square crops work best.

---

## Troubleshooting

**`npm run export:pdf` says Chromium is missing.**

Run:

```bash
npx playwright install chromium
```

**YAML validation fails.**

Read the printed path, fix `resume.yaml`, and rerun `npm run generate:resume`.

**The generated PDF spills to another page.**

Shorten summary or bullet text in `resume.yaml`, then rerun `npm run export:pdf`. The print CSS is tuned for a one-page A4 resume at 100% scale.

**The browser print dialog adds date or URL.**

That is browser chrome, not CSS. Uncheck **Headers and footers** when manually printing.

---

## Stack

- React 19
- TypeScript 6
- Vite 8
- YAML parser: `yaml`
- Validation: `zod`
- Script runner: `tsx`
- PDF export: Playwright Chromium

No Go CLI is used in v1.
