import { useEffect, useState } from 'react'
import { FolderOpen, Loader2, CheckCircle2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getProjects, type Project } from '@/lib/GetProjects'

type ProjectSelectorProps = {
  onProjectSelected: () => void
}

export default function ProjectSelector({
  onProjectSelected,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true)
        setError('')

        const data = await getProjects()
        setProjects(data)

        if (data.length > 0) {
          setSelectedProjectId(String(data[0].id))
        }
      } catch (err: any) {
        console.error(err)
        setError('Nepodarilo sa načítať projekty.')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  function handleSelectProject() {
    if (!selectedProjectId) return

    setSubmitting(true)
    localStorage.setItem('projectId', selectedProjectId)
    onProjectSelected()
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Select project</CardTitle>
                <CardDescription>
                  Vyber projekt, s ktorým chceš pracovať
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Načítavam projekty...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border px-3 py-2 text-sm text-muted-foreground">
                Nenašli sa žiadne projekty.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger id="project" className="w-full">
                      <SelectValue placeholder="Vyber projekt" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProjectId ? (
                  <div className="rounded-xl border bg-background px-4 py-3 text-sm">
                    <div className="font-medium">
                      {
                        projects.find((p) => String(p.id) === selectedProjectId)
                          ?.name
                      }
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {projects.find((p) => String(p.id) === selectedProjectId)
                        ?.description || 'Bez popisu'}
                    </div>
                  </div>
                ) : null}

                <Button
                  onClick={handleSelectProject}
                  className="w-full rounded-xl"
                  disabled={!selectedProjectId || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Select project
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
