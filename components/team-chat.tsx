"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Hash, Users, Settings, Search, Smile, Paperclip, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase, type Message, type Channel, type User } from "@/lib/supabase"

export function TeamChat() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadChannels()
      loadOnlineUsers()
    }
  }, [user])

  useEffect(() => {
    if (activeChannel) {
      loadMessages()
      subscribeToMessages()
    }
  }, [activeChannel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", "default")
        .order("created_at")

      if (error) throw error

      setChannels(data || [])
      if (data && data.length > 0) {
        setActiveChannel(data[0])
      }
    } catch (error) {
      console.error("Error loading channels:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!activeChannel) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          user:users(display_name, avatar_url)
        `)
        .eq("channel_id", activeChannel.id)
        .order("created_at")
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").in("status", ["online", "away"]).limit(20)

      if (error) throw error
      setOnlineUsers(data || [])
    } catch (error) {
      console.error("Error loading online users:", error)
    }
  }

  const subscribeToMessages = () => {
    if (!activeChannel) return

    const subscription = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const { data, error } = await supabase
            .from("messages")
            .select(`
              *,
              user:users(display_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single()

          if (!error && data) {
            setMessages((prev) => [...prev, data])
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || !user) return

    try {
      const { error } = await supabase.from("messages").insert({
        content: newMessage.trim(),
        channel_id: activeChannel.id,
        user_id: user.id,
        message_type: "text",
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
      {/* Channels Sidebar */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800 lg:col-span-1">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              <Hash className="h-4 w-4" />
              Channels
            </h3>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-2 space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel?.id === channel.id ? "default" : "ghost"}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full justify-start rounded-2xl ${
                    activeChannel?.id === channel.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  {channel.name}
                </Button>
              ))}
            </div>
          </ScrollArea>

          <Separator className="bg-gray-800" />

          <div className="p-4">
            <h4 className="font-medium flex items-center gap-2 mb-3 text-white">
              <Users className="h-4 w-4" />
              Online ({onlineUsers.length})
            </h4>
            <div className="space-y-2">
              {onlineUsers.slice(0, 8).map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={onlineUser.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-gray-700 text-white">
                        {onlineUser.display_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        onlineUser.status === "online" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <span className="text-sm truncate text-gray-300">{onlineUser.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800 lg:col-span-3">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-white">{activeChannel?.name}</h3>
                <p className="text-sm text-gray-400">{messages.length} messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-300">Welcome to #{activeChannel?.name}</h3>
                <p className="text-gray-500">This is the beginning of your conversation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id
                  const isCurrentUser = message.user_id === user?.id

                  return (
                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && showAvatar && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.user?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {message.user?.display_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {!isCurrentUser && !showAvatar && <div className="w-8" />}

                      <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                        {showAvatar && !isCurrentUser && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-300">{message.user?.display_name}</span>
                            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                          </div>
                        )}

                        <div
                          className={`rounded-3xl px-4 py-2 ${
                            isCurrentUser ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {isCurrentUser && (
                          <span className="text-xs text-gray-500 mt-1 block">{formatTime(message.created_at)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800">
            <form onSubmit={sendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel?.name}`}
                  className="rounded-2xl pr-20 bg-gray-800 border-gray-700 text-white"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-xl text-gray-400 hover:text-white"
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-xl text-gray-400 hover:text-white"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
