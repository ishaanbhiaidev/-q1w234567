"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Calendar, MoreHorizontal, CheckCircle, Pause, Play, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase, type Project } from "@/lib/supabase"

interface ProjectFormData {
  name: string
  description: string
  status: "active" | "completed" | "paused"
  progress: number
  due_date: string
  color: string
}

const statusColors = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  paused: "bg-yellow-500",
}

const statusIcons = {
  active: Play,
  completed: CheckCircle,
  paused: Pause,
}

const projectColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export function ProjectManager() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "active",
    progress: 0,
    due_date: "",
    color: projectColors[0],
  })

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error Loading Projects",
        description: "Failed to load your projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            name: formData.name,
            description: formData.description,
            status: formData.status,
            progress: formData.progress,
            due_date: formData.due_date || null,
            color: formData.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProject.id)

        if (error) throw error

        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingProject.id
              ? {
                  ...p,
                  name: formData.name,
                  description: formData.description,
                  status: formData.status,
                  progress: formData.progress,
                  due_date: formData.due_date || null,
                  color: formData.color,
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        )

        toast({
          title: "Project Updated",
          description: "Your project has been updated successfully",
        })
      } else {
        // Create new project
        const projectData = {
          name: formData.name,
          description: formData.description,
          workspace_id: "default", // You can modify this based on your workspace logic
          created_by: user.id,
          status: formData.status,
          progress: formData.progress,
          due_date: formData.due_date || null,
          color: formData.color,
        }

        const { data, error } = await supabase.from("projects").insert(projectData).select().single()

        if (error) throw error

        setProjects((prev) => [data, ...prev])

        toast({
          title: "Project Created",
          description: "Your new project has been created successfully",
        })
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "active",
        progress: 0,
        due_date: "",
        color: projectColors[0],
      })
      setIsCreateOpen(false)
      setEditingProject(null)
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      progress: project.progress,
      due_date: project.due_date || "",
      color: project.color,
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("created_by", user.id)

      if (error) throw error

      setProjects((prev) => prev.filter((p) => p.id !== projectId))

      toast({
        title: "Project Deleted",
        description: "Project has been permanently deleted",
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateProjectStatus = async (projectId: string, status: Project["status"]) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("projects")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("created_by", user.id)

      if (error) throw error

      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status } : p)))

      toast({
        title: "Status Updated",
        description: `Project status changed to ${status}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update project status",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Manager</h2>
          <p className="text-muted-foreground">{projects.length} projects</p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
              setEditingProject(null)
              setFormData({
                name: "",
                description: "",
                status: "active",
                progress: 0,
                due_date: "",
                color: projectColors[0],
              })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description (optional)"
                  className="rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Project["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress ({formData.progress}%)</Label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, progress: Number.parseInt(e.target.value) }))}
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="flex gap-2">
                  {projectColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 rounded-2xl">
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Create your first project to get started</p>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-2xl">
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const StatusIcon = statusIcons[project.status]
            return (
              <Card key={project.id} className="rounded-3xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1">{project.description}</CardDescription>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(project)}>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, "active")}>
                          Mark Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, "paused")}>
                          Pause Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, "completed")}>
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-500">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`rounded-xl text-white ${statusColors[project.status]}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>

                    {project.due_date && (
                      <Badge variant={isOverdue(project.due_date) ? "destructive" : "outline"} className="rounded-xl">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(project.due_date)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2 rounded-xl" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {formatDate(project.created_at)}</span>
                    <span>Updated {formatDate(project.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
