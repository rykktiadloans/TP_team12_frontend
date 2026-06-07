import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, MessagesSquareIcon, SparklesIcon } from "lucide-react"
import { prepareLangchainProposals } from "@/lib/langchains/mockProposalGenerator"
import { prepareLangchainProposalsFromApi } from "@/lib/langchains/prepareApi"
import { MarkdownMessage } from "@/components/langchains/MarkdownMessage"
import type {
  LangchainAnalysis,
  LangchainChatMessage,
  LangchainGenerationResult,
  LangchainProposal,
} from "@/lib/langchains/types"
import { LangchainProposalDialog } from "@/components/langchains/LangchainProposalDialog"
import { type ModelState, useModelStore } from "@/store/model-store"

type LogLine = {
  id: string
  ts: string
  role: "system" | "user" | "assistant"
  text: string
  analysis?: LangchainAnalysis | null
  proposalCount?: number
  canReview?: boolean
}

function nowTs() {
  const d = new Date()
  return d.toLocaleTimeString()
}

function messageFromError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Assistant request failed."
}

function wantsAnalysis(prompt: string) {
  return /\b(analy[sz]e|audit|inspect|review|summari[sz]e|current state|state)\b/i.test(prompt)
}

function wantsProposals(prompt: string) {
  return /\b(prepare|draft|create|suggest|add|generate|propose|proposal|component|technolog(?:y|ies)|scenario|attack|control)\b/i.test(prompt)
}

const resolvedProposalStatuses = new Set<LangchainProposal["status"]>([
  "accepted",
  "rejected",
  "failed",
  "saving",
])

function applyProposalMemory(
  incoming: LangchainProposal[],
  memory: LangchainProposal[]
) {
  const memoryById = new Map(memory.map((proposal) => [proposal.tempId, proposal]))

  return incoming.map((proposal) => {
    const existing = memoryById.get(proposal.tempId)
    if (
      existing &&
      proposal.status === "pending" &&
      resolvedProposalStatuses.has(existing.status)
    ) {
      return {
        ...proposal,
        status: existing.status,
        createdId: existing.createdId,
        error: existing.error,
      }
    }

    return proposal
  })
}

function mergeProposalMemory(
  current: LangchainProposal[],
  incoming: LangchainProposal[]
) {
  const merged = new Map(current.map((proposal) => [proposal.tempId, proposal]))

  incoming.forEach((proposal) => {
    const existing = merged.get(proposal.tempId)
    if (
      existing &&
      proposal.status === "pending" &&
      resolvedProposalStatuses.has(existing.status)
    ) {
      merged.set(proposal.tempId, {
        ...proposal,
        status: existing.status,
        createdId: existing.createdId,
        error: existing.error,
      })
      return
    }

    merged.set(proposal.tempId, {
      ...existing,
      ...proposal,
    })
  })

  return [...merged.values()].slice(-80)
}

function buildLocalAnalysis(state: ModelState, focus: string): LangchainAnalysis {
  const counts = {
    technologies: state.technologies.size,
    components: state.components.size,
    damageScenarios: state.damageScenarios.size,
    attackSteps: state.attackSteps.size,
    threatScenarios: state.threatScenarios.size,
    controls: state.controls.size,
  }
  const gaps: LangchainAnalysis["gaps"] = []

  state.components.forEach((component) => {
    const hasDamageScenario = [...state.threatScenarios.values()].some(
      (scenario) =>
        (scenario.components ?? []).includes(component.id) &&
        (scenario.damage_scenarios ?? []).length > 0
    )
    const hasAttackStep = [...state.attackSteps.values()].some(
      (step) => step.component === component.id
    )
    const hasControl = [...state.controls.values()].some(
      (control) => control.component === component.id
    )

    if (!hasDamageScenario) {
      gaps.push({
        severity: "medium",
        title: `${component.name} has no damage scenarios`,
        description: "Add impact-focused damage scenarios for this component.",
      })
    }
    if (!hasAttackStep) {
      gaps.push({
        severity: "medium",
        title: `${component.name} has no attack steps`,
        description: "Add attack path steps tied to this component.",
      })
    }
    if (!hasControl) {
      gaps.push({
        severity: "low",
        title: `${component.name} has no controls`,
        description: "Add or link controls after attack steps are modeled.",
      })
    }
  })

  if (!state.components.size) {
    gaps.push({
      severity: "high",
      title: "No components modeled",
      description: "Start by modeling the primary system components and interfaces.",
    })
  }

  const recommendations = [
    focus ? `Focus requested: ${focus}` : "",
    gaps.length
      ? "Prioritize medium and high gaps before adding lower-value controls."
      : "The model has a coherent starting structure; refine ratings and relationships next.",
  ].filter(Boolean)

  return {
    title: "Current state analysis",
    summary: `The current model has ${counts.components} component(s), ${counts.damageScenarios} damage scenario(s), ${counts.attackSteps} attack step(s), ${counts.threatScenarios} threat scenario(s), and ${counts.controls} control(s).`,
    counts,
    gaps,
    recommendations,
  }
}

export function ConsoleWindow() {
  const modelState = useModelStore((store) => store.state)
  const [logs, setLogs] = React.useState<LogLine[]>([
    {
      id: "l1",
      ts: nowTs(),
      role: "system",
      text: "Console initialized.",
    },
  ])
  const [cmd, setCmd] = React.useState("")
  const [proposalPrompt, setProposalPrompt] = React.useState("")
  const [proposals, setProposals] = React.useState<LangchainProposal[]>([])
  const [proposalMemory, setProposalMemory] = React.useState<LangchainProposal[]>([])
  const [proposalDialogOpen, setProposalDialogOpen] = React.useState(false)
  const [isPreparing, setIsPreparing] = React.useState(false)
  const [chatMessages, setChatMessages] = React.useState<LangchainChatMessage[]>([])
  const endRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.length])

  React.useEffect(() => {
    if (!proposals.length) return
    setProposalMemory((current) => mergeProposalMemory(current, proposals))
  }, [proposals])

  async function sendMessage() {
    const t = cmd.trim()
    if (!t || isPreparing) return

    const pendingId = crypto.randomUUID()
    const outgoingHistory = chatMessages.slice(-10)
    setIsPreparing(true)
    setCmd("")
    setChatMessages((current) => [...current, { role: "user", content: t }])
    setLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ts: nowTs(), role: "user", text: t },
      {
        id: pendingId,
        ts: nowTs(),
        role: "assistant",
        text: "Thinking...",
      },
    ])

    let result: LangchainGenerationResult
    let source = "backend"
    let backendError = ""

    try {
      result = await prepareLangchainProposalsFromApi(
        t,
        outgoingHistory,
        proposalMemory.slice(-50)
      )
    } catch (error) {
      console.error(error)
      backendError = messageFromError(error)
      source = "local fallback"

      if (wantsAnalysis(t)) {
        result = {
          prompt: t,
          message: `The backend assistant was unavailable, so I analyzed the loaded frontend state instead: ${backendError}`,
          analysis: buildLocalAnalysis(modelState, t),
          proposals: [],
        }
      } else if (wantsProposals(t)) {
        result = {
          ...prepareLangchainProposals(t, modelState),
          message: `The backend assistant was unavailable, so I prepared local draft proposals instead: ${backendError}`,
        }
      } else {
        result = {
          prompt: t,
          message: `The backend assistant is unavailable: ${backendError}`,
          analysis: null,
          proposals: [],
        }
      }
    }

    setIsPreparing(false)
    const assistantText =
      source === "backend"
        ? result.message ||
          `Prepared ${result.proposals.length} proposal${result.proposals.length === 1 ? "" : "s"} from LangChain tools.`
        : result.message ||
          `Prepared ${result.proposals.length} local draft proposal${result.proposals.length === 1 ? "" : "s"} because the backend assistant was unavailable: ${backendError}`

    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: assistantText,
      },
    ])
    setLogs((prev) => [
      ...prev.filter((line) => line.id !== pendingId),
      {
        id: crypto.randomUUID(),
        ts: nowTs(),
        role: "assistant",
        text: assistantText,
        analysis: result.analysis,
        proposalCount: result.proposals.length,
        canReview: result.proposals.length > 0,
      },
    ])
    const proposalsWithStatusMemory = applyProposalMemory(
      result.proposals,
      proposalMemory
    )
    setProposalPrompt(result.prompt)
    setProposals(proposalsWithStatusMemory)
    setProposalDialogOpen(proposalsWithStatusMemory.length > 0)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
        <MessagesSquareIcon className="size-4" />
        Console
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="grid gap-2 p-3">
          {logs.map((line) => (
            <div
              key={line.id}
              className={
                line.role === "user"
                  ? "ml-auto max-w-[86%] rounded-md border bg-primary px-3 py-2 text-xs text-primary-foreground"
                  : "max-w-[86%] rounded-md border bg-muted/35 px-3 py-2 text-xs"
              }
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-75">
                <span className="capitalize">{line.role}</span>
                <span>{line.ts}</span>
              </div>
              <MarkdownMessage content={line.text} />
              {line.analysis ? (
                <div className="mt-3 grid gap-3 rounded-md border bg-background/70 p-3">
                  <div>
                    <div className="text-xs font-semibold">{line.analysis.title}</div>
                    <div className="mt-1 text-muted-foreground">
                      {line.analysis.summary}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(line.analysis.counts).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                  {line.analysis.gaps.length ? (
                    <div className="grid gap-1">
                      <div className="text-[11px] font-medium uppercase text-muted-foreground">
                        Gaps
                      </div>
                      {line.analysis.gaps.slice(0, 5).map((gap) => (
                        <div key={`${gap.severity}-${gap.title}`} className="text-[11px]">
                          <span className="font-medium">{gap.title}</span>
                          <span className="text-muted-foreground"> - {gap.description}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {line.analysis.recommendations.length ? (
                    <div className="grid gap-1">
                      <div className="text-[11px] font-medium uppercase text-muted-foreground">
                        Recommendations
                      </div>
                      {line.analysis.recommendations.slice(0, 4).map((item) => (
                        <div key={item} className="text-[11px] text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {line.canReview ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setProposalDialogOpen(true)}
                  >
                    <SparklesIcon />
                    Review {line.proposalCount}
                  </Button>
                </div>
              ) : null}
              {isPreparing && line.text === "Thinking..." ? (
                <Loader2Icon className="mt-2 size-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3 flex gap-2">
        <Textarea
          className="min-h-10 resize-none"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void sendMessage()
            }
          }}
          placeholder="Ask a question, request analysis, or prepare TARA proposals..."
        />
        <Button type="button" disabled={!cmd.trim() || isPreparing} onClick={() => void sendMessage()}>
          {isPreparing ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
          Send
        </Button>
      </div>

      <LangchainProposalDialog
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        prompt={proposalPrompt}
        proposals={proposals}
        setProposals={setProposals}
      />
    </div>
  )
}
