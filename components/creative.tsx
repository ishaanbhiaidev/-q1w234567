"use client"

import { useState } from "react"
import { Palette, Sparkles, ImageIcon, Type, Layers, Download, Share2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"

interface CreativeProject {
  id: string
  name: string
  type: "design" | "writing" | "video" | "audio"
  thumbnail: string
  lastModified: Date
  status: "draft" | "in-progress" | "completed"
}

export function Creative() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<CreativeProject[]>([
    {
      id: "1",
      name: "Brand Identity Design",
      type: "design",
      thumbnail: "/placeholder.svg?height=200&width=300",
      lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "in-progress",
    },
    {
      id: "2",
      name: "Marketing Copy",
      type: "writing",
      thumbnail: "/placeholder.svg?height=200&width=300",
      lastModified: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "draft",
    },
    {
      id: "3",
      name: "Product Demo Video",
      type: "video",
      thumbnail: "/placeholder.svg?height=200&width=300",
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
    },
  ])

  const [activeProject, setActiveProject] = useState<CreativeProject | null>(null)
  const [designSettings, setDesignSettings] = useState({
    backgroundColor: "#ffffff",
    primaryColor: "#3b82f6",
    fontSize: 16,
    fontFamily: "Inter",
    borderRadius: 8,
  })

  const createNewProject = (type: CreativeProject["type"]) => {
    const newProject: CreativeProject = {
      id: Date.now().toString(),
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Project`,
      type,
      thumbnail: `/placeholder.svg?height=200&width=300&query=${type}+project`,
      lastModified: new Date(),
      status: "draft",
    }

    setProjects((prev) => [newProject, ...prev])
    setActiveProject(newProject)

    toast({
      title: "Project Created",
      description: `New ${type} project has been created`,
    })
  }

  const saveProject = () => {
    if (!activeProject) return

    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProject.id ? { ...project, lastModified: new Date(), status: "in-progress" } : project,
      ),
    )

    toast({
      title: "Project Saved",
      description: "Your changes have been saved",
    })
  }

  const exportProject = () => {
    if (!activeProject) return

    toast({
      title: "Export Started",
      description: "Your project is being exported",
    })
  }

  const shareProject = () => {
    if (!activeProject) return

    const shareUrl = `${window.location.origin}/creative/${activeProject.id}`
    navigator.clipboard.writeText(shareUrl)

    toast({
      title: "Share Link Copied",
      description: "Project share link copied to clipboard",
    })
  }

  const getStatusColor = (status: CreativeProject["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "in-progress":
        return "bg-yellow-500"
      case "completed":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: CreativeProject["type"]) => {
    switch (type) {
      case "design":
        return <Palette className="h-4 w-4" />
      case "writing":
        return <Type className="h-4 w-4" />
      case "video":
        return <ImageIcon className="h-4 w-4" />
      case "audio":
        return <Layers className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-0">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-500" />
                Creative Studio
              </h1>
              <p className="text-lg text-muted-foreground mt-2">Design, write, and create amazing content</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createNewProject("design")} className="rounded-2xl">
                <Palette className="mr-2 h-4 w-4" />
                New Design
              </Button>
              <Button
                onClick={() => createNewProject("writing")}
                variant="outline"
                className="rounded-2xl bg-transparent"
              >
                <Type className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeProject ? (
        /* Active Project Editor */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <Card className="rounded-3xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeProject.type === "design" && (
                <Tabs defaultValue="style" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                    <TabsTrigger value="style" className="rounded-xl">
                      Style
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="rounded-xl">
                      Layout
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="style" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={designSettings.backgroundColor}
                          onChange={(e) => setDesignSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-10 rounded-xl"
                        />
                        <Input
                          value={designSettings.backgroundColor}
                          onChange={(e) => setDesignSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={designSettings.primaryColor}
                          onChange={(e) => setDesignSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-12 h-10 rounded-xl"
                        />
                        <Input
                          value={designSettings.primaryColor}
                          onChange={(e) => setDesignSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={designSettings.fontFamily}
                        onValueChange={(value) => setDesignSettings((prev) => ({ ...prev, fontFamily: value }))}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Size: {designSettings.fontSize}px</Label>
                      <Slider
                        value={[designSettings.fontSize]}
                        onValueChange={([value]) => setDesignSettings((prev) => ({ ...prev, fontSize: value }))}
                        min={12}
                        max={48}
                        step={1}
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Border Radius: {designSettings.borderRadius}px</Label>
                      <Slider
                        value={[designSettings.borderRadius]}
                        onValueChange={([value]) => setDesignSettings((prev) => ({ ...prev, borderRadius: value }))}
                        min={0}
                        max={24}
                        step={1}
                        className="rounded-2xl"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                        Left
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                        Center
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                        Right
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                        Top
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                        Bottom
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {activeProject.type === "writing" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select defaultValue="article">
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Word Count Target</Label>
                    <Input type="number" defaultValue="500" className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select defaultValue="professional">
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Canvas */}
          <Card className="rounded-3xl lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(activeProject.type)}
                  <div>
                    <CardTitle>{activeProject.name}</CardTitle>
                    <CardDescription>Last modified: {activeProject.lastModified.toLocaleString()}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveProject} variant="outline" size="sm" className="rounded-2xl bg-transparent">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button onClick={shareProject} variant="outline" size="sm" className="rounded-2xl bg-transparent">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button onClick={exportProject} size="sm" className="rounded-2xl">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeProject.type === "design" && (
                <div
                  className="w-full h-96 rounded-3xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
                  style={{
                    backgroundColor: designSettings.backgroundColor,
                    fontFamily: designSettings.fontFamily,
                  }}
                >
                  <div className="text-center space-y-4">
                    <div
                      className="w-32 h-32 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-bold"
                      style={{
                        backgroundColor: designSettings.primaryColor,
                        borderRadius: `${designSettings.borderRadius}px`,
                      }}
                    >
                      Design
                    </div>
                    <p
                      style={{
                        fontSize: `${designSettings.fontSize}px`,
                        color: designSettings.primaryColor,
                      }}
                    >
                      Your creative design goes here
                    </p>
                  </div>
                </div>
              )}

              {activeProject.type === "writing" && (
                <div className="space-y-4">
                  <Input
                    placeholder="Enter your title here..."
                    className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                  />
                  <Textarea
                    placeholder="Start writing your content here..."
                    className="min-h-80 border-0 px-0 focus-visible:ring-0 resize-none"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>0 words</span>
                    <span>Target: 500 words</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Project Gallery */
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => createNewProject("design")}
              variant="outline"
              className="h-24 rounded-3xl flex-col gap-2 bg-transparent"
            >
              <Palette className="h-8 w-8 text-purple-500" />
              <span>New Design</span>
            </Button>
            <Button
              onClick={() => createNewProject("writing")}
              variant="outline"
              className="h-24 rounded-3xl flex-col gap-2 bg-transparent"
            >
              <Type className="h-8 w-8 text-blue-500" />
              <span>New Document</span>
            </Button>
            <Button
              onClick={() => createNewProject("video")}
              variant="outline"
              className="h-24 rounded-3xl flex-col gap-2 bg-transparent"
            >
              <ImageIcon className="h-8 w-8 text-green-500" />
              <span>New Video</span>
            </Button>
            <Button
              onClick={() => createNewProject("audio")}
              variant="outline"
              className="h-24 rounded-3xl flex-col gap-2 bg-transparent"
            >
              <Layers className="h-8 w-8 text-orange-500" />
              <span>New Audio</span>
            </Button>
          </div>

          {/* Projects Grid */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="aspect-video bg-muted">
                    <img
                      src={project.thumbnail || "/placeholder.svg"}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <Badge variant="outline" className={`rounded-xl text-white ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(project.type)}
                        <span className="capitalize">{project.type}</span>
                      </div>
                      <span>{project.lastModified.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
