import type * as React from 'react'
import { SparklesIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Accordion } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useModelStore } from '@/store/model-store'
import {
  createLangchainProposal,
  reconcileAcceptedProposals,
} from '@/lib/langchains/proposalApi'
import {
  langchainTypeLabels,
  type LangchainProposal,
  type LangchainProposalStatus,
} from '@/lib/langchains/types'
import { LangchainProposalRow } from './LangchainProposalRow'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: string
  proposals: LangchainProposal[]
  setProposals: React.Dispatch<React.SetStateAction<LangchainProposal[]>>
}

function countsByStatus(proposals: LangchainProposal[]) {
  return proposals.reduce(
    (counts, proposal) => {
      counts[proposal.status] = (counts[proposal.status] ?? 0) + 1
      return counts
    },
    {} as Partial<Record<LangchainProposalStatus, number>>
  )
}

function proposalGroups(proposals: LangchainProposal[]) {
  return proposals.reduce(
    (groups, proposal) => {
      groups[proposal.type] = [...(groups[proposal.type] ?? []), proposal]
      return groups
    },
    {} as Partial<Record<LangchainProposal['type'], LangchainProposal[]>>
  )
}

function projectId() {
  return sessionStorage.getItem('projectId')
}

export function LangchainProposalDialog({
  open,
  onOpenChange,
  prompt,
  proposals,
  setProposals,
}: Props) {
  const loadProjectState = useModelStore((store) => store.loadProjectState)
  const loadTree = useModelStore((store) => store.loadTree)
  const treeProjectId = useModelStore((store) => store.treeProjectId)
  const statusCounts = countsByStatus(proposals)
  const groups = proposalGroups(proposals)

  const refreshProject = async () => {
    const currentProjectId = projectId()
    if (!currentProjectId) {
      return
    }

    await loadProjectState(currentProjectId)
    if (treeProjectId != null) {
      await loadTree(currentProjectId)
    }
  }

  const handleReject = (proposal: LangchainProposal) => {
    setProposals((current) =>
      current.map((item) =>
        item.tempId === proposal.tempId
          ? { ...item, status: 'rejected', error: undefined }
          : item
      )
    )
  }

  const handleAccept = async (proposal: LangchainProposal) => {
    let savingProposals: LangchainProposal[] = []

    setProposals((current) => {
      savingProposals = current.map((item) =>
        item.tempId === proposal.tempId
          ? { ...item, status: 'saving', error: undefined }
          : item
      )
      return savingProposals
    })

    try {
      const proposalToCreate =
        savingProposals.find((item) => item.tempId === proposal.tempId) ?? proposal
      const saved = await createLangchainProposal(proposalToCreate, savingProposals)

      if (typeof saved.id !== 'number') {
        throw new Error('API response did not include a saved id.')
      }

      let acceptedProposals: LangchainProposal[] = []
      setProposals((current) => {
        acceptedProposals = current.map((item) =>
          item.tempId === proposal.tempId
            ? {
                ...item,
                status: 'accepted',
                createdId: saved.id,
                error: undefined,
              }
            : item
        )
        return acceptedProposals
      })

      await reconcileAcceptedProposals(acceptedProposals)
      await refreshProject()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save this proposal.'
      setProposals((current) =>
        current.map((item) =>
          item.tempId === proposal.tempId
            ? { ...item, status: 'failed', error: message }
            : item
        )
      )
    }
  }

  const visibleProposals = proposals.filter(
    (proposal) => proposal.status !== 'rejected'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5" />
            Langchains proposals
          </DialogTitle>
          <DialogDescription>
            Review the prepared objects, expand details, then accept only what should be sent to the API.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {prompt || 'No prompt captured.'}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{proposals.length} prepared</Badge>
          <Badge variant="outline">{statusCounts.pending ?? 0} pending</Badge>
          <Badge variant="outline">{statusCounts.accepted ?? 0} accepted</Badge>
          <Badge variant="outline">{statusCounts.failed ?? 0} failed</Badge>
          <Badge variant="outline">{statusCounts.rejected ?? 0} rejected</Badge>
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-3">
          <div className="grid max-h-[58vh] gap-5">
            {visibleProposals.length ? (
              Object.entries(groups).map(([type, group]) => {
                const visibleGroup = group.filter(
                  (proposal) => proposal.status !== 'rejected'
                )
                if (!visibleGroup.length) {
                  return null
                }

                return (
                  <section key={type} className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        {langchainTypeLabels[type as LangchainProposal['type']]}
                      </h3>
                      <Badge variant="secondary">{visibleGroup.length}</Badge>
                    </div>
                    <Accordion type="multiple" className="grid gap-2">
                      {visibleGroup.map((proposal) => (
                        <LangchainProposalRow
                          key={proposal.tempId}
                          proposal={proposal}
                          proposals={proposals}
                          onAccept={handleAccept}
                          onReject={handleReject}
                        />
                      ))}
                    </Accordion>
                  </section>
                )
              })
            ) : (
              <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                No active proposals.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
