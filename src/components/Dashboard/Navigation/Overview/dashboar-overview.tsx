"use client"

import type React from "react"
import { fetchRecentFiles } from "@/utilities/fetchRecentFiles"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  FileText,
  MessageSquare,
  Brain,
  Upload,
  TrendingUp,
  Award,
  Plus,
  FolderPlus,
  CalendarIcon,
  Presentation,
  ImageIcon,
  File,
  X,
  MessageCircle,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  status: string
  createdAt: string
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  bio?: string
  location?: string
}

// Feedback Dialog Component
const FeedbackDialog = () => {
  const [formData, setFormData] = useState({
    helpfulness: "",
    improvement: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  const options = ["Very helpful", "Helpful", "Neutral", "Not helpful"]

  const handleSubmit = async () => {
    if (!formData.helpfulness) {
      alert("Please select an option before submitting.")
      return
    }

    setIsSubmitting(true)
    setStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus({
          type: "success",
          message: "Thank you! Your feedback has been submitted.",
        })
        setFormData({ helpfulness: "", improvement: "" })
      } else {
        setStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again.",
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Quick Feedback</DialogTitle>
        <DialogDescription>
          Help us improve Study AI by sharing your experience
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 pt-4">
        {status.type && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-2 block">
            How helpful was Study AI in preparing for your exam/project?
          </Label>
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="helpfulness"
                  value={option}
                  checked={formData.helpfulness === option}
                  onChange={() => setFormData((prev) => ({ ...prev, helpfulness: option }))}
                  disabled={isSubmitting}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="improvement" className="text-sm font-medium mb-2 block">
            What's one thing we can improve?
          </Label>
          <Textarea
            id="improvement"
            value={formData.improvement}
            onChange={(e) => setFormData((prev) => ({ ...prev, improvement: e.target.value }))}
            placeholder="Your suggestion..."
            disabled={isSubmitting}
            className="h-24 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

// Invitations Dialog Component
const InvitationsDialog = () => {
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInvitationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInvitationForm({ ...invitationForm, [name]: value })
  }

  const sendInvitation = async () => {
    setIsSubmitting(true)
    try {
      // Your existing invitation logic here
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitationForm),
      })
      
      if (response.ok) {
        setInvitationForm({ email: "", firstName: "", lastName: "" })
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Send Invitation</DialogTitle>
        <DialogDescription>
          Invite friends and colleagues to join Study AI
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div>
          <Label htmlFor="email" className="text-sm font-medium mb-1 block">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={invitationForm.email}
            onChange={handleInvitationChange}
            placeholder="Enter email"
            required
          />
        </div>
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium mb-1 block">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            name="firstName"
            value={invitationForm.firstName}
            onChange={handleInvitationChange}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-sm font-medium mb-1 block">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            name="lastName"
            value={invitationForm.lastName}
            onChange={handleInvitationChange}
            placeholder="Enter last name"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={sendInvitation}
            disabled={!invitationForm.email.trim() || isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export default function DashboardPage() {
  const [recentFiles, setRecentFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { data: session } = useSession()
  const { toast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [studyGoal, setStudyGoal] = useState("")
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [estimatedHours, setEstimatedHours] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [loadingProject, setLoadingProject] = useState(false)
  const [message, setMessage] = useState<{
    title: string
    description: string
    variant?: "destructive" | "default"
  } | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const profile = await response.json()
          setUserProfile(profile)
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      }
    }

    fetchRecentFiles(setRecentFiles, setLoading, session?.user?.email)
    fetchUserProfile()
  }, [session])

  const formatUploadTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  const studyStats = [
    { label: "Cards Studied", value: 156, change: "+12%" },
    { label: "Quizzes Completed", value: 23, change: "+8%" },
    { label: "Study Streak", value: 7, change: "days" },
    { label: "Average Score", value: 87, change: "+5%" },
  ]

  const getWelcomeMessage = () => {
    if (userProfile?.firstName) {
      return `Welcome back, ${userProfile.firstName}!`
    }
    return "Welcome back, Student!"
  }

  const uploadFileToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", file.name.split(".")[0])

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.document) {
        return data.document.id
      }
      return null
    } catch (error) {
      console.error("Upload error:", error)
      return null
    }
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      })
      return
    }

    setLoadingProject(true)

    try {
      const documentIds: string[] = []

      if (files.length > 0) {
        for (const file of files) {
          const documentId = await uploadFileToServer(file)
          if (documentId) {
            documentIds.push(documentId)
          }
        }
      }

      const projectData = {
        name: projectName,
        description: description || undefined,
        category: category || undefined,
        study_goal: studyGoal || undefined,
        target_date: targetDate?.toISOString() || undefined,
        estimated_hours: estimatedHours ? Number.parseInt(estimatedHours) : undefined,
        document_ids: documentIds,
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success!",
          description: "Project created successfully",
        })

        setProjectName("")
        setDescription("")
        setCategory("")
        setStudyGoal("")
        setTargetDate(undefined)
        setEstimatedHours("")
        setFiles([])
        setIsModalOpen(false)
      } else {
        throw new Error(data.error || "Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setLoadingProject(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />
    if (type.includes("word") || type.includes("document")) return <FileText className="w-6 h-6 text-blue-500" />
    if (type.includes("presentation") || type.includes("powerpoint"))
      return <Presentation className="w-6 h-6 text-orange-500" />
    if (type.includes("image")) return <ImageIcon className="w-6 h-6 text-green-500" />
    return <File className="w-6 h-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileUpload = (filesList: FileList) => {
    const newFiles = Array.from(filesList)
    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !files.some((existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size),
    )
    setFiles((prev) => [...prev, ...uniqueFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getWelcomeMessage()}</h1>
            <p className="text-gray-600 dark:text-gray-300">Ready to continue your learning journey?</p>
          </div>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              <FolderPlus className="h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
        </div>

        {/* Study Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/flash-cards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Flashcards</CardTitle>
                <CardDescription>Study with AI-generated flashcards</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/quiz">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Quiz Generator</CardTitle>
                <CardDescription>Test your knowledge with custom quizzes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/chat">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">AI Chat</CardTitle>
                <CardDescription>Ask questions about your materials</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/exam">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Exam Simulator</CardTitle>
                <CardDescription>Practice with realistic exam conditions</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Feedback and Invitations as Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Feedback Card with Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-lg">Quick Feedback</CardTitle>
                  <CardDescription>Share your experience with us</CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <FeedbackDialog />
          </Dialog>

          {/* Send Invitations Card with Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle className="text-lg">Send Invitations</CardTitle>
                  <CardDescription>Invite friends to join Study AI</CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <InvitationsDialog />
          </Dialog>
        </div>
      </div>

      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Organize your study materials, set goals, and unlock powerful AI study tools.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-6">
          {/* Project Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Tell us a little about your new study project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Biology Midterm Prep"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of your project."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="literature">Literature</SelectItem>
                    <SelectItem value="computer_science">Computer Science</SelectItem>
                    <SelectItem value="languages">Languages</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal">Study Goal</Label>
                <Select value={studyGoal} onValueChange={setStudyGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a study goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam_preparation">Exam Preparation</SelectItem>
                    <SelectItem value="course_completion">Course Completion</SelectItem>
                    <SelectItem value="general_knowledge">General Knowledge</SelectItem>
                    <SelectItem value="skill_development">Skill Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Goals Section */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline & Goals</CardTitle>
              <CardDescription>Set a target and track your progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetDate">Target Completion Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !targetDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="estimatedHours">Estimated Study Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="e.g., 20"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI-powered tools you&apos;ll get:</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Flashcards</Badge>
                  <Badge variant="secondary">Quizzes</Badge>
                  <Badge variant="secondary">AI Chat</Badge>
                  <Badge variant="secondary">Exam Simulator</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>Upload your documents to create your project materials.</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <div
                  className={`p-3 rounded-lg mb-4 text-sm ${message.variant === "destructive" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                >
                  <p className="font-medium">{message.title}</p>
                  <p>{message.description}</p>
                </div>
              )}

              {/* Supported File Types */}
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium">Supported File Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <FileText className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">PDF</p>
                      <p className="text-xs text-gray-500">Documents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">DOCX</p>
                      <p className="text-xs text-gray-500">Word Documents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Presentation className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="font-medium text-sm">PPTX</p>
                      <p className="text-xs text-gray-500">Presentations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <ImageIcon className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Images</p>
                      <p className="text-xs text-gray-500">JPG, PNG, etc.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Drop your files here</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">or click to browse and select multiple files</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span className="cursor-pointer">Browse Files</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 50MB per file • Select multiple files at once
                </p>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                    <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-xs">
                      Clear All
                    </Button>
                  </div>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="flex-shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={loadingProject}>
              {loadingProject ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}