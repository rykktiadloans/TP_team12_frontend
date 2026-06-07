import * as React from 'react'

type MarkdownMessageProps = {
  content: string
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

function isHeading(line: string) {
  return /^(#{1,4})\s+(.+)$/.test(line)
}

function parseHeading(line: string) {
  const match = line.match(/^(#{1,4})\s+(.+)$/)
  if (!match) return null

  return {
    level: match[1].length,
    text: match[2].trim(),
  }
}

function isUnorderedListItem(line: string) {
  return /^\s*[-*]\s+/.test(line)
}

function isOrderedListItem(line: string) {
  return /^\s*\d+\.\s+/.test(line)
}

function parseListText(line: string) {
  return line.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim()
}

function isTableRow(line: string) {
  return /^\s*\|.*\|\s*$/.test(line)
}

function isTableSeparator(line: string) {
  const cells = parseTableRow(line)
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function startsBlock(line: string, nextLine?: string) {
  return (
    isHeading(line) ||
    isUnorderedListItem(line) ||
    isOrderedListItem(line) ||
    (isTableRow(line) && nextLine != null && isTableSeparator(nextLine))
  )
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = parseHeading(line)
    if (heading) {
      blocks.push({ type: 'heading', ...heading })
      index += 1
      continue
    }

    if (isTableRow(line) && isTableSeparator(lines[index + 1] ?? '')) {
      const headers = parseTableRow(line)
      const rows: string[][] = []
      index += 2

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(parseTableRow(lines[index]))
        index += 1
      }

      blocks.push({ type: 'table', headers, rows })
      continue
    }

    if (isUnorderedListItem(line) || isOrderedListItem(line)) {
      const ordered = isOrderedListItem(line)
      const items: string[] = []

      while (
        index < lines.length &&
        (ordered ? isOrderedListItem(lines[index]) : isUnorderedListItem(lines[index]))
      ) {
        items.push(parseListText(lines[index]))
        index += 1
      }

      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraphLines = [line.trim()]
    index += 1

    while (
      index < lines.length &&
      lines[index].trim() &&
      !startsBlock(lines[index], lines[index + 1])
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded-sm bg-muted px-1 py-0.5 text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      )
    }

    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const blocks = React.useMemo(() => parseBlocks(content), [content])

  return (
    <div className="grid gap-2 text-xs leading-5">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const className =
            block.level <= 2
              ? 'text-sm font-semibold'
              : 'text-xs font-semibold uppercase text-muted-foreground'

          return (
            <div key={index} className={className}>
              {renderInline(block.text)}
            </div>
          )
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              key={index}
              className={block.ordered ? 'ml-4 list-decimal space-y-1' : 'ml-4 list-disc space-y-1'}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ListTag>
          )
        }

        if (block.type === 'table') {
          return (
            <div key={index} className="overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-muted/60">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={headerIndex} className="border-b px-2 py-1.5 font-semibold">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t first:border-t-0">
                      {block.headers.map((_, cellIndex) => (
                        <td key={cellIndex} className="align-top px-2 py-1.5">
                          {renderInline(row[cellIndex] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <p key={index}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}
