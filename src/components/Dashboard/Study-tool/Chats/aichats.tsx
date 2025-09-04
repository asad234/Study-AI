"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

const sampleMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'm your AI study assistant. I can help you understand concepts from your uploaded materials, create practice questions, or explain complex topics. What would you like to study today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 300000),
  },
]

const suggestedQuestions = [
  "Explain the concept of photosynthesis in simple terms",
  "Create a practice question about mitochondria",
  "What are the key differences between mitosis and meiosis?",
  "Help me understand calculus derivatives",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!session?.user?.email) return

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

    fetchMaterials()
  }, [session])

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: "ai",
        timestamp: new Date(),
        relatedFiles: ["Biology Chapter 5.pdf", "Cell Structure Notes.docx"],
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (_userInput: string): string => {
    const responses = [
      "That's a great question! Based on your uploaded materials, I can explain that concept in detail. Let me break it down for you step by step...",
      "I found relevant information in your study materials about this topic. Here's what you need to know...",
      "Excellent question! This relates to several concepts we've covered in your uploaded documents. Let me clarify...",
      "I can help you understand this better. From your materials, I can see that this concept is fundamental to...",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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

                    {message.relatedFiles && (
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
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
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
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left h-auto p-3 text-sm bg-transparent"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
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
