import { useEffect, useRef, useState } from 'react'
import { reviewCode } from './api'
import { ReviewResponse } from './types'
import { renderMarkdown } from './markdown'

const EXAMPLE_URL =
  'https://github.com/testleaftrainings/Sel_May_2026/blob/main/Week5/Day2/LearnDragAndDrop.java'

const GITHUB_URL_RE =
  /^https?:\/\/(github\.com|raw\.githubusercontent\.com)\/[^\s]+$/i

function App() {
  const [repoUrl, setRepoUrl] = useState<string>('')
  const [result, setResult] = useState<ReviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (noticeTimeout.current) clearTimeout(noticeTimeout.current)
    }
  }, [])

  const flashNotice = (message: string) => {
    setNoticeMessage(message)
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current)
    noticeTimeout.current = setTimeout(() => {
      setNoticeMessage(null)
      noticeTimeout.current = null
    }, 4000)
  }

  const handleReset = () => {
    setRepoUrl('')
    setResult(null)
    setError(null)
    setValidationError(null)
    setCopied(false)
    flashNotice('Cleared')
  }

  const handleUseExample = () => {
    setRepoUrl(EXAMPLE_URL)
    setValidationError(null)
    setError(null)
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.review)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      flashNotice('Copy is not available in this browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = repoUrl.trim()

    if (!trimmed) {
      setValidationError('Please enter a GitHub file URL to review.')
      return
    }
    if (!GITHUB_URL_RE.test(trimmed)) {
      setValidationError(
        'That does not look like a GitHub file URL. Use a github.com/.../blob/... or raw.githubusercontent.com link.'
      )
      return
    }

    setValidationError(null)
    setError(null)
    setResult(null)
    setIsLoading(true)

    try {
      const response = await reviewCode({ repoUrl: trimmed })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review the file.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString()
  }

  return (
    <div>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f5f3f8;
          --surface: #ffffff;
          --border: #e6e1ee;
          --text: #221433;
          --muted: #6d6480;
          --brand: #5a287d;
          --brand-dark: #3c1053;
          --brand-darker: #2a0b3d;
          --brand-accent: #8e44c7;
          --brand-soft: #f1e9f8;
          --ok: #1f8a4c;
          --ok-soft: #e6f6ec;
          --warn: #b3261e;
          --warn-soft: #fdeceb;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          color: var(--text);
          line-height: 1.6;
          min-height: 100vh;
          background:
            radial-gradient(900px 500px at 8% -8%, rgba(90,40,125,0.16), transparent 55%),
            radial-gradient(700px 400px at 100% 0%, rgba(142,68,199,0.10), transparent 50%),
            var(--bg);
          background-attachment: fixed;
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatGlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---------- App header (professional, branded) ---------- */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: linear-gradient(120deg, var(--brand-dark), var(--brand));
          color: #fff;
          box-shadow: 0 6px 24px rgba(42,11,61,0.28);
        }
        .app-header-inner {
          max-width: 1500px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand-lockup { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .brand-mark {
          width: 40px; height: 40px;
          border-radius: 11px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .brand-text { display: flex; flex-direction: column; min-width: 0; }
        .brand-name { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.1; }
        .brand-team { font-size: 12px; color: rgba(255,255,255,0.78); font-weight: 500; }
        .header-tag {
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          padding: 6px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }
        @media (max-width: 640px) { .header-tag { display: none; } }

        .container {
          max-width: 1500px;
          width: 100%;
          margin: 0 auto;
          padding: 28px 24px 8px;
        }
        @media (min-width: 768px) { .container { padding: 40px 36px 8px; } }

        .hero { text-align: center; margin-bottom: 34px; animation: fadeUp 0.6s ease both; }
        .badge-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: var(--brand-soft);
          border: 1px solid rgba(142,68,199,0.35);
          color: var(--brand-darker);
          font-size: 13px; font-weight: 600; margin-bottom: 16px;
        }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--brand-accent);
          box-shadow: 0 0 12px var(--brand-accent);
          animation: floatGlow 2.4s ease-in-out infinite;
        }
        .title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-bottom: 12px;
        }
        .title .accent { color: var(--brand); }
        .subtitle { color: var(--muted); font-size: 1.05rem; max-width: 600px; margin: 0 auto; }

        .workspace { display: grid; grid-template-columns: 1fr; gap: 26px; align-items: start; }
        @media (min-width: 1024px) { .workspace { grid-template-columns: minmax(400px, 460px) 1fr; } }

        .toolbar {
          grid-column: 1 / -1;
          display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center;
          gap: 12px; margin-bottom: 4px; min-height: 20px;
        }
        .notice { color: var(--brand-darker); font-size: 13px; font-weight: 600; }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(34,20,51,0.06);
          animation: fadeUp 0.6s ease 0.08s both;
        }
        @media (min-width: 1024px) { .form-card { position: sticky; top: 92px; } }

        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-weight: 600; margin-bottom: 8px; color: var(--text); font-size: 14px; }
        .form-label .req { color: var(--brand); margin-left: 3px; }

        .form-input {
          width: 100%; padding: 12px 14px;
          border: 1px solid var(--border); border-radius: 11px;
          font-size: 14px; color: var(--text); background: #fbfafd;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; font-family: inherit;
        }
        .form-input::placeholder { color: #a79fb6; }
        .form-input:focus {
          outline: none; border-color: var(--brand-accent); background: #fff;
          box-shadow: 0 0 0 4px rgba(142,68,199,0.16);
        }
        .form-input.invalid { border-color: var(--warn); background: #fffafa; }

        .field-hint { font-size: 12.5px; color: var(--muted); margin-top: 7px; }
        .field-validation { font-size: 12.5px; color: var(--warn); margin-top: 7px; font-weight: 600; }
        .link-btn {
          background: none; border: none; color: var(--brand); font-weight: 600;
          font-size: 12.5px; cursor: pointer; padding: 0; text-decoration: underline;
        }

        .btn-row { display: flex; gap: 10px; margin-top: 20px; }
        .submit-btn {
          flex: 1;
          background: linear-gradient(120deg, var(--brand-accent), var(--brand));
          color: #fff; border: none; padding: 13px 24px; border-radius: 12px;
          font-size: 15px; font-weight: 700; letter-spacing: 0.02em; cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.25s ease, filter 0.2s;
          box-shadow: 0 8px 22px rgba(90,40,125,0.32);
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(90,40,125,0.42); filter: brightness(1.04); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { cursor: not-allowed; background: #c9bdd6; box-shadow: none; }

        .reset-btn {
          background: transparent; color: var(--muted);
          border: 1px solid var(--border); padding: 13px 18px; border-radius: 12px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .reset-btn:hover:not(:disabled) { color: var(--brand-darker); border-color: var(--brand-accent); background: var(--brand-soft); }
        .reset-btn:disabled { cursor: not-allowed; opacity: 0.5; }

        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        .output-col { min-width: 0; }

        .error-banner {
          background: var(--warn-soft); border: 1px solid #f5c2be; color: var(--warn);
          padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px; animation: fadeUp 0.3s ease both;
        }

        .placeholder-card {
          background: radial-gradient(400px 200px at 50% 0%, rgba(142,68,199,0.08), transparent 70%), var(--surface);
          border: 1px dashed rgba(142,68,199,0.45); border-radius: 18px;
          padding: 72px 34px; text-align: center; color: var(--muted); min-height: 420px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: fadeUp 0.5s ease both;
        }
        .placeholder-icon {
          width: 76px; height: 76px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center; font-size: 34px;
          background: var(--brand-soft); border: 1px solid rgba(142,68,199,0.35);
          margin-bottom: 20px; animation: floatGlow 3s ease-in-out infinite;
        }
        .placeholder-title { font-size: 1.25rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .placeholder-text { max-width: 380px; font-size: 14.5px; }
        .placeholder-hints { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 22px; }
        .placeholder-hints .meta-chip { background: #f2eef8; }

        .loading {
          background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
          text-align: center; padding: 56px 30px; color: var(--muted); font-size: 16px;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          box-shadow: 0 10px 30px rgba(34,20,51,0.06); min-height: 420px; justify-content: center;
        }
        .loading .big-spinner {
          width: 42px; height: 42px;
          border: 3px solid rgba(142,68,199,0.2); border-top-color: var(--brand);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        .loading-sub { font-size: 13px; color: #9a90ad; }

        .results-container {
          background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
          padding: 28px; box-shadow: 0 10px 30px rgba(34,20,51,0.06); animation: fadeUp 0.5s ease both;
        }
        .results-header { margin-bottom: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
        .results-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .results-title { font-size: 1.4rem; font-weight: 700; color: var(--text); margin-bottom: 12px; }
        .results-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .meta-chip {
          font-size: 12.5px; color: var(--brand-darker); background: var(--brand-soft);
          border: 1px solid rgba(142,68,199,0.3); padding: 5px 12px; border-radius: 999px; font-weight: 600;
        }
        .meta-chip.ok { color: var(--ok); background: var(--ok-soft); border-color: #b7e4c7; }
        .meta-chip a { color: inherit; }

        .copy-btn {
          background: var(--brand-soft); color: var(--brand-darker);
          border: 1px solid rgba(142,68,199,0.35); padding: 8px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
          transition: background 0.2s, border-color 0.2s;
        }
        .copy-btn:hover { background: #e7d8f6; border-color: var(--brand-accent); }

        /* rendered markdown review */
        .review-body { font-size: 14.5px; color: var(--text); overflow-wrap: anywhere; }
        .review-body h1, .review-body h2, .review-body h3, .review-body h4 {
          color: var(--brand-darker); font-weight: 700; line-height: 1.3;
          margin: 22px 0 10px; padding-bottom: 6px;
        }
        .review-body h2 { font-size: 1.15rem; border-bottom: 1px solid var(--border); }
        .review-body h3 { font-size: 1.02rem; }
        .review-body h4 { font-size: 0.95rem; }
        .review-body h1:first-child, .review-body h2:first-child, .review-body h3:first-child { margin-top: 0; }
        .review-body p { margin: 10px 0; }
        .review-body ul, .review-body ol { margin: 10px 0 10px 22px; }
        .review-body li { margin: 6px 0; }
        .review-body code {
          background: #f2eef8; color: var(--brand-darker);
          padding: 2px 6px; border-radius: 6px; font-size: 0.88em;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .review-body pre {
          background: #1e1430; color: #f3eefb; padding: 16px; border-radius: 12px;
          overflow-x: auto; margin: 14px 0; border: 1px solid #2d1f45;
        }
        .review-body pre code { background: none; color: inherit; padding: 0; font-size: 13px; }
        .review-body a { color: var(--brand); }
        .review-body hr { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
        .review-body .table-wrap { overflow-x: auto; margin: 14px 0; border: 1px solid var(--border); border-radius: 12px; }
        .review-body table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .review-body th {
          background: #f6f1fb; color: var(--brand-darker); text-align: left; font-weight: 700;
          padding: 10px 14px; border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .review-body td { padding: 10px 14px; border-bottom: 1px solid #efeaf6; vertical-align: top; }
        .review-body tbody tr:last-child td { border-bottom: none; }
        .review-body tbody tr:hover { background: #faf7fd; }
        .sev { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 0.82em; font-weight: 700; }
        .sev-high { color: #c0392b; background: #fdecea; border: 1px solid #f5c2be; }
        .sev-medium { color: #b8860b; background: #fcf3d9; border: 1px solid #f0dca0; }
        .sev-low { color: #1f8a4c; background: #e6f6ec; border: 1px solid #b7e4c7; }

        /* footer */
        .app-footer {
          max-width: 1500px; margin: 40px auto 0; padding: 22px 24px 30px;
          border-top: 1px solid var(--border); color: var(--muted); font-size: 13px;
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
        }
        .app-footer .foot-brand { font-weight: 700; color: var(--brand-dark); }
      `}</style>

      {/* ---------- Professional header ---------- */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 7.5 4.5 12 9 16.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 7.5 19.5 12 15 16.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="1.6" fill="#fff"/>
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">CodeLens</span>
              <span className="brand-team">Retail Design Studio - UI/UX Engineering</span>
            </span>
          </div>
          <span className="header-tag">AI-assisted GitHub code review</span>
        </div>
      </header>

      <div className="container">
        <div className="hero">
          <span className="badge-pill">
            <span className="badge-dot"></span>
            Automated code review
          </span>
          <h1 className="title">GitHub <span className="accent">Code Reviewer</span></h1>
          <p className="subtitle">
            Paste a GitHub file link and get a structured, senior-level review in seconds -
            findings, risks, and concrete improvements.
          </p>
        </div>

        <div className="workspace">
          <div className="toolbar">
            {noticeMessage && <span className="notice" role="status">{noticeMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} className="card form-card">
            <div className="form-group">
              <label htmlFor="repoUrl" className="form-label">
                GitHub File URL <span className="req">*</span>
              </label>
              <input
                type="text"
                id="repoUrl"
                className={`form-input ${validationError ? 'invalid' : ''}`}
                value={repoUrl}
                onChange={(e) => { setRepoUrl(e.target.value); if (validationError) setValidationError(null) }}
                placeholder="https://github.com/owner/repo/blob/main/path/File.java"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!!validationError}
              />
              {validationError ? (
                <div className="field-validation" role="alert">{validationError}</div>
              ) : (
                <div className="field-hint">
                  Accepts a github.com blob link or a raw.githubusercontent.com link.{' '}
                  <button type="button" className="link-btn" onClick={handleUseExample}>Use example</button>
                </div>
              )}
            </div>

            <div className="btn-row">
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading && <span className="btn-spinner"></span>}
                {isLoading ? 'Reviewing...' : 'Review Code'}
              </button>
              <button type="button" className="reset-btn" onClick={handleReset} disabled={isLoading}>
                Clear
              </button>
            </div>
          </form>

          <div className="output-col">
            {error && (
              <div className="error-banner" role="alert">
                <span aria-hidden="true">⚠️</span>
                {error}
              </div>
            )}

            {isLoading && (
              <div className="loading">
                <span className="big-spinner"></span>
                Reviewing the file...
                <span className="loading-sub">Fetching the source and running the review. This can take a few seconds.</span>
              </div>
            )}

            {!isLoading && !result && !error && (
              <div className="placeholder-card">
                <div className="placeholder-icon" aria-hidden="true">🔍</div>
                <div className="placeholder-title">Your code review will appear here</div>
                <p className="placeholder-text">
                  Paste a GitHub file link on the left and select Review Code. You will get a
                  summary, key findings with severity, risks, and suggested improvements.
                </p>
                <div className="placeholder-hints">
                  <span className="meta-chip">Summary</span>
                  <span className="meta-chip">Findings</span>
                  <span className="meta-chip">Risks</span>
                  <span className="meta-chip">Improvements</span>
                </div>
              </div>
            )}

            {!isLoading && result && (
              <div className="results-container">
                <div className="results-header">
                  <div className="results-top">
                    <h2 className="results-title">Code Review</h2>
                    <button type="button" className="copy-btn" onClick={handleCopy}>
                      {copied ? 'Copied' : 'Copy review'}
                    </button>
                  </div>
                  <div className="results-meta">
                    <span className="meta-chip ok">Review complete</span>
                    {result.fileName && <span className="meta-chip">File: {result.fileName}</span>}
                    {result.reviewedAt && <span className="meta-chip">Reviewed: {formatTimestamp(result.reviewedAt)}</span>}
                    {result.sourceUrl && (
                      <span className="meta-chip">
                        <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">View source</a>
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="review-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(result.review) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <span><span className="foot-brand">CodeLens</span> - Retail Design Studio, UI/UX Engineering</span>
        <span>Internal tooling - for code review assistance only</span>
      </footer>
    </div>
  )
}

export default App
