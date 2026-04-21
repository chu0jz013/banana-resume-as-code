---
name: resume-as-code
description: Use when editing this repo's YAML-driven React/TypeScript resume, validation schema, browser YAML editor, or Playwright A4 PDF export.
---

# Resume as Code

Use this skill for changes in this repository that affect resume data, schema validation, rendering, print layout, or PDF generation.

## Project Shape

- Source of truth: `resume.yaml`.
- Data types: `src/resumeTypes.ts`.
- Shared parser/validator: `src/resumeSchema.ts`.
- Generated fallback data: `src/resume.generated.ts`.
- Frontend app and resume renderer: `src/App.tsx`.
- YAML generation script: `scripts/generate-resume.ts`.
- Automated PDF export: `scripts/export-pdf.ts`.
- Historical seed PDF: `public/resume.pdf`.
- Generated PDF output: `dist/resume.pdf`.
- App assets: `public/avatar.jpg`, `public/favicon.svg`.

## Hard Rules

- Do not manually edit `src/resume.generated.ts`; run `npm run generate:resume`.
- Content changes belong in `resume.yaml`.
- YAML schema changes must update `src/resumeTypes.ts`, `src/resumeSchema.ts`, sample YAML, and React rendering together.
- Structured rich text uses spans: `{ text, marks?: ["bold" | "code"], href? }`.
- Browser editor changes are local only through `localStorage`; they do not persist to `resume.yaml`.
- Keep print/export output to one A4 page unless requested otherwise.
- Hide editor and toolbar UI in print CSS.

## Common Tasks

- Update CV content: edit `resume.yaml`, regenerate, then inspect preview.
- Add a new resume field: update type, Zod schema, YAML, generated data, and JSX.
- Fix print/PDF layout: adjust print styles in `src/App.tsx` and verify `dist/resume.pdf`.
- Update company links: use `companyUrl` on experience entries.
- Update browser tab title or favicon: edit `index.html` or `public/favicon.svg`.

## Commands

- `npm run generate:resume`
- `npm run lint`
- `npm run build`
- `npm run export:pdf`
- `npx playwright install chromium`

## Validation Checklist

- Run `npm run generate:resume` after changing `resume.yaml` or schema.
- Run `npm run lint` and `npm run build` before handing off code changes.
- Run `npm run export:pdf` after layout, density, print CSS, or major content changes.
- Confirm `dist/resume.pdf` exists, is non-empty, and is one A4 page.
