import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ciaBitmaskOptions,
  elapsedTimeOptions,
  equipmentOptions,
  impactOptions,
  knowledgeOptions,
  specialistExpertiseOptions,
  windowOfOpportunityOptions,
} from '@/lib/tara'
import {
  langchainTypeLabels,
  proposalDisplayName,
  type LangchainProposal,
} from '@/lib/langchains/types'

type Props = {
  proposal: LangchainProposal
  proposals: LangchainProposal[]
  onAccept: (proposal: LangchainProposal) => void
  onReject: (proposal: LangchainProposal) => void
}

function optionLabel(options: Array<{ value: number; label: string }>, value: unknown) {
  const numericValue = Number(value)
  return options.find((option) => option.value === numericValue)?.label ?? String(value)
}

function statusVariant(status: LangchainProposal['status']) {
  if (status === 'accepted') return 'default'
  if (status === 'failed') return 'destructive'
  if (status === 'rejected') return 'secondary'
  return 'outline'
}

function statusText(status: LangchainProposal['status']) {
  if (status === 'saving') return 'Saving'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getPreviewFields(proposal: LangchainProposal) {
  const payload = proposal.payload

  if (proposal.type === 'damageScenario') {
    return [
      ['CIA', optionLabel(ciaBitmaskOptions, payload.affected_CIA_parts)],
      ['Impact', optionLabel(impactOptions, payload.impact_scale)],
      ['Safety', optionLabel(impactOptions, payload.safety_impact)],
      ['Operational', optionLabel(impactOptions, payload.operational_impact)],
    ]
  }

  if (proposal.type === 'attackStep' || proposal.type === 'control') {
    return [
      ['ET', optionLabel(elapsedTimeOptions, payload.fr_et)],
      ['SE', optionLabel(specialistExpertiseOptions, payload.fr_se)],
      ['KoC', optionLabel(knowledgeOptions, payload.fr_koC)],
      ['WoO', optionLabel(windowOfOpportunityOptions, payload.fr_WoO)],
      ['Eq', optionLabel(equipmentOptions, payload.fr_eq)],
    ]
  }

  return []
}

function referenceText(proposal: LangchainProposal, proposals: LangchainProposal[]) {
  return (proposal.references ?? []).map((reference) => {
    const target = proposals.find((item) => item.tempId === reference.tempId)
    const targetName = target ? proposalDisplayName(target) : reference.label ?? reference.tempId
    const state =
      target?.status === 'accepted' && target.createdId != null
        ? `id ${target.createdId}`
        : target?.status ?? 'unresolved'

    return `${reference.field}: ${targetName} (${state})`
  })
}

function payloadEntries(payload: Record<string, unknown>) {
  return Object.entries(payload).filter(([, value]) => value != null && value !== '')
}

export function LangchainProposalRow({
  proposal,
  proposals,
  onAccept,
  onReject,
}: Props) {
  const disabled = proposal.status === 'saving' || proposal.status === 'accepted'
  const rejected = proposal.status === 'rejected'
  const previewFields = getPreviewFields(proposal)
  const references = referenceText(proposal, proposals)

  return (
    <AccordionItem
      value={proposal.tempId}
      className="rounded-md border px-3 last:border-b"
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col gap-2 pr-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{langchainTypeLabels[proposal.type]}</Badge>
            <Badge variant={statusVariant(proposal.status)}>
              {statusText(proposal.status)}
            </Badge>
            {proposal.createdId != null ? (
              <span className="text-xs text-muted-foreground">API id {proposal.createdId}</span>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {proposalDisplayName(proposal)}
            </div>
            {proposal.description ? (
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {proposal.description}
              </div>
            ) : null}
          </div>
          {previewFields.length ? (
            <div className="flex flex-wrap gap-1.5">
              {previewFields.map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {label}: {value}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="grid gap-4">
          {proposal.rationale ? (
            <div className="grid gap-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Rationale
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                {proposal.rationale}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Attributes
            </div>
            <div className="grid gap-1 rounded-md border bg-muted/30 p-3 text-xs">
              {payloadEntries(proposal.payload).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[9rem_1fr] gap-2">
                  <span className="font-medium text-muted-foreground">{key}</span>
                  <span className="break-words">
                    {Array.isArray(value) || typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {references.length ? (
            <div className="grid gap-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Planned links
              </div>
              <div className="grid gap-1 text-xs">
                {references.map((reference) => (
                  <div key={reference} className="rounded-md border px-3 py-2">
                    {reference}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {proposal.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {proposal.error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={proposal.status === 'saving' || rejected}
              onClick={() => onReject(proposal)}
            >
              <XIcon />
              Reject
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || rejected}
              onClick={() => onAccept(proposal)}
            >
              {proposal.status === 'saving' ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
              Accept
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
