import { useEffect, useState } from 'react'
import defaultResumeYaml from '../resume.yaml?raw'
import { resume as generatedResume } from './resume.generated'
import { parseResumeYaml, ResumeYamlError } from './resumeSchema'
import type { ResumeData } from './resumeTypes'
import { DEFAULT_TEMPLATE_ID, TEMPLATES, findTemplate } from './templates'
import { PRINT_MEASURE_CLASS } from './templates/shared'
import './App.css'

type FontOption = {
  id: string
  label: string
  family: string
  note: string
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    note: 'Modern - neutral sans - SaaS-standard',
  },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Sans',
    family: '"IBM Plex Sans", "Segoe UI", Roboto, sans-serif',
    note: 'Technical character - DevOps-friendly',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    family: '"Manrope", "Inter", -apple-system, sans-serif',
    note: 'Geometric - friendly - product-design vibe',
  },
  {
    id: 'source-serif',
    label: 'Source Serif 4',
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    note: 'Modern serif - bookish but clean',
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    family: '"EB Garamond", Cambria, Georgia, serif',
    note: 'Classic - LaTeX / academic feel',
  },
]

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=IBM+Plex+Sans:wght@400;500;600;700' +
  '&family=Manrope:wght@400;500;600;700' +
  '&family=Source+Serif+4:wght@400;600;700' +
  '&family=EB+Garamond:wght@400;600;700' +
  '&family=JetBrains+Mono:wght@400;500;700;800' +
  '&display=swap'

const FONT_STORAGE_KEY = 'resume-font-id'
const TEMPLATE_STORAGE_KEY = 'resume-template-id'
const YAML_STORAGE_KEY = 'resume-yaml-draft'

const A4_PAGE_HEIGHT_PX = 1123
const MIN_FIT_SCALE = 0.72
const RESUME_SELECTOR = '.resume'

type YamlStatus =
  | { kind: 'idle'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string; issues: string[] }

declare global {
  interface Window {
    resumeAsCode?: {
      fitToOnePage: () => number
      resetZoom: () => void
    }
  }
}

function useGoogleFonts() {
  useEffect(() => {
    const id = 'google-fonts-resume'
    if (document.getElementById(id)) return
    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)
    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect2)
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

function fitResumeToOnePage(): number {
  const resumeElement = document.querySelector(RESUME_SELECTOR) as HTMLElement | null
  if (!resumeElement) return 1
  resumeElement.style.zoom = '1'
  const measured = measurePrintResumeHeight(resumeElement)
  if (measured <= A4_PAGE_HEIGHT_PX) {
    resumeElement.style.zoom = '1'
    return 1
  }
  const scale = Math.max(MIN_FIT_SCALE, A4_PAGE_HEIGHT_PX / measured)
  resumeElement.style.zoom = String(scale)
  return scale
}

function measurePrintResumeHeight(resumeElement: HTMLElement) {
  const clone = resumeElement.cloneNode(true) as HTMLElement
  clone.classList.add(PRINT_MEASURE_CLASS)
  clone.style.zoom = '1'
  document.body.appendChild(clone)
  const measured = Math.ceil(clone.getBoundingClientRect().height)
  clone.remove()
  return measured
}

function resetResumeZoom() {
  const resumeElement = document.querySelector(RESUME_SELECTOR) as HTMLElement | null
  if (resumeElement) resumeElement.style.zoom = ''
}

function readStoredYaml() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(YAML_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredYaml(yamlText: string) {
  try {
    window.localStorage.setItem(YAML_STORAGE_KEY, yamlText)
  } catch {
    /* ignore */
  }
}

function clearStoredYaml() {
  try {
    window.localStorage.removeItem(YAML_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function createInitialYamlStatus(): YamlStatus {
  return readStoredYaml()
    ? { kind: 'idle', message: 'Draft loaded. Click Apply YAML to render.' }
    : { kind: 'idle', message: 'Loaded from resume.yaml.' }
}

function App() {
  useGoogleFonts()

  const [fontId, setFontId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'inter'
    return window.localStorage.getItem(FONT_STORAGE_KEY) || 'inter'
  })

  const [templateId, setTemplateId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATE_ID
    return window.localStorage.getItem(TEMPLATE_STORAGE_KEY) || DEFAULT_TEMPLATE_ID
  })

  const [draftYaml, setDraftYaml] = useState<string>(() => readStoredYaml() ?? defaultResumeYaml)
  const [activeResume, setActiveResume] = useState<ResumeData>(generatedResume)
  const [yamlStatus, setYamlStatus] = useState<YamlStatus>(() => createInitialYamlStatus())
  const [fitInfo, setFitInfo] = useState<{ scale: number; manual: boolean } | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, fontId)
    } catch {
      /* ignore */
    }
  }, [fontId])

  useEffect(() => {
    try {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, templateId)
    } catch {
      /* ignore */
    }
  }, [templateId])

  useEffect(() => {
    function onBeforePrint() {
      resetResumeZoom()
      setFitInfo({ scale: 1, manual: false })
    }
    function onAfterPrint() {
      resetResumeZoom()
    }
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [])

  useEffect(() => {
    window.resumeAsCode = {
      fitToOnePage: fitResumeToOnePage,
      resetZoom: resetResumeZoom,
    }

    return () => {
      delete window.resumeAsCode
    }
  }, [])

  function handlePrint() {
    resetResumeZoom()
    requestAnimationFrame(() => window.print())
  }

  function handlePreviewFit() {
    const scale = fitResumeToOnePage()
    setFitInfo({ scale, manual: true })
  }

  function handleReset() {
    resetResumeZoom()
    setFitInfo(null)
  }

  function handleDraftYamlChange(nextYaml: string) {
    setDraftYaml(nextYaml)
    writeStoredYaml(nextYaml)
    setYamlStatus({ kind: 'idle', message: 'Draft changed. Click Apply YAML to render.' })
  }

  function handleApplyYaml() {
    try {
      const parsedResume = parseResumeYaml(draftYaml)
      setActiveResume(parsedResume)
      writeStoredYaml(draftYaml)
      resetResumeZoom()
      setFitInfo(null)
      setYamlStatus({ kind: 'success', message: 'YAML applied to preview.' })
    } catch (error) {
      if (error instanceof ResumeYamlError) {
        setYamlStatus({
          kind: 'error',
          message: error.message,
          issues: error.issues,
        })
        return
      }

      setYamlStatus({
        kind: 'error',
        message: 'Could not parse YAML.',
        issues: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  function handleResetYaml() {
    setDraftYaml(defaultResumeYaml)
    setActiveResume(generatedResume)
    clearStoredYaml()
    resetResumeZoom()
    setFitInfo(null)
    setYamlStatus({ kind: 'idle', message: 'Reset to resume.yaml.' })
  }

  const activeFont = FONT_OPTIONS.find((font) => font.id === fontId) ?? FONT_OPTIONS[0]
  const activeTemplate = findTemplate(templateId)
  const TemplateComponent = activeTemplate.Component

  return (
    <div className="resume-root">
      <style>{shellCss}</style>

      <div className="toolbar">
        <div className="toolbar-inner">
          <span className="toolbar-title">resume.yaml</span>
          <div className="toolbar-actions">
            <label className="font-picker">
              <span className="font-picker-label">Template</span>
              <select
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value)
                  resetResumeZoom()
                  setFitInfo(null)
                }}
                aria-label="Resume template"
              >
                {TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label} - {template.description}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-picker">
              <span className="font-picker-label">Font</span>
              <select
                value={fontId}
                onChange={(event) => setFontId(event.target.value)}
                aria-label="Resume font"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label} - {font.note}
                  </option>
                ))}
              </select>
            </label>
            {fitInfo && (
              <span className="fit-badge" title="Current scale applied to fit 1 page">
                {fitInfo.manual ? 'Preview' : 'Auto-fit'}: {Math.round(fitInfo.scale * 100)}%
                <button
                  type="button"
                  className="fit-reset"
                  onClick={handleReset}
                  aria-label="Reset zoom"
                >
                  x
                </button>
              </span>
            )}
            <button className="ghost-btn" onClick={handlePreviewFit} type="button">
              Preview fit
            </button>
            <span className="print-hint">
              Tip: uncheck "Headers and footers" in print dialog for a clean PDF.
            </span>
            <button className="print-btn" onClick={handlePrint} type="button">
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="resume-workbench">
        <aside className="yaml-panel" aria-label="YAML editor">
          <div className="yaml-panel-head">
            <span className="yaml-panel-title">YAML</span>
            <div className="yaml-panel-actions">
              <button className="ghost-btn" type="button" onClick={handleResetYaml}>
                Reset
              </button>
              <button className="print-btn" type="button" onClick={handleApplyYaml}>
                Apply YAML
              </button>
            </div>
          </div>
          <textarea
            className="yaml-editor"
            value={draftYaml}
            onChange={(event) => handleDraftYamlChange(event.target.value)}
            spellCheck={false}
            aria-label="Resume YAML"
          />
          <div className={`yaml-status ${yamlStatus.kind}`}>
            <span>{yamlStatus.message}</span>
            {yamlStatus.kind === 'error' && (
              <ul>
                {yamlStatus.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="resume-stage">
          <TemplateComponent data={activeResume} fontFamily={activeFont.family} />
        </div>
      </div>
    </div>
  )
}

const shellCss = `
  :root { color-scheme: light; }
  body:has(.resume-root) {
    margin: 0;
    background: #e5e7eb;
    color: #111827;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-feature-settings: "liga", "kern";
    -webkit-font-smoothing: antialiased;
  }
  .resume {
    font-family: var(--resume-font, "Inter", -apple-system, "Segoe UI", sans-serif);
  }
  #root:has(.resume-root) {
    width: 100%;
    max-width: none;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    border: 0;
    display: block;
    box-sizing: border-box;
    text-align: left;
  }
  .resume-root { width: 100%; min-height: 100vh; }

  .toolbar {
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,255,255,0.9);
    backdrop-filter: saturate(1.2) blur(6px);
    border-bottom: 1px solid #d1d5db;
    font-family: -apple-system, "Segoe UI", Inter, sans-serif;
  }
  .toolbar-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 10px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .toolbar-title {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px; color: #6b7280;
  }
  .toolbar-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
  .font-picker {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: #374151;
  }
  .font-picker-label {
    font-weight: 600; color: #6b7280; text-transform: uppercase;
    letter-spacing: 0.06em; font-size: 10.5px;
  }
  .font-picker select {
    font: inherit; font-size: 12.5px;
    padding: 5px 8px;
    border: 1px solid #d1d5db; border-radius: 6px;
    background: #fff; color: #111827;
    cursor: pointer;
    min-width: 200px;
  }
  .font-picker select:hover { border-color: #9ca3af; }
  .font-picker select:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 1px; }
  .print-hint {
    font-size: 11.5px; color: #6b7280; font-style: italic;
    max-width: 320px; text-align: right; line-height: 1.3;
  }
  .print-btn {
    background: #111827; color: #fff; border: none;
    padding: 8px 14px; border-radius: 6px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    white-space: nowrap;
  }
  .print-btn:hover { background: #1d4ed8; }
  .ghost-btn {
    background: #fff; color: #111827; border: 1px solid #d1d5db;
    padding: 7px 12px; border-radius: 6px;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    white-space: nowrap;
  }
  .ghost-btn:hover { border-color: #9ca3af; background: #f9fafb; }
  .fit-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 4px 4px 10px;
    background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
    border-radius: 999px;
    font-size: 11.5px; font-weight: 600;
    white-space: nowrap;
  }
  .fit-reset {
    background: transparent; border: none; color: #065f46;
    cursor: pointer; font-size: 14px; line-height: 1;
    padding: 0 6px; border-radius: 999px;
  }
  .fit-reset:hover { background: #d1fae5; }

  .resume-workbench {
    width: 100%;
    margin: 24px 0 48px;
    padding: 0 28px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(360px, 560px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .yaml-panel {
    position: sticky;
    top: 68px;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
    padding: 14px;
    min-width: 0;
  }
  .yaml-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .yaml-panel-title {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .yaml-panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .yaml-editor {
    width: 100%;
    min-height: 64vh;
    resize: vertical;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 12px;
    background: #f9fafb;
    color: #111827;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.45;
    tab-size: 2;
  }
  .yaml-editor:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 1px;
    background: #fff;
  }
  .yaml-status {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #4b5563;
  }
  .yaml-status.success { color: #065f46; }
  .yaml-status.error { color: #991b1b; }
  .yaml-status ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
  .yaml-status li { margin: 2px 0; }
  .resume-stage {
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  .resume-stage .resume {
    margin: 0;
  }

  @media (max-width: 1100px) {
    .resume-workbench {
      width: min(100% - 28px, 820px);
      display: block;
      margin: 14px auto 32px;
    }
    .yaml-panel { position: static; margin-bottom: 14px; }
    .yaml-editor { min-height: 360px; }
  }

  @media (max-width: 680px) {
    .resume-workbench { width: 100%; margin: 14px 0 32px; }
    .yaml-panel { margin: 0 14px 14px; }
    .yaml-panel-head { align-items: flex-start; flex-direction: column; }
    .yaml-panel-actions { justify-content: flex-start; }
    .yaml-editor { min-height: 320px; }
  }

  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body, #root {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      overflow: hidden !important;
    }
    #root:has(.resume-root) {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    .resume-root {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      background: #fff;
      overflow: hidden;
    }
    .resume-workbench {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      display: block;
      overflow: hidden;
    }
    .resume-stage {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      display: block;
      overflow: hidden;
    }
    .toolbar, .yaml-panel, .print-hint, .fit-badge, .ghost-btn { display: none !important; }
  }
`

export default App
