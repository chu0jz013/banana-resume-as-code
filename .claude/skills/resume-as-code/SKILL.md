---
name: resume-as-code
description: Project guide for maintaining this YAML-driven React/TypeScript resume app and its A4 PDF export workflow.
---

# Resume as Code

Use this skill when working on this repository, especially for resume content, schema, React layout, browser YAML editing, or PDF export changes.

## Project Shape

- `resume.yaml` is the source of truth for resume content.
- `src/resumeTypes.ts` defines the TypeScript data model.
- `src/resumeSchema.ts` validates YAML with Zod and parses it for both browser and Node usage.
- `src/resume.generated.ts` is generated fallback data. Do not edit it manually.
- `scripts/generate-resume.ts` reads `resume.yaml`, validates it, and regenerates `src/resume.generated.ts`.
- `src/App.tsx` renders the resume, YAML editor, font picker, preview fit controls, and manual print flow.
- `scripts/export-pdf.ts` uses Vite preview plus Playwright Chromium to export `dist/resume.pdf`.
- `public/resume.pdf` is historical/reference input; generated output lives at `dist/resume.pdf`.
- `public/avatar.jpg` and `public/favicon.svg` are app assets.

## Editing Rules

- For resume content, edit `resume.yaml`, then run `npm run generate:resume`.
- For YAML shape changes, update `src/resumeTypes.ts`, `src/resumeSchema.ts`, `resume.yaml`, and the renderer in `src/App.tsx`.
- Never manually edit `src/resume.generated.ts`; regenerate it instead.
- Rich text is structured spans: `{ text, marks?: ["bold" | "code"], href? }`.
- Company links belong on experience entries via `companyUrl`.
- The browser YAML editor stores drafts in `localStorage`; it does not write back to repo files.
- Keep the PDF as a single A4 page unless the user explicitly asks for multiple pages.
- Editor/tooling UI must be hidden from print/PDF output.

## Workflow

1. Content-only change: update `resume.yaml`, run `npm run generate:resume`, then verify the preview/export if layout density changed.
2. Schema change: update types, Zod schema, YAML, renderer, and generator behavior if needed.
3. Layout or print change: inspect print CSS in `src/App.tsx`, then export and verify the PDF.
4. Asset/title change: update `public/*` assets or `index.html`.

## Commands

- `npm run generate:resume` validates YAML and regenerates typed data.
- `npm run lint` checks the app.
- `npm run build` validates generation, TypeScript, and Vite build.
- `npm run export:pdf` builds and writes `dist/resume.pdf`.
- `npx playwright install chromium` installs the browser needed by PDF export when missing.

## Verification

- After YAML/schema/layout changes, run at least `npm run generate:resume`, `npm run lint`, and `npm run build`.
- After print/PDF-sensitive changes, run `npm run export:pdf` and confirm `dist/resume.pdf` exists, is non-empty, and remains one A4 page.
