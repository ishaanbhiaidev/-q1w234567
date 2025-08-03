"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, Download, Trash2, Share2, Folder, Search, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase, type FileRecord } from "@/lib/supabase"
import { useAuth } from "./auth/auth-provider"

interface FileManagerProps {
  workspaceId?: string
}

export function FileManager({ workspaceId = "default" }: FileManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [user, workspaceId])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error("Error loading files:", error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${workspaceId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("files").upload(filePath, file)

      if (uploadError) throw uploadError

      // Save file record to database
      const { error: dbError } = await supabase.from("files").insert({
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
        workspace_id: workspaceId,
      })

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      loadFiles()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileDownload = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage.from("files").download(file.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "File downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleFileDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from("files").remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase.from("files").delete().eq("id", fileId)

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      loadFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleFileShare = async (fileId: string) => {
    try {
      const { error } = await supabase.from("files").update({ shared: true }).eq("id", fileId)

      if (error) throw error

      toast({
        title: "Success",
        description: "File shared successfully",
      })

      loadFiles()
    } catch (error) {
      console.error("Error sharing file:", error)
      toast({
        title: "Error",
        description: "Failed to share file",
        variant: "destructive",
      })
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || file.file_type?.startsWith(filterType)
    return matchesSearch && matchesFilter
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.startsWith("video/")) return "🎥"
    if (fileType.startsWith("audio/")) return "🎵"
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("document") || fileType.includes("word")) return "📝"
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊"
    return "📁"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading files...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            File Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input type="file" onChange={handleFileUpload} disabled={uploading} />
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: 50MB. Supported formats: Images, Documents, Videos, Audio files.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="application">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File List */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || filterType !== "all" ? "No files match your search criteria" : "No files uploaded yet"}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                  viewMode === "list" ? "flex items-center justify-between" : ""
                }`}
              >
                <div className={`flex items-center gap-3 ${viewMode === "list" ? "flex-1" : "mb-3"}`}>
                  <div className="text-2xl">{getFileIcon(file.file_type || "")}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleFileDownload(file)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFileShare(file.id)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFileDelete(file.id, file.file_path)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Statistics */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatFileSize(files.reduce((acc, file) => acc + (file.file_size || 0), 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{files.filter((f) => f.shared).length}</p>
              <p className="text-sm text-muted-foreground">Shared Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{files.filter((f) => f.file_type?.startsWith("image/")).length}</p>
              <p className="text-sm text-muted-foreground">Images</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
