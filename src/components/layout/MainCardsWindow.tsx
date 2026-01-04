import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Status = "ok" | "warn" | "err"

type Node = {
  id: string
  title: string
  desc?: string
  status?: Status
  // "kinda grid but not really" positions (px) in a big canvas
  x: number
  y: number
  w?: number
}

type Edge = {
  id: string
  from: string
  to: string
  label?: string
}

const NODES: Node[] = [
  { id: "ecu", title: "ECU", desc: "Engine control unit", status: "ok", x: 120, y: 120, w: 280 },
  { id: "clm", title: "Central Locking Module", desc: "Body control", status: "warn", x: 520, y: 220, w: 320 },
  { id: "door", title: "Door", desc: "Actuator + sensor", status: "ok", x: 930, y: 320, w: 240 },

  { id: "airbag", title: "Airbag Control Module", desc: "SRS controller", status: "err", x: 260, y: 420, w: 320 },
  { id: "dash", title: "Instrument Cluster", desc: "CAN display", status: "ok", x: 720, y: 520, w: 300 },

  // a couple extra placeholders to show “not-perfect grid”
  { id: "gateway", title: "CAN Gateway", desc: "Routing", status: "ok", x: 420, y: 640, w: 260 },
  { id: "abs", title: "ABS Module", desc: "Braking", status: "warn", x: 1040, y: 560, w: 260 },
]

const EDGES: Edge[] = [
  { id: "e1", from: "ecu", to: "clm", label: "CAN High / Low" },
  { id: "e2", from: "clm", to: "door", label: "Lock command" },
  { id: "e3", from: "ecu", to: "airbag", label: "Crash status" },
  { id: "e4", from: "clm", to: "dash", label: "Vehicle state" },
  { id: "e5", from: "ecu", to: "gateway", label: "Powertrain CAN" },
  { id: "e6", from: "gateway", to: "abs", label: "Chassis CAN" },
  { id: "e7", from: "gateway", to: "dash", label: "Diag / status" },
]

function statusBadge(status?: Status) {
  if (!status) return null
  if (status === "ok") return <Badge variant="secondary">OK</Badge>
  if (status === "warn") return <Badge variant="outline">Warning</Badge>
  return <Badge variant="destructive">Error</Badge>
}

function getNode(nodes: Node[], id: string) {
  const n = nodes.find((x) => x.id === id)
  if (!n) throw new Error(`Node not found: ${id}`)
  return n
}

// Card sizing assumptions for line anchor points.
// (Keep it simple for prototype; you can measure DOM later if you want.)
function nodeDims(n: Node) {
  const w = n.w ?? 280
  const h = 150
  return { w, h }
}

function edgePoints(a: Node, b: Node) {
  const ad = nodeDims(a)
  const bd = nodeDims(b)

  const ax = a.x + ad.w / 2
  const ay = a.y + ad.h / 2
  const bx = b.x + bd.w / 2
  const by = b.y + bd.h / 2

  // Simple heuristic: connect from the side that faces the other node
  const dx = bx - ax
  const dy = by - ay

  const fromX = ax + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) * (ad.w / 2) : 0)
  const fromY = ay + (Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) * (ad.h / 2) : 0)

  const toX = bx - (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) * (bd.w / 2) : 0)
  const toY = by - (Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) * (bd.h / 2) : 0)

  return { fromX, fromY, toX, toY }
}

export function MainCardsWindow() {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)

  // Big “canvas” so you can place nodes loosely and scroll around
  const CANVAS_W = 1400
  const CANVAS_H = 900

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="font-medium">Main</div>
        <div className="text-xs text-muted-foreground">Connections view</div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" type="button">
            Refresh
          </Button>
          <Button size="sm" type="button">
            New
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="relative rounded-lg border bg-muted/20 overflow-auto">
            {/* inner canvas */}
            <div
              className="relative"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                // gives a subtle “workspace” feel
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.18) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            >
              {/* SVG overlay for edges */}
              <svg
                width={CANVAS_W}
                height={CANVAS_H}
                className="absolute inset-0 pointer-events-none"
              >
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                  </marker>
                </defs>

                {EDGES.map((e) => {
                  const a = getNode(NODES, e.from)
                  const b = getNode(NODES, e.to)
                  const { fromX, fromY, toX, toY } = edgePoints(a, b)

                  const midX = (fromX + toX) / 2
                  const midY = (fromY + toY) / 2

                  // Slight curve so overlapping lines look a bit nicer
                  const bend = 0.18
                  const cx1 = fromX + (toX - fromX) * bend
                  const cy1 = fromY + (toY - fromY) * 0.0
                  const cx2 = fromX + (toX - fromX) * (1 - bend)
                  const cy2 = fromY + (toY - fromY) * 1.0

                  return (
                    <g key={e.id} className="text-muted-foreground">
                      <path
                        d={`M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        markerEnd="url(#arrow)"
                        opacity={0.9}
                      />
                      {e.label ? (
                        <>
                          {/* label background */}
                          <rect
                            x={midX - 70}
                            y={midY - 14}
                            width={140}
                            height={22}
                            rx={10}
                            className="fill-background/90"
                          />
                          <text
                            x={midX}
                            y={midY + 2}
                            textAnchor="middle"
                            fontSize="12"
                            className="fill-foreground"
                          >
                            {e.label}
                          </text>
                        </>
                      ) : null}
                    </g>
                  )
                })}
              </svg>

              {/* Nodes */}
              {NODES.map((n) => {
                const dims = nodeDims(n)
                const isSelected = selectedNode === n.id

                return (
                  <div
                    key={n.id}
                    className="absolute"
                    style={{ left: n.x, top: n.y, width: dims.w }}
                  >
                    <Card
                      className={`cursor-pointer transition shadow-sm ${
                        isSelected ? "ring-2 ring-ring" : ""
                      }`}
                      onClick={() => setSelectedNode(n.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{n.title}</CardTitle>
                          <div className="ml-auto">{statusBadge(n.status)}</div>
                        </div>
                        {n.desc ? (
                          <CardDescription className="line-clamp-2">{n.desc}</CardDescription>
                        ) : null}
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Placeholder A</span>
                          <span>{Math.floor(Math.random() * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Placeholder B</span>
                          <span>{Math.floor(Math.random() * 500)} ms</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Prototype notes: node positions are hardcoded in <code>NODES</code> and connections in{" "}
            <code>EDGES</code>. Next step is making nodes draggable + auto-layout if you want.
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
