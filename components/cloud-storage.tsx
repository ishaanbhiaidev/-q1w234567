"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Cloud, Upload, Download, Trash2, Share, Search, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase } from "@/lib/supabase"

interface CloudProvider {
  id: string
  name: string
  icon: string
  connected: boolean
  storage: {
    used: number
    total: number
  }
  syncStatus: "synced" | "syncing" | "error" | "offline"
  lastSync: Date
}

interface SyncSettings {
  autoSync: boolean
  syncInterval: number
  syncOnUpload: boolean
  syncOnModify: boolean
  provider: string
}

interface CloudFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  created_at: string
  updated_at: string
  shared: boolean
}

export function CloudStorage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [providers, setProviders] = useState<CloudProvider[]>([
    {
      id: "aws-s3",
      name: "Amazon S3",
      icon: "☁️",
      connected: true,
      storage: { used: 2.4, total: 100 },
      syncStatus: "synced",
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "📁",
      connected: false,
      storage: { used: 0, total: 15 },
      syncStatus: "offline",
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "📦",
      connected: true,
      storage: { used: 1.8, total: 2 },
      syncStatus: "syncing",
      lastSync: new Date(Date.now() - 2 * 60 * 1000),
    },
  ])

  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 5,
    syncOnUpload: true,
    syncOnModify: true,
    provider: "aws-s3",
  })

  const [isOnline, setIsOnline] = useState(true)
  const [syncProgress, setSyncProgress] = useState(0)
  const [files, setFiles] = useState<CloudFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit] = useState(5 * 1024 * 1024 * 1024) // 5GB limit

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    if (user) {
      loadFiles()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [user])

  const connectProvider = (providerId: string) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId
          ? { ...provider, connected: true, syncStatus: "synced", lastSync: new Date() }
          : provider,
      ),
    )

    toast({
      title: "Provider Connected",
      description: `Successfully connected to ${providers.find((p) => p.id === providerId)?.name}`,
    })
  }

  const disconnectProvider = (providerId: string) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, connected: false, syncStatus: "offline" } : provider,
      ),
    )

    toast({
      title: "Provider Disconnected",
      description: `Disconnected from ${providers.find((p) => p.id === providerId)?.name}`,
    })
  }

  const syncNow = () => {
    const activeProvider = providers.find((p) => p.id === syncSettings.provider && p.connected)
    if (!activeProvider) {
      toast({
        title: "Sync Failed",
        description: "No active cloud provider selected",
        variant: "destructive",
      })
      return
    }

    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === syncSettings.provider ? { ...provider, syncStatus: "syncing" } : provider,
      ),
    )

    // Simulate sync progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      setSyncProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(interval)
        setProviders((prev) =>
          prev.map((provider) =>
            provider.id === syncSettings.provider
              ? { ...provider, syncStatus: "synced", lastSync: new Date() }
              : provider,
          ),
        )
        setSyncProgress(0)
        toast({
          title: "Sync Complete",
          description: "All files have been synchronized to the cloud",
        })
      }
    }, 500)
  }

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("uploaded_by", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setFiles(data || [])

      // Calculate storage used
      const totalSize = (data || []).reduce((sum, file) => sum + file.file_size, 0)
      setStorageUsed(totalSize)
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

    // Check storage limit
    if (storageUsed + file.size > storageLimit) {
      toast({
        title: "Storage Limit Exceeded",
        description: "Please upgrade to premium for more storage",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("files").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("files").getPublicUrl(fileName)

      // Save file record to database
      const { data, error } = await supabase
        .from("files")
        .insert({
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          workspace_id: "default",
          shared: false,
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      const newFile: CloudFile = {
        id: data.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        created_at: data.created_at,
        updated_at: data.updated_at,
        shared: false,
      }

      setFiles((prev) => [newFile, ...prev])
      setStorageUsed((prev) => prev + file.size)

      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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

      // Remove from local state
      const deletedFile = files.find((f) => f.id === fileId)
      if (deletedFile) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
        setStorageUsed((prev) => prev - deletedFile.size)
      }

      toast({
        title: "File Deleted",
        description: "File has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileShare = async (fileId: string) => {
    try {
      const { error } = await supabase.from("files").update({ shared: true }).eq("id", fileId)

      if (error) throw error

      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, shared: true } : f)))

      toast({
        title: "File Shared",
        description: "File is now publicly accessible",
      })
    } catch (error) {
      console.error("Error sharing file:", error)
      toast({
        title: "Share Failed",
        description: "Failed to share file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 GB"
    const k = 1024
    const sizes = ["GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️"
    if (type.startsWith("video/")) return "🎥"
    if (type.startsWith("audio/")) return "🎵"
    if (type.includes("pdf")) return "📄"
    if (type.includes("document") || type.includes("word")) return "📝"
    if (type.includes("spreadsheet") || type.includes("excel")) return "📊"
    return "📁"
  }

  const getStatusIcon = (status: CloudProvider["syncStatus"]) => {
    switch (status) {
      case "synced":
        return <Upload className="h-4 w-4 text-green-500" />
      case "syncing":
        return <List className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "offline":
        return <Filter className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: CloudProvider["syncStatus"]) => {
    switch (status) {
      case "synced":
        return "Synced"
      case "syncing":
        return "Syncing..."
      case "error":
        return "Error"
      case "offline":
        return "Offline"
    }
  }

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="rounded-3xl bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {isOnline ? <Upload className="h-5 w-5 text-green-500" /> : <Trash2 className="h-5 w-5 text-red-500" />}
            Connection Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isOnline ? "Connected to the internet" : "You're currently offline"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "destructive"} className="rounded-xl">
                {isOnline ? "Online" : "Offline"}
              </Badge>
              {syncProgress > 0 && (
                <div className="flex items-center gap-2">
                  <Progress value={syncProgress} className="w-32 h-2 rounded-xl" />
                  <span className="text-sm text-muted-foreground">{Math.round(syncProgress)}%</span>
                </div>
              )}
            </div>
            <Button
              onClick={syncNow}
              disabled={!isOnline}
              className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white"
            >
              <List className="mr-2 h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Providers */}
      <Card className="rounded-3xl bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Cloud className="h-5 w-5" />
            Cloud Storage Providers
          </CardTitle>
          <CardDescription className="text-gray-400">Connect and manage your cloud storage accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <h4 className="font-medium text-white">{provider.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {getStatusIcon(provider.syncStatus)}
                        <span>{getStatusText(provider.syncStatus)}</span>
                        {provider.connected && <span>• Last sync: {provider.lastSync.toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={provider.connected ? "default" : "secondary"}
                      className="rounded-xl bg-green-900/30 text-green-400 border-green-800"
                    >
                      {provider.connected ? "Connected" : "Disconnected"}
                    </Badge>
                    {provider.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectProvider(provider.id)}
                        className="rounded-xl bg-transparent text-gray-400 hover:text-white"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => connectProvider(provider.id)}
                        className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {provider.connected && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Storage Used</span>
                      <span className="text-white">
                        {formatBytes(provider.storage.used)} / {formatBytes(provider.storage.total)}
                      </span>
                    </div>
                    <Progress
                      value={(provider.storage.used / provider.storage.total) * 100}
                      className="h-2 rounded-xl"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* File Management */}
      <Card className="rounded-3xl bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="text-gray-400 hover:text-white"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="text-gray-400 hover:text-white"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="file-upload">
                <Button asChild disabled={uploading} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No files found</h3>
              <p className="text-gray-500">Upload your first file to get started</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`${
                    viewMode === "grid"
                      ? "bg-gray-800/50 rounded-2xl p-4"
                      : "flex items-center justify-between bg-gray-800/50 rounded-xl p-3"
                  } border border-gray-700 hover:border-gray-600 transition-colors`}
                >
                  <div className={viewMode === "grid" ? "space-y-3" : "flex items-center gap-3 flex-1"}>
                    <div className={viewMode === "grid" ? "text-center" : "flex items-center gap-3"}>
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <div className={viewMode === "grid" ? "mt-2" : ""}>
                        <h4 className="font-medium text-white truncate">{file.name}</h4>
                        <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                        <p className="text-xs text-gray-500">{new Date(file.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {file.shared && (
                      <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-800">
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 ${viewMode === "grid" ? "justify-center mt-3" : ""}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(file.url, "_blank")}
                      className="text-gray-400 hover:text-white h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileShare(file.id)}
                      className="text-gray-400 hover:text-white h-8 w-8"
                      disabled={file.shared}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileDelete(file.id, file.name)}
                      className="text-gray-400 hover:text-red-400 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
