"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  ChevronDown,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import FlashcardsStudy from "./flashcards-study"
import ManualFlashCardCreator from "./Manual/ManualFlashCardCreator"
import PreviewCards from "./Previews/PreviewCards"
import UnderDevelopmentBanner from "@/components/common/underDevelopment"
//import { FixDocumentsButton } from "./FixDocumentsButton"
import { FlashcardGenerationDialog } from "./FlashcardGenerationDialog"

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

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
  const [generatingFlashcards, setGeneratingFlashcards] = useState<Set<string>>(new Set())

  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([])
  const [showFlashcardsStudy, setShowFlashcardsStudy] = useState(false)

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [documentDropdownOpen, setDocumentDropdownOpen] = useState(false)

  const [showGenerationDialog, setShowGenerationDialog] = useState(false)
  const [generationStage, setGenerationStage] = useState<"extracting" | "generating" | "complete">("extracting")

  const [currentProjectInfo, setCurrentProjectInfo] = useState<{
  name: string
  id: string
} | null>(null)


  const availableDocuments = useMemo(() => {
    if (selectedProjectIds.length === 0) return []

    const docs: Array<Document & { projectName: string }> = []
    projects.forEach((project) => {
      if (selectedProjectIds.includes(project.id) && project.documents) {
        project.documents.forEach((doc) => {
          docs.push({ ...doc, projectName: project.name })
        })
      }
    })
    return docs
  }, [projects, selectedProjectIds])

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId)
      }
      return [...prev, projectId]
    })
    // Clear document selection when projects change
    setSelectedDocumentIds([])
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocumentIds((prev) => {
      if (prev.includes(documentId)) {
        return prev.filter((id) => id !== documentId)
      }
      return [...prev, documentId]
    })
  }

  const toggleAllProjects = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([])
      setSelectedDocumentIds([])
    } else {
      setSelectedProjectIds(projects.map((p) => p.id))
    }
  }

  const toggleAllDocuments = () => {
    if (selectedDocumentIds.length === availableDocuments.length) {
      setSelectedDocumentIds([])
    } else {
      setSelectedDocumentIds(availableDocuments.map((d) => d.id))
    }
  }

  // Update your generateFlashcardsFromSelection function in ProjectsPage

  const generateFlashcardsFromSelection = async () => {
  if (selectedDocumentIds.length === 0) {
    toast({
      title: "No Documents Selected",
      description: "Please select at least one document to generate flashcards.",
      variant: "destructive",
    })
    return
  }

  const generationId = "bulk-generation"
  setGeneratingFlashcards(prev => new Set(prev).add(generationId))
  
  setShowGenerationDialog(true)
  setGenerationStage("extracting")

  const handleManualFlashcardsCreated = (flashcards: any[], projectInfo: { name: string; id: string }) => {
  console.log("✨ Manual flashcards created, showing study view...");
  console.log("Flashcards:", flashcards.length);
  console.log("Project info:", projectInfo);
  
  // Set the project info
  setCurrentProjectInfo(projectInfo);
  
  // Set the flashcards
  setGeneratedFlashcards(flashcards);
  
  // Show the study view
  setShowFlashcardsStudy(true);
};

 try {
    console.log("🚀 Starting flashcard generation for documents:", selectedDocumentIds)

    // STEP 1: Extract text from selected documents first
    console.log("📝 Step 1: Ensuring documents have extracted text...")
    
    const extractResponse = await fetch("/api/documents/extract-selected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentIds: selectedDocumentIds }),
    })

    const extractData = await extractResponse.json()
    console.log("📝 Extraction result:", extractData)

    if (extractData.success) {
      if (extractData.results.triggered > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      if (extractData.results.alreadyExtracted > 0) {
        console.log(`✅ ${extractData.results.alreadyExtracted} document(s) already have content`)
      }

      if (extractData.results.failed.length > 0) {
        console.warn("⚠️ Some documents failed extraction:", extractData.results.failed)
      }
    }

    // STEP 2: Generate flashcards
    console.log("🤖 Step 2: Generating flashcards...")
    setGenerationStage("generating")

    const requestBody = {
      subject: "Mixed",
      documentIds: selectedDocumentIds,
      projectIds: selectedProjectIds,
    }
    console.log("📤 Flashcard request:", requestBody)

    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    console.log("📥 Response status:", response.status)
    const data = await response.json()
    console.log("📥 Response data:", data)

    setShowGenerationDialog(false)
    setGenerationStage("complete")

    if (data.success && Array.isArray(data.flashcards)) {
      console.log("✅ Successfully generated flashcards:", data.flashcards.length)
      
      toast({
        title: "Success! 🎉",
        description: data.message,
      })

      // Show warning if some documents failed
      if (data.metadata?.failedDocuments > 0 && data.metadata?.failedDetails) {
        console.warn("⚠️ Some documents failed:", data.metadata.failedDetails)
        
        setTimeout(() => {
          toast({
            title: "Partial Success",
            description: `${data.metadata.failedDocuments} document(s) could not be processed. Check console for details.`,
            variant: "default",
          })
        }, 1000)
      }

      // ✨ NEW: Store project info for the study session
      if (selectedProjectIds.length === 1) {
        const selectedProject = projects.find(p => p.id === selectedProjectIds[0])
        if (selectedProject) {
          setCurrentProjectInfo({
            name: selectedProject.name,
            id: selectedProject.id
          })
        }
      } else if (selectedProjectIds.length > 1) {
        const projectNames = projects
          .filter(p => selectedProjectIds.includes(p.id))
          .map(p => p.name)
          .join(', ')
        
        setCurrentProjectInfo({
          name: projectNames || `${selectedProjectIds.length} Projects`,
          id: selectedProjectIds.join(',')
        })
      }

      setGeneratedFlashcards(data.flashcards)
      setShowFlashcardsStudy(true)
    } else {
      console.error("❌ Failed to generate flashcards:", data)
      
      let errorDescription = data.error || "Failed to generate flashcards"
      
      if (data.failedDocuments && data.failedDocuments.length > 0) {
        errorDescription += `\n\nFailed documents:`
        data.failedDocuments.forEach((doc: any) => {
          errorDescription += `\n- ${doc.id}: ${doc.reason}`
          if (doc.details) {
            errorDescription += ` (${doc.details})`
          }
        })
      }
      
      toast({
        title: "Generation Failed",
        description: errorDescription,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("❌ Failed to generate flashcards:", error)
    setShowGenerationDialog(false)
    
    toast({
      title: "Error",
      description: "Failed to generate flashcards. Please try again.",
      variant: "destructive",
    })
  } finally {
    setGeneratingFlashcards(prev => {
      const newSet = new Set(prev)
      newSet.delete(generationId)
      return newSet
    })
  }
}


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

  const generateFlashcardsForProject = async (project: Project) => {
    if (!project.documents || project.documents.length === 0) {
      toast({
        title: "No Documents",
        description: "This project has no documents to generate flashcards from.",
        variant: "destructive",
      })
      return
    }

    const readyDocuments = project.documents.filter((doc: Document) => doc.status === "ready")

    if (readyDocuments.length === 0) {
      toast({
        title: "No Ready Documents",
        description: "This project has no ready documents to generate flashcards from.",
        variant: "destructive",
      })
      return
    }

    setGeneratingFlashcards(prev => new Set(prev).add(project.id))

    try {
      console.log("Starting flashcard generation for project:", project.name)
      console.log("Ready documents:", readyDocuments)
      console.log("Using document ID:", readyDocuments[0].id)

      const requestBody = {
        subject: project.category || "Mixed",
        documentId: readyDocuments[0].id,
        projectId: project.id,
      }
      console.log("Request body:", requestBody)

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success && Array.isArray(data.flashcards)) {
        console.log("Successfully generated flashcards:", data.flashcards.length)
        toast({
          title: "Success!",
          description: `Generated ${data.flashcards.length} flashcards from ${project.name}`,
        })
        router.push("/dashboard/flash-cards-cards")
      } else {
        console.error("Failed to generate flashcards:", data.error)
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate flashcards",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate flashcards:", error)
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingFlashcards(prev => {
        const newSet = new Set(prev)
        newSet.delete(project.id)
        return newSet
      })
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

  if (showFlashcardsStudy && generatedFlashcards.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <FlashcardsStudy
            flashcards={generatedFlashcards}
            onBack={() => {
              setShowFlashcardsStudy(false)
              setGeneratedFlashcards([])
              setCurrentProjectInfo(null)  // ✨ Clear project info
            }}
            projectName={currentProjectInfo?.name}  // ✨ Pass project name
            projectId={currentProjectInfo?.id}      // ✨ Pass project ID
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage all of your study flashcard projects in one place.
            </p>
          </div>
          <div className="flex gap-3">
            {/*<FixDocumentsButton onComplete={fetchProjects} />*/}
            <PreviewCards className="bg-white border-black text-black hover:bg-blue-200" />
            <ManualFlashCardCreator />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="backdrop-blur-sm border-white dark:border-gray-950">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Start a Flashcard Session</CardTitle>
            <CardDescription className="text-base">
              Every session targets your weak spots, turning them into strengths.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Projects</Label>
              <div className="relative">
                <button
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    {selectedProjectIds.length === 0
                      ? "Select projects"
                      : selectedProjectIds.length === projects.length
                        ? "All projects selected"
                        : `${selectedProjectIds.length} project(s) selected`}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${projectDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {projectDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-projects"
                          checked={selectedProjectIds.length === projects.length && projects.length > 0}
                          onCheckedChange={toggleAllProjects}
                        />
                        <label htmlFor="select-all-projects" className="text-sm font-medium cursor-pointer">
                          Select All
                        </label>
                      </div>
                    </div>
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjectIds.includes(project.id)}
                            onCheckedChange={() => toggleProjectSelection(project.id)}
                          />
                          <label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {project.file_count} document(s)
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {project.category || "General"}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Document Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Documents</Label>
              <div className="relative">
                <button
                  onClick={() => setDocumentDropdownOpen(!documentDropdownOpen)}
                  disabled={selectedProjectIds.length === 0}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    {selectedProjectIds.length === 0
                      ? "Select projects first"
                      : selectedDocumentIds.length === 0
                        ? "Select documents"
                        : selectedDocumentIds.length === availableDocuments.length
                          ? "All documents selected"
                          : `${selectedDocumentIds.length} document(s) selected`}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${documentDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {documentDropdownOpen && availableDocuments.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-documents"
                          checked={
                            selectedDocumentIds.length === availableDocuments.length && availableDocuments.length > 0
                          }
                          onCheckedChange={toggleAllDocuments}
                        />
                        <label htmlFor="select-all-documents" className="text-sm font-medium cursor-pointer">
                          Select All
                        </label>
                      </div>
                    </div>
                    {availableDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`document-${doc.id}`}
                            checked={selectedDocumentIds.includes(doc.id)}
                            onCheckedChange={() => toggleDocumentSelection(doc.id)}
                          />
                          <label htmlFor={`document-${doc.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {doc.title || doc.file_name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{doc.projectName}</p>
                                </div>
                              </div>
                              <Badge variant={doc.status === "ready" ? "default" : "secondary"} className="text-xs">
                                {doc.status}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Flashcard Count Info */}
            {selectedDocumentIds.length > 0 && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your session will contain flashcards from{" "}
                  <span className="font-bold text-gray-900 dark:text-white">{selectedDocumentIds.length}</span>{" "}
                  document(s)
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateFlashcardsFromSelection}
              disabled={selectedDocumentIds.length === 0 || generatingFlashcards.size > 0}
              className="w-full h-12 text-base font-semibold bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {generatingFlashcards.size > 0 ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Flashcards
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
      {/* The loading dialog */}
    <FlashcardGenerationDialog
      open={showGenerationDialog}
      documentCount={selectedDocumentIds.length}
      stage={generationStage}
    />
    </div>
  )
}