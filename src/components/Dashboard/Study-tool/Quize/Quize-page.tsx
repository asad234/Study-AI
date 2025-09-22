"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FolderPlus,
  FileText,
  ArrowRight,
  X,
  Presentation,
  ImageIcon,
  File,
  Trash2,
  Sparkles,
  Plus,
  HelpCircle,
  CalendarIcon,
  Upload,
  Loader2,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import UnderDevelopmentBanner from "@/components/common/underDevelopment"

import ManualFlashCardCreator from "../Cards/Manual/ManualFlashCardCreator"
import PreviewCards from "../Cards/Previews/PreviewCards"
import PreviewQuizzes from "./Preview/previewQuizes"
import ManualQuizCreator from "./Manual/ManualQuizeCreator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns";
import { useRouter } from "next/navigation";



interface Project {
  id: string
  name: string
  description: string
  progress: number
  status: string
  file_count: number
  category?: string
  study_goal?: string
  target_date?: string
  estimated_hours?: number
  documents?: Document[]
}

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  file_size?: number
  status: string
  createdAt: string
}

export default function QuizProjectsPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loadingProject, setLoadingProject] = useState(false)
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set())
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set())
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isQuizGeneratorOpen, setIsQuizGeneratorOpen] = useState(false)
  const [quizGenerationProject, setQuizGenerationProject] = useState<Project | null>(null)
  const [quizDifficulty, setQuizDifficulty] = useState("medium")
  const [questionCount, setQuestionCount] = useState("10")
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)

  const router = useRouter()


  const fetchProjects = async () => {
    if (status !== "authenticated") return

    try {
      const response = await fetch("/api/projects")
      const data = await response.json()

      console.log("Projects API response:", data)

      if (data.success) {
        data.projects.forEach((project: any, index: number) => {
          console.log(`Project ${index}:`, {
            id: project.id,
            name: project.name,
            documents: project.documents,
            documentsLength: project.documents?.length || 0,
            file_count: project.file_count,
          })
        })
        setProjects(data.projects)
      } else {
        console.error("Failed to fetch projects:", data.error)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
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

  const handleFileUpload = (filesList: FileList) => {
    const newFiles = Array.from(filesList)
    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !files.some((existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size),
    )
    setFiles((prev) => [...prev, ...uniqueFiles])
  }

  const handleCreateProjectForm = async () => {
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
        setSelectedProject(null)

        fetchProjects()
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

  const handleProjectFileUpload = (filesList: FileList) => {
    console.log("Project file upload triggered with files:", filesList.length)
    const newFiles = Array.from(filesList)
    console.log(
      "New files:",
      newFiles.map((f) => ({ name: f.name, size: f.size })),
    )

    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !projectFiles.some((existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size),
    )
    console.log("Unique files after filtering:", uniqueFiles.length)

    setProjectFiles((prev) => {
      const updated = [...prev, ...uniqueFiles]
      console.log("Updated projectFiles state:", updated.length)
      return updated
    })
  }

  const uploadFilesToProject = async (projectId: string) => {
    console.log("Starting upload for project:", projectId, "with files:", projectFiles.length)

    if (projectFiles.length === 0) {
      console.log("No files to upload")
      return
    }

    setUploadingFiles(true)
    try {
      const documentIds: string[] = []

      console.log("Uploading files to server...")
      for (const file of projectFiles) {
        console.log("Uploading file:", file.name)
        const documentId = await uploadFileToServer(file)
        if (documentId) {
          console.log("File uploaded successfully, document ID:", documentId)
          documentIds.push(documentId)
        } else {
          console.error("Failed to upload file:", file.name)
        }
      }

      console.log("All files processed. Document IDs:", documentIds)

      if (documentIds.length === 0) {
        console.error("No documents were uploaded successfully")
        toast({
          title: "Error",
          description: "Failed to upload any files",
          variant: "destructive",
        })
        return
      }

      console.log("Calling project update API for project:", projectId)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_ids: documentIds,
        }),
      })

      console.log("Project update API response status:", response.status)
      const data = await response.json()
      console.log("Project update API response data:", data)

      if (data.success) {
        console.log("Project updated successfully, refreshing projects...")
        toast({
          title: "Success!",
          description: `${projectFiles.length} file(s) uploaded successfully`,
        })
        setProjectFiles([])

        // Refresh projects list
        await fetchProjects()
        console.log("Projects refreshed")

        // Update selected project with fresh data
        if (selectedProject) {
          console.log("Looking for updated project data for ID:", selectedProject.id)
          const updatedProject = projects.find((p) => p.id === selectedProject.id)
          if (updatedProject) {
            console.log("Found updated project:", updatedProject)
            console.log("Updated project file count:", updatedProject.file_count)
            setSelectedProject(updatedProject)
          } else {
            console.log("Could not find updated project in projects list")
          }
        }
      } else {
        console.error("Project update failed:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to associate files with project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in uploadFilesToProject:", error)
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeProjectFile = (index: number) => {
    setProjectFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const deleteDocument = async (documentId: string) => {
    if (!selectedProject) return

    setDeletingDocuments((prev) => new Set(prev).add(documentId))

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success!",
          description: "Document deleted successfully",
        })

        const updatedDocuments = (selectedProject.documents || []).filter(
          (doc: any) => doc.id !== Number.parseInt(documentId),
        )

        const updatedSelectedProject = {
          ...selectedProject,
          documents: updatedDocuments,
          file_count: updatedDocuments.length,
        }

        setSelectedProject(updatedSelectedProject)

        setProjects((prevProjects) =>
          prevProjects.map((project) => (project.id === selectedProject.id ? updatedSelectedProject : project)),
        )

        // Refresh projects in background to sync with server
        fetchProjects()
      } else {
        throw new Error(data.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDeletingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const deleteProject = async (projectId: string) => {
    console.log("Delete project called with ID:", projectId)
    setDeletingProjects((prev) => new Set(prev).add(projectId))

    try {
      console.log("Making DELETE request to:", `/api/projects/${projectId}`)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      console.log("Delete response status:", response.status)
      const data = await response.json()
      console.log("Delete response data:", data)

      if (data.success) {
        toast({
          title: "Success!",
          description: "Project deleted successfully",
        })

        // Refresh projects list
        await fetchProjects()

        // Close project detail modal if the deleted project was selected
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null)
        }
      } else {
        throw new Error(data.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setDeletingProjects((prev) => {
        const newSet = new Set(prev)
        newSet.delete(projectId)
        return newSet
      })
      setProjectToDelete(null)
      setDeleteConfirmationText("")
    }
  }

  const handleGenerateAIQuiz = (project: Project) => {
    setQuizGenerationProject(project)
    setIsQuizGeneratorOpen(true)
  }

  const generateQuiz = async () => {
    if (!quizGenerationProject) return

    setIsGeneratingQuiz(true)
    
    try {
      // Simulate quiz generation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Store quiz parameters in sessionStorage for the quiz generator page
      const quizParams = {
        projectId: quizGenerationProject.id,
        projectName: quizGenerationProject.name,
        difficulty: quizDifficulty,
        questionCount: parseInt(questionCount),
        documents: quizGenerationProject.documents || []
      }
      
      sessionStorage.setItem('quizGenerationParams', JSON.stringify(quizParams))
      
      toast({
        title: "Quiz Generation Started!",
        description: "Redirecting to quiz generator...",
      })
      
      // Redirect to quiz generator page
      router.push('/dashboard/quiz/quiz-generator')
      
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuiz(false)
      setIsQuizGeneratorOpen(false)
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

  const formatUploadTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [studyGoal, setStudyGoal] = useState("")
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [estimatedHours, setEstimatedHours] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  if (status === "loading" || loading) {
    return <div className="text-center py-12 text-gray-500">Loading projects...</div>
  }

  if (status === "unauthenticated") {
    return <div className="text-center py-12 text-gray-500">Please sign in to view your projects.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <UnderDevelopmentBanner/>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Quiz Projects</h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage all of your study quiz projects in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <PreviewQuizzes 
            className="bg-purple-700 text-white"
            />
            <ManualQuizCreator/>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === "completed" ? "default" : "secondary"}>{project.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProjectToDelete(project)}
                      disabled={deletingProjects.has(project.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete project"
                    >
                      {deletingProjects.has(project.id) ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{project.description}</CardDescription>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <FileText className="h-4 w-4" />
                    <span>{project.file_count} Documents</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <Button
                    variant="outline"
                    className="mt-6 w-full gap-2 bg-transparent"
                    onClick={() => setSelectedProject(project)}
                  >
                    View Project <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-6 w-full gap-2 bg-transparent hover:bg-green-400 hover:text-white"
                    onClick={() => handleGenerateAIQuiz(project)}
                  >
                    Generate AI Quizzes
                    <HelpCircle className="w-4 h-4 mr-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* AI Quiz Generation Dialog */}
      <Dialog open={isQuizGeneratorOpen} onOpenChange={setIsQuizGeneratorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Generate AI Quiz
            </DialogTitle>
            <DialogDescription>
              Create a personalized quiz from your project materials: {quizGenerationProject?.name}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Quiz will be generated from your project documents
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {quizGenerationProject?.file_count || 0} documents • AI will analyze content to create relevant questions
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={generateQuiz} 
                disabled={isGeneratingQuiz} 
                className="w-full"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {selectedProject && (
        <Dialog
          open={!!selectedProject}
          onOpenChange={() => {
            setSelectedProject(null)
            setFiles([])
          }}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
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
                  <div className="space-y-4">
                    {projectFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Files Ready to Upload ({projectFiles.length})</h4>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setProjectFiles([])} className="text-xs">
                              Clear All
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => uploadFilesToProject(selectedProject.id)}
                              disabled={uploadingFiles}
                              className="text-xs"
                            >
                              {uploadingFiles ? "Uploading..." : "Upload Files"}
                            </Button>
                          </div>
                        </div>
                        {projectFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20"
                          >
                            <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Ready
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProjectFile(index)}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProject.documents && selectedProject.documents.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">
                          Uploaded Documents ({selectedProject.documents?.length || 0})
                        </h4>
                        {selectedProject.documents?.map((doc: Document, index: number) => (
                          <div
                            key={doc.id || index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{doc.title || doc.file_name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.createdAt ? formatUploadTime(doc.createdAt) : "Recently uploaded"}
                                  {doc.file_size && ` • ${formatFileSize(doc.file_size)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.status === "ready" ? "default" : "secondary"}>{doc.status}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteDocument(doc.id)}
                                disabled={deletingDocuments.has(doc.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Delete document"
                              >
                                {deletingDocuments.has(doc.id) ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No documents in this project yet.</p>
                        <p className="text-sm">Upload files to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {projectToDelete && (
        <Dialog
          open={!!projectToDelete}
          onOpenChange={() => {
            setProjectToDelete(null)
            setDeleteConfirmationText("")
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Project</DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete "{projectToDelete.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">This action cannot be undone</h4>
                    <p className="text-sm text-red-700">
                      This will permanently delete all data associated with this project, including:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                      <li>All uploaded documents ({projectToDelete.file_count} files)</li>
                      <li>Project settings and progress</li>
                      <li>Generated quizzes and questions</li>
                      <li>Chat history and AI interactions</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Type the project name <strong>"{projectToDelete.name}"</strong> to confirm deletion:
              </p>
              <Input
                className="mt-2"
                placeholder={`Type "${projectToDelete.name}" to confirm`}
                value={deleteConfirmationText}
                onChange={(e) => {
                  console.log("Confirmation text changed:", e.target.value)
                  setDeleteConfirmationText(e.target.value)
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setProjectToDelete(null)
                  setDeleteConfirmationText("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log("Delete button clicked for project:", projectToDelete.name)
                  deleteProject(projectToDelete.id)
                }}
                disabled={deleteConfirmationText !== projectToDelete.name}
              >
                Delete Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Project</DialogTitle>
                          <DialogDescription>
                            Organize your study materials, set goals, and unlock powerful AI study tools.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="p-4 space-y-6">
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
                                    <Calendar mode="single" 
                                    selected={targetDate} onSelect={setTargetDate} initialFocus />
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
            
                          <Card>
                            <CardHeader>
                              <CardTitle>File Upload</CardTitle>
                              <CardDescription>Upload your documents to create your project materials.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
            
                              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors`}>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Drop your files here</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                  or click to browse and select multiple files
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleFileUpload(e.target.files)
                                    }
                                  }}
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
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(index)}
                                        className="flex-shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
            
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateProjectForm} disabled={loadingProject}>
                              {loadingProject ? "Creating..." : "Create Project"}
                            </Button>
                          </div>
                        </div>
              </DialogContent>
      </Dialog>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
          <FolderPlus className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">You don't have any projects yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first project to get started!</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6 gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Project
          </Button>
        </div>
        ):("")}
    </div>
  )
}