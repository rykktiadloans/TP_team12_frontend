import { useEffect, useState } from 'react'
import { FolderOpen, Loader2, CheckCircle2, PlusCircle } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createProject, getProjects, type Project } from '@/lib/GetProjects'

type ProjectSelectorProps = {
  onProjectSelected: () => void
}

function projectErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as {
    response?: {
      data?: {
        name?: string[]
        description?: string[]
        detail?: string
      }
    }
  })?.response?.data

  return (
    responseData?.name?.[0] ||
    responseData?.description?.[0] ||
    responseData?.detail ||
    fallback
  )
}

export default function ProjectSelector({
  onProjectSelected,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

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
      } catch (err: unknown) {
        console.error(err)
        setError(projectErrorMessage(err, 'Couldnt load projects'))
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  function handleSelectProject() {
    if (!selectedProjectId) return

    setSubmitting(true)
    sessionStorage.setItem('projectId', selectedProjectId)
    onProjectSelected()
  }

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const name = newProjectName.trim()
    if (!name) {
      return
    }

    try {
      setCreating(true)
      setCreateError('')
      const project = await createProject({
        name,
        description: newProjectDescription.trim(),
      })
      setProjects((current) => [project, ...current])
      setSelectedProjectId(String(project.id))
      sessionStorage.setItem('projectId', String(project.id))
      onProjectSelected()
    } catch (err: unknown) {
      console.error(err)
      setCreateError(projectErrorMessage(err, 'Could not create project'))
    } finally {
      setCreating(false)
    }
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
            ) : (
              <>
                {projects.length === 0 ? (
                  <div className="rounded-xl border px-3 py-2 text-sm text-muted-foreground">
                    No projects found yet.
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
                          <SelectValue placeholder="Select project" />
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
                            ?.description || 'No description'}
                        </div>
                      </div>
                    ) : null}

                    <Button
                      onClick={handleSelectProject}
                      className="w-full rounded-xl"
                      disabled={!selectedProjectId || submitting || creating}
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

                <div className="border-t pt-5">
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <div className="text-sm font-medium">Create project</div>
                      <div className="text-sm text-muted-foreground">
                        Start a new IA TARA workspace.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-project-name">Name</Label>
                      <Input
                        id="new-project-name"
                        value={newProjectName}
                        onChange={(event) => setNewProjectName(event.target.value)}
                        placeholder="New project"
                        disabled={creating}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-project-description">Description</Label>
                      <Textarea
                        id="new-project-description"
                        value={newProjectDescription}
                        onChange={(event) => setNewProjectDescription(event.target.value)}
                        placeholder="Scope, item definition, or notes"
                        disabled={creating}
                        rows={3}
                      />
                    </div>

                    {createError ? (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {createError}
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={creating || !newProjectName.trim()}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create and open project
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
