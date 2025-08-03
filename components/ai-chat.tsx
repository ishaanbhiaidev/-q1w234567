"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Copy, ThumbsUp, ThumbsDown, RotateCcw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth/auth-provider"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  loading?: boolean
}

const suggestions = [
  "Help me write a project proposal",
  "Explain quantum computing simply",
  "Create a marketing strategy",
  "Debug this code snippet",
  "Write a professional email",
  "Brainstorm creative ideas",
]

export function AIChat() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      loading: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get AI response")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                assistantContent += parsed.choices[0].delta.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id ? { ...msg, content: assistantContent, loading: false } : msg,
                  ),
                )
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I encountered an error. Please try again.", loading: false }
            : msg,
        ),
      )
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      })
    }
  }

  const clearChat = () => {
    setMessages([])
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Assistant
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                    Grok-3
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Powered by xAI's latest model</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="rounded-2xl"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Chat Area */}
      <Card className="bg-card/80 backdrop-blur-xl border-border">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center space-y-6 py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                  <p className="text-muted-foreground">
                    Ask me anything - from writing help to coding assistance, I'm here to help!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-2xl text-left h-auto p-4 bg-muted/50 hover:bg-muted border border-border"
                      disabled={loading}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-3xl px-4 py-3 ${
                          message.role === "user" 
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto" 
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {message.loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>

                      {message.role === "assistant" && !message.loading && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyMessage(message.content)}
                            className="h-6 w-6 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Copy message"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Like message"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Dislike message"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</p>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {user?.display_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="rounded-2xl"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
