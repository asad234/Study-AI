"use client"

import type React from "react"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Send, Bot, User, FileText, Lightbulb, MessageSquare, FolderOpen, ArrowRight } from "lucide-react"
import { useSession } from "next-auth/react"
import UnderDevelopmentBanner from "@/components/common/underDevelopment"

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

interface Project {
  id: string
  name: string
  description: string
  category?: string
  study_goal?: string
  estimated_hours?: number
  status: string
  progress: number
  file_count: number
  created_at: string
  target_date?: string
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
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchProjects = async () => {
    if (!session?.user?.email || status !== "authenticated") return

    try {
      setIsLoadingProjects(true)
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.projects)) {
          setAvailableProjects(data.projects)
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setIsLoadingProjects(false)
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
      fetchProjects()
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

          {/* Available Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Available Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingProjects ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading projects...</div>
              ) : availableProjects.length > 0 ? (
                availableProjects.map((project) => (
                  <Card key={project.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm truncate">{project.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FileText className="w-3 h-3" />
                          <span>{project.file_count} docs</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 bg-transparent"
                        onClick={() => setSelectedProject(project)}
                      >
                        View Project <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No projects created yet. Create a project to get started!
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

      {/* Project Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <UnderDevelopmentBanner/>
              <DialogTitle>{selectedProject.name}</DialogTitle>
              <DialogDescription>{selectedProject.description}</DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge
                        className="mt-1"
                        variant={selectedProject.status === "completed" ? "default" : "secondary"}
                      >
                        {selectedProject.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <div className="mt-1 font-medium">{selectedProject.category || "N/A"}</div>
                    </div>
                    <div>
                      <Label>Study Goal</Label>
                      <div className="mt-1 font-medium">{selectedProject.study_goal || "N/A"}</div>
                    </div>
                    <div>
                      <Label>Estimated Hours</Label>
                      <div className="mt-1 font-medium">{selectedProject.estimated_hours || "N/A"} hours</div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{selectedProject.progress}%</span>
                    </div>
                    <Progress value={selectedProject.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Files associated with this project.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedProject.file_count} Documents</p>
                      <p className="text-sm text-gray-500">Ready for AI analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
