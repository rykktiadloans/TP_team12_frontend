import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type LogLine = { id: string; ts: string; text: string }

function nowTs() {
  const d = new Date()
  return d.toLocaleTimeString()
}

export function ConsoleWindow() {
  const [logs, setLogs] = React.useState<LogLine[]>([
    { id: "l1", ts: nowTs(), text: "Console initialized." },
    { id: "l2", ts: nowTs(), text: "Type a command and press Send." },
  ])
  const [cmd, setCmd] = React.useState("")
  const endRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.length])

  function send() {
    const t = cmd.trim()
    if (!t) return
    setLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ts: nowTs(), text: `> ${t}` },
      { id: crypto.randomUUID(), ts: nowTs(), text: `Echo: ${t}` },
    ])
    setCmd("")
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 py-2 border-b text-sm font-medium">Console</div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <pre className="text-xs leading-5 whitespace-pre-wrap">
            {logs.map((l) => (
              <div key={l.id}>
                <span className="text-muted-foreground">[{l.ts}] </span>
                <span>{l.text}</span>
              </div>
            ))}
          </pre>
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3 flex gap-2">
        <Input
          placeholder="Enter command…"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send()
          }}
        />
        <Button type="button" onClick={send}>
          Send
        </Button>
      </div>
    </div>
  )
}
