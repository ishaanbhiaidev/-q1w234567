"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, File, ImageIcon, Video, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth/auth-provider"

interface FileUploadProps {
  workspaceId?: string
  onUploadComplete?: () => void
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
}

export function FileUpload({
  workspaceId = "default",
  onUploadComplete,
  maxFileSize = 50,
  acceptedTypes = ["image/*", "video/*", "audio/*", "application/*", "text/*"],
}: FileUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(files)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!user || selectedFiles.length === 0) return

    try {
      setUploading(true)
      setUploadProgress(0)

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${maxFileSize}MB limit`,
            variant: "destructive",
          })
          continue
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${workspaceId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from("files").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

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

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      })

      setSelectedFiles([])
      onUploadComplete?.()
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-8 w-8 text-purple-500" />
    if (fileType.startsWith("audio/")) return <Music className="h-8 w-8 text-green-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: {maxFileSize}MB. Supported formats: Images, Documents, Videos, Audio files.
              </p>
            </div>
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="mt-4 bg-transparent" disabled={uploading}>
                Browse Files
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                <Button onClick={uploadFiles} disabled={uploading} size="sm">
                  {uploading ? "Uploading..." : "Upload All"}
                </Button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
