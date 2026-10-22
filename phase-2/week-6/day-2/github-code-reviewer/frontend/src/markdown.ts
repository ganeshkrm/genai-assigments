// Minimal, dependency-free Markdown -> HTML renderer for the review output.
// Input is escaped first so the LLM output cannot inject HTML. Only a small,
// known subset of Markdown is converted. Good enough for the review sections
// the workflow produces (headings, lists, bold, inline code, code fences).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s: string): string {
  // inline code
  s = s.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`)
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // italic (single asterisk not adjacent to another)
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  // severity tags -> coloured pills
  s = s.replace(/\b(High|Critical)\b/g, '<span class="sev sev-high">$1</span>')
  s = s.replace(/\b(Medium)\b/g, '<span class="sev sev-medium">$1</span>')
  s = s.replace(/\b(Low|Minor)\b/g, '<span class="sev sev-low">$1</span>')
  return s
}

export function renderMarkdown(md: string): string {
  const src = escapeHtml(md.replace(/\r\n/g, '\n'))
  const lines = src.split('\n')
  const out: string[] = []
  let i = 0
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      closeList()
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`)
      continue
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      closeList()
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`)
      i++
      continue
    }

    // table: a header row of pipes followed by a separator row like |---|---|
    if (
      /\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      closeList()
      const splitRow = (row: string): string[] => {
        let r = row.trim()
        if (r.startsWith('|')) r = r.slice(1)
        if (r.endsWith('|')) r = r.slice(0, -1)
        return r.split('|').map((c) => c.trim())
      }
      const headers = splitRow(line)
      i += 2 // skip header and separator
      const bodyRows: string[][] = []
      while (i < lines.length && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) {
        bodyRows.push(splitRow(lines[i]))
        i++
      }
      const thead =
        '<thead><tr>' + headers.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead>'
      const tbody =
        '<tbody>' +
        bodyRows
          .map(
            (r) =>
              '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>'
          )
          .join('') +
        '</tbody>'
      out.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`)
      continue
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList()
      out.push('<hr />')
      i++
      continue
    }

    // unordered list
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        out.push('<ul>')
        listType = 'ul'
      }
      out.push(`<li>${inline(ul[1].trim())}</li>`)
      i++
      continue
    }

    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        out.push('<ol>')
        listType = 'ol'
      }
      out.push(`<li>${inline(ol[1].trim())}</li>`)
      i++
      continue
    }

    // blank line
    if (/^\s*$/.test(line)) {
      closeList()
      i++
      continue
    }

    // paragraph (gather consecutive non-structural lines)
    closeList()
    const para: string[] = [line]
    i++
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }

  closeList()
  return out.join('\n')
}
