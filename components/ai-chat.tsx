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
import { useToast } from "@/components/ui/use-toast"
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
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  AI Assistant
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-800">
                    Grok-3
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400">Powered by xAI's latest model</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="rounded-2xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Chat Area */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center space-y-6 py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">How can I help you today?</h3>
                  <p className="text-gray-400">
                    Ask me anything - from writing help to coding assistance, I'm here to help!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-2xl text-left h-auto p-4 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700"
                      disabled={loading}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
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
                          message.role === "user" ? "bg-purple-600 text-white ml-auto" : "bg-gray-800 text-gray-100"
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
                            className="h-6 w-6 rounded-xl text-gray-500 hover:text-gray-300"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-xl text-gray-500 hover:text-gray-300"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-xl text-gray-500 hover:text-gray-300"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</p>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-700 text-white">
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
          <div className="border-t border-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="rounded-2xl bg-gray-800 border-gray-700 text-white"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
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
