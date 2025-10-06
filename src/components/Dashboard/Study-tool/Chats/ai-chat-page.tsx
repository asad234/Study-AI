{/*
"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Send, Bot, User, FileText, MessageSquare, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  relatedFiles?: string[]
  structuredContent?: {
    introduction?: string
    elements?: Array<{ title: string; explanation: string }>
    summary?: string
    context?: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  file_count: number
  documents?: Document[]
}

interface Document {
  id: string
  title: string
  status: string
}

const parseStructuredResponse = (text: string) => {
  const result: any = {
    raw: text,
    introduction: "",
    elements: [],
    summary: "",
    context: "",
  }

  try {
    const introMatch = text.split("---")[0].match(/\[CONCEPT INTRODUCTION\](.*?)(?=\[|$)/s)
    if (introMatch && introMatch[1]) {
      result.introduction = introMatch[1].trim()
    } else {
      const parts = text.split("---")
      if (parts.length > 0) {
        result.introduction = parts[0].replace(/\[CONCEPT INTRODUCTION\]/g, "").trim()
      }
    }

    const keyElementsMatch = text.match(/\[KEY ELEMENTS\](.*?)(?=\[SUMMARY\]|---|$)/s)
    if (keyElementsMatch && keyElementsMatch[1]) {
      const elementsText = keyElementsMatch[1]
      const elementRegex = /ELEMENT \d+: ([^\n]+)\nExplanation: ([^\n]+)/g
      let match
      while ((match = elementRegex.exec(elementsText)) !== null) {
        result.elements.push({
          title: match[1].trim(),
          explanation: match[2].trim(),
        })
      }
    }

    const summaryMatch = text.match(/\[SUMMARY\](.*?)(?=\[RELATED CONTEXT\]|---|$)/s)
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1].replace(/SUMMARY:/, "").trim()
    }

    const contextMatch = text.match(/\[RELATED CONTEXT\](.*?)(?=$)/s)
    if (contextMatch && contextMatch[1]) {
      result.context = contextMatch[1].replace(/CONTEXT:/, "").trim()
    } else {
      const contextFallback = text.match(/CONTEXT: (.*?)(?=$)/s)
      if (contextFallback && contextFallback[1]) {
        result.context = contextFallback[1].trim()
      }
    }
  } catch (error) {
    console.error("Error parsing structured response:", error)
    result.introduction = text
  }

  return result
}

export default function AIChatPage() {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI study assistant. Select the projects and documents you'd like to chat about, then ask me anything!",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Project and document selection
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [documentsOpen, setDocumentsOpen] = useState(false)

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true)
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.projects)) {
            setProjects(data.projects)
          }
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [toast])

  // Update available documents when projects are selected
  useEffect(() => {
    const fetchDocuments = async () => {
      if (selectedProjects.length === 0) {
        setAvailableDocuments([])
        setSelectedDocuments([])
        return
      }

      try {
        const documentPromises = selectedProjects.map((projectId) =>
          fetch(`/api/projects/${projectId}/documents`).then((res) => res.json()),
        )
        const results = await Promise.all(documentPromises)
        const allDocs = results.flatMap((result) => result.documents || [])
        setAvailableDocuments(allDocs)
      } catch (error) {
        console.error("Failed to fetch documents:", error)
      }
    }

    fetchDocuments()
  }, [selectedProjects])

  // Toggle project selection
  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  // Toggle document selection
  const toggleDocument = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId],
    )
  }

  // Select all projects
  const toggleAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map((p) => p.id))
    }
  }

  // Select all documents
  const toggleAllDocuments = () => {
    if (selectedDocuments.length === availableDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(availableDocuments.map((d) => d.id))
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (selectedDocuments.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to chat about",
        variant: "destructive",
      })
      return
    }

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
          documentIds: selectedDocuments,
          projectIds: selectedProjects,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const structuredContent = parseStructuredResponse(data.message.content)

          const aiMessage: Message = {
            id: data.message.id,
            content: data.message.content,
            sender: "ai",
            timestamp: new Date(data.message.timestamp),
            relatedFiles: data.message.relatedFiles || [],
            structuredContent: structuredContent,
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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Study Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Select your projects and documents, then ask me anything!</p>
        </div>


        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium mb-2">Select Projects</label>
              <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto min-h-[44px] py-2 px-4 bg-transparent"
                  >
                    <span className="truncate">
                      {selectedProjects.length === 0
                        ? "Select projects..."
                        : selectedProjects.length === projects.length
                          ? "All projects selected"
                          : `${selectedProjects.length} project${selectedProjects.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-projects"
                        checked={selectedProjects.length === projects.length && projects.length > 0}
                        onCheckedChange={toggleAllProjects}
                      />
                      <label htmlFor="select-all-projects" className="text-sm font-medium cursor-pointer">
                        Select All Projects
                      </label>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {isLoadingProjects ? (
                        <div className="text-sm text-gray-500 text-center py-4">Loading projects...</div>
                      ) : projects.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">No projects available</div>
                      ) : (
                        projects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-start space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                          >
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={selectedProjects.includes(project.id)}
                              onCheckedChange={() => toggleProject(project.id)}
                            />
                            <label htmlFor={`project-${project.id}`} className="flex-1 text-sm cursor-pointer">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-xs text-gray-500">{project.file_count} documents</div>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>


            <div>
              <label className="block text-sm font-medium mb-2">Select Documents</label>
              <Popover open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto min-h-[44px] py-2 px-4 bg-transparent"
                    disabled={selectedProjects.length === 0}
                  >
                    <span className="truncate">
                      {selectedDocuments.length === 0
                        ? "Select documents..."
                        : selectedDocuments.length === availableDocuments.length
                          ? "All documents selected"
                          : `${selectedDocuments.length} document${selectedDocuments.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-documents"
                        checked={
                          selectedDocuments.length === availableDocuments.length && availableDocuments.length > 0
                        }
                        onCheckedChange={toggleAllDocuments}
                      />
                      <label htmlFor="select-all-documents" className="text-sm font-medium cursor-pointer">
                        Select All Documents
                      </label>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {availableDocuments.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {selectedProjects.length === 0 ? "Select projects first" : "No documents available"}
                        </div>
                      ) : (
                        availableDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                          >
                            <Checkbox
                              id={`document-${document.id}`}
                              checked={selectedDocuments.includes(document.id)}
                              onCheckedChange={() => toggleDocument(document.id)}
                            />
                            <label htmlFor={`document-${document.id}`} className="flex-1 text-sm cursor-pointer">
                              <div className="font-medium">{document.title}</div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {document.status}
                              </Badge>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedDocuments.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Chatting with {selectedDocuments.length} document{selectedDocuments.length > 1 ? "s" : ""} from{" "}
              {selectedProjects.length} project{selectedProjects.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        


        <Card className="h-[600px] flex flex-col border-2 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              Chat with AI
            </CardTitle>
            <CardDescription>Ask questions about your selected study materials</CardDescription>
          </CardHeader>


          <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "ai" && (
                  <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-lg border ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-300/50"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {message.sender === "ai" && message.structuredContent ? (
                    <div className="space-y-4">
                      {message.structuredContent.introduction && (
                        <div className="text-sm leading-relaxed">{message.structuredContent.introduction}</div>
                      )}

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

                      {message.structuredContent.summary && (
                        <div className="bg-green-50/30 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="font-semibold text-sm">SUMMARY:</div>
                          <div className="text-sm mt-1">{message.structuredContent.summary}</div>
                        </div>
                      )}

                      {message.structuredContent.context && (
                        <div className="text-xs opacity-80 mt-2">{message.structuredContent.context}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}

                  {message.relatedFiles && message.relatedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80 font-medium">📄 Source documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.relatedFiles.map((file, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs border bg-blue-100 dark:bg-blue-900/50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>

                {message.sender === "user" && (
                  <Avatar className="w-10 h-10 border-2 border-purple-200 dark:border-purple-800">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
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
            <div ref={messagesEndRef} />
          </CardContent>


          <div className="p-6 border-t">
            <div className="flex gap-3">
              <Input
                placeholder="Ask a question about your study materials..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border-2 rounded-xl px-4 py-3"
                disabled={selectedDocuments.length === 0}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping || selectedDocuments.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

*/}
