"use client"

import type React from "react"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, FileText, BookOpen, Lightbulb, MessageSquare } from "lucide-react"
import { useSession } from "next-auth/react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  relatedFiles?: string[]
}

interface SuggestedQuestion {
  question: string
  category: string
  difficulty: string
}

const sampleMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'm your AI study assistant. I can help you understand concepts from your uploaded materials, create practice questions, or explain complex topics. What would you like to study today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 300000),
  },
]

function ChatPageComponent() {
  const { data: session, status } = useSession()
  const [isHydrated, setIsHydrated] = useState(false)
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const fetchMaterials = async () => {
    if (!session?.user?.email || status !== "authenticated") return

    try {
      setIsLoadingMaterials(true)
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.documents)) {
          setAvailableMaterials(data.documents)
        }
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error)
    } finally {
      setIsLoadingMaterials(false)
    }
  }

  const fetchSuggestedQuestions = async () => {
    if (!session?.user?.email || status !== "authenticated") return

    try {
      setIsLoadingSuggestions(true)
      const response = await fetch("/api/chats/suggested")
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.questions)) {
          setSuggestedQuestions(data.questions)
        }
      }
    } catch (error) {
      console.error("Failed to fetch suggested questions:", error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const aiMessage: Message = {
            id: data.message.id,
            content: data.message.content,
            sender: "ai",
            timestamp: new Date(data.message.timestamp),
            relatedFiles: data.message.relatedFiles || [],
          }

          setMessages((prev) => [...prev, aiMessage])
          setConversationId(data.conversationId)
        } else {
          throw new Error(data.error || "Failed to send message")
        }
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchMaterials()
      fetchSuggestedQuestions()
    }
  }, [session, status])

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading session...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Please sign in to access the chat.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Study Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ask questions about your study materials and get instant explanations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat with AI
              </CardTitle>
              <CardDescription>Ask questions about your uploaded study materials</CardDescription>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>

                    {message.relatedFiles && message.relatedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs opacity-75">Related files:</p>
                        {message.relatedFiles.map((file, index) => (
                          <Badge key={index} variant="secondary" className="text-xs mr-1">
                            <FileText className="w-3 h-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-75 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>

                  {message.sender === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question about your study materials..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Suggested Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingSuggestions ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading suggestions...</div>
              ) : suggestedQuestions.length > 0 ? (
                suggestedQuestions.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto p-3 text-sm bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSuggestedQuestion(item.question)}
                  >
                    <div className="flex flex-col items-start gap-2 w-full min-w-0">
                      <span className="text-sm leading-relaxed break-words whitespace-normal text-left w-full">
                        {item.question}
                      </span>
                      <div className="flex flex-wrap gap-1 w-full">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  Upload study materials to get personalized questions!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingMaterials ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading materials...</div>
              ) : availableMaterials.length > 0 ? (
                availableMaterials.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm truncate">{file.title || file.file_name}</span>
                    {file.status === "ready" && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Ready
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No materials uploaded yet. Upload some study materials to get started!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>• Ask specific questions about concepts</p>
              <p>• Request practice problems</p>
              <p>• Ask for explanations in simple terms</p>
              <p>• Request summaries of topics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ChatPageComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  ),
})
