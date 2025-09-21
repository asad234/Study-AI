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
import { Send, Bot, User, FileText, Lightbulb, MessageSquare, FolderOpen, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { useSession } from "next-auth/react"
import UnderDevelopmentBanner from "@/components/common/underDevelopment"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  relatedFiles?: string[]
  // Add structured content for parsed AI responses
  structuredContent?: {
    introduction?: string
    elements?: Array<{title: string, explanation: string}>
    summary?: string
    context?: string
  }
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
    content: "Hello! I'm your AI study assistant. I can help you understand concepts from your uploaded materials, create practice questions, or explain complex topics. What would you like to study today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 300000),
  },
]

// Function to parse structured AI responses
const parseStructuredResponse = (text: string) => {
  const result: any = {
    raw: text,
    introduction: "",
    elements: [],
    summary: "",
    context: ""
  }

  try {
    // Extract introduction (everything before the first divider)
    const introMatch = text.split('---')[0].match(/\[CONCEPT INTRODUCTION\](.*?)(?=\[|$)/s)
    if (introMatch && introMatch[1]) {
      result.introduction = introMatch[1].trim()
    } else {
      // Fallback: get text before first divider
      const parts = text.split('---')
      if (parts.length > 0) {
        result.introduction = parts[0].replace(/\[CONCEPT INTRODUCTION\]/g, '').trim()
      }
    }

    // Extract key elements section
    const keyElementsMatch = text.match(/\[KEY ELEMENTS\](.*?)(?=\[SUMMARY\]|---|$)/s)
    if (keyElementsMatch && keyElementsMatch[1]) {
      const elementsText = keyElementsMatch[1]
      // Parse each element
      const elementRegex = /ELEMENT \d+: ([^\n]+)\nExplanation: ([^\n]+)/g
      let match
      while ((match = elementRegex.exec(elementsText)) !== null) {
        result.elements.push({
          title: match[1].trim(),
          explanation: match[2].trim()
        })
      }
    }

    // Extract summary
    const summaryMatch = text.match(/\[SUMMARY\](.*?)(?=\[RELATED CONTEXT\]|---|$)/s)
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1].replace(/SUMMARY:/, '').trim()
    }

    // Extract context
    const contextMatch = text.match(/\[RELATED CONTEXT\](.*?)(?=$)/s)
    if (contextMatch && contextMatch[1]) {
      result.context = contextMatch[1].replace(/CONTEXT:/, '').trim()
    } else {
      // Try to find context without the header
      const contextFallback = text.match(/CONTEXT: (.*?)(?=$)/s)
      if (contextFallback && contextFallback[1]) {
        result.context = contextFallback[1].trim()
      }
    }
  } catch (error) {
    console.error("Error parsing structured response:", error)
    // If parsing fails, fall back to displaying raw text
    result.introduction = text
  }

  return result
}

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
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [showAllQuestions, setShowAllQuestions] = useState(false)

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
          // Parse the structured response
          const structuredContent = parseStructuredResponse(data.message.content)
          
          const aiMessage: Message = {
            id: data.message.id,
            content: data.message.content,
            sender: "ai",
            timestamp: new Date(data.message.timestamp),
            relatedFiles: data.message.relatedFiles || [],
            structuredContent: structuredContent
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            AI Study Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Ask questions about your study materials and get instant, personalized explanations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col border-2 border-gray-200/60 dark:border-gray-800/60 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  Chat with AI
                </CardTitle>
                <CardDescription className="text-base">Ask questions about your uploaded study materials</CardDescription>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-6 p-6 bg-gradient-to-b from-gray-50/30 to-white/50 dark:from-gray-900/30 dark:to-gray-900/50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "ai" && (
                      <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800 shadow-md">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          <Bot className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-lg border transition-all duration-200 hover:shadow-xl ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-300/50"
                          : "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                      }`}
                    >
                      {/* Render structured content if available */}
                      {message.sender === "ai" && message.structuredContent ? (
                        <div className="space-y-4">
                          {/* Introduction */}
                          {message.structuredContent.introduction && (
                            <div className="text-sm leading-relaxed">
                              {message.structuredContent.introduction}
                            </div>
                          )}
                          
                          {/* Key Elements */}
                          {message.structuredContent.elements && message.structuredContent.elements.length > 0 && (
                            <div className="space-y-4">
                              <div className="font-semibold text-sm border-b pb-1">KEY ELEMENTS:</div>
                              {message.structuredContent.elements.map((element, index) => (
                                <div key={index} className="bg-blue-50/30 dark:bg-blue-900/20 p-3 rounded-lg">
                                  <div className="font-medium text-sm">{element.title}</div>
                                  <div className="text-sm mt-1">{element.explanation}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Summary */}
                          {message.structuredContent.summary && (
                            <div className="bg-green-50/30 dark:bg-green-900/20 p-3 rounded-lg">
                              <div className="font-semibold text-sm">SUMMARY:</div>
                              <div className="text-sm mt-1">{message.structuredContent.summary}</div>
                            </div>
                          )}
                          
                          {/* Context */}
                          {message.structuredContent.context && (
                            <div className="text-xs opacity-80 mt-2">
                              {message.structuredContent.context}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Fallback to regular message rendering */
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}

                      {message.relatedFiles && message.relatedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs opacity-80 font-medium">Related files:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.relatedFiles.map((file, index) => (
                              <Badge key={index} variant="secondary" className="text-xs border border-gray-300/50 bg-gray-100/80 dark:bg-gray-700/80">
                                <FileText className="w-3 h-3 mr-1" />
                                {file}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs opacity-70 mt-2 font-medium">{message.timestamp.toLocaleTimeString()}</p>
                    </div>

                    {message.sender === "user" && (
                      <Avatar className="w-10 h-10 border-2 border-purple-200 dark:border-purple-800 shadow-md">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800 shadow-md">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Input */}
              <div className="p-6 border-t border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask a question about your study materials..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base bg-white/90 dark:bg-gray-800/90 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Remaining code unchanged */}
          <div className="space-y-6">
            {/* Suggested Questions */}
            <Card className="border-2 border-gray-200/60 dark:border-gray-800/60 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-md">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {isLoadingSuggestions ? (
                  <div className="text-sm text-gray-500 text-center py-8">Loading suggestions...</div>
                ) : suggestedQuestions.length > 0 ? (
                  <>
                    {/* Show first 2 questions */}
                    {(showAllQuestions ? suggestedQuestions : suggestedQuestions.slice(0, 2)).map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full text-left h-auto p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 border-2 border-gray-200/60 dark:border-gray-700/60 rounded-xl transition-all duration-200 hover:shadow-lg hover:border-blue-300/60 dark:hover:border-blue-700/60"
                        onClick={() => handleSuggestedQuestion(item.question)}
                      >
                        <div className="flex flex-col items-start gap-3 w-full min-w-0">
                          <span className="text-sm leading-relaxed break-words whitespace-normal text-left w-full font-medium">
                            {item.question}
                          </span>
                          <div className="flex flex-wrap gap-2 w-full">
                            <Badge variant="secondary" className="text-xs border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
                              {item.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-2 border-purple-200 dark:border-purple-800">
                              {item.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    ))}
                    
                    {/* Show dropdown toggle if more than 2 questions */}
                    {suggestedQuestions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-600 rounded-xl transition-all duration-200"
                        onClick={() => setShowAllQuestions(!showAllQuestions)}
                      >
                        {showAllQuestions ? (
                          <>
                            Show Less <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Show {suggestedQuestions.length - 2} More Questions <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    Upload study materials to get personalized questions!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Projects */}
            <Card className="border-2 border-gray-200/60 dark:border-gray-800/60 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg shadow-md">
                    <FolderOpen className="w-4 h-4 text-white" />
                  </div>
                  Available Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {isLoadingProjects ? (
                  <div className="text-sm text-gray-500 text-center py-8">Loading projects...</div>
                ) : availableProjects.length > 0 ? (
                  <>
                    {/* Show first 2 projects */}
                    {(showAllProjects ? availableProjects : availableProjects.slice(0, 2)).map((project) => (
                      <Card key={project.id} className="p-4 border-2 border-gray-200/60 dark:border-gray-700/60 hover:shadow-lg hover:border-blue-300/60 dark:hover:border-blue-700/60 transition-all duration-200 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                            <p className="text-xs text-gray-500 truncate mt-1">{project.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FileText className="w-3 h-3" />
                              <span>{project.file_count} docs</span>
                            </div>
                            <Badge variant="secondary" className="text-xs border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
                              {project.status}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg transition-all duration-200"
                            onClick={() => setSelectedProject(project)}
                          >
                            View Project <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                    
                    {/* Show dropdown toggle if more than 2 projects */}
                    {availableProjects.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all duration-200"
                        onClick={() => setShowAllProjects(!showAllProjects)}
                      >
                        {showAllProjects ? (
                          <>
                            Show Less <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Show {availableProjects.length - 2} More Projects <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No projects created yet. Create a project to get started!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Tips */}
            <Card className="border-2 border-gray-200/60 dark:border-gray-800/60 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="text-lg">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Ask specific questions about concepts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Request practice problems</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Ask for explanations in simple terms</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Request summaries of topics</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Dialog */}
        {selectedProject && (
          <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto border-2 border-gray-200/60 dark:border-gray-800/60 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl">
              <DialogHeader className="border-b border-gray-200/60 dark:border-gray-800/60 pb-4">
                <UnderDevelopmentBanner/>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedProject.name}
                </DialogTitle>
                <DialogDescription className="text-base">{selectedProject.description}</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-8">
                <Card className="border-2 border-gray-200/60 dark:border-gray-800/60 shadow-lg bg-white/60 dark:bg-gray-800/60">
                  <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-gray-200/60 dark:border-gray-800/60">
                    <CardTitle>Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                        <Badge
                          className="mt-2 border-2"
                          variant={selectedProject.status === "completed" ? "default" : "secondary"}
                        >
                          {selectedProject.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</Label>
                        <div className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{selectedProject.category || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Study Goal</Label>
                        <div className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{selectedProject.study_goal || "N/A"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Hours</Label>
                        <div className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{selectedProject.estimated_hours || "N/A"} hours</div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-6">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold">{selectedProject.progress}%</span>
                      </div>
                      <Progress value={selectedProject.progress} className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200/60 dark:border-gray-800/60 shadow-lg bg-white/60 dark:bg-gray-800/60">
                  <CardHeader className="bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 border-b border-gray-200/60 dark:border-gray-800/60">
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Files associated with this project.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-blue-50/30 to-green-50/30 dark:from-blue-950/20 dark:to-green-950/20">
                      <div className="p-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-lg shadow-md">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{selectedProject.file_count} Documents</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ready for AI analysis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        )}
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