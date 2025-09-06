"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, ImageIcon, Presentation, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  file: File
}

// Add environment-aware file size limit
const MAX_FILE_SIZE = process.env.NODE_ENV === 'production' ? 4 * 1024 * 1024 : 50 * 1024 * 1024

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

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

  const uploadFileToServer = async (file: UploadedFile) => {
    try {
      // Update status to uploading
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f)))

      const formData = new FormData()
      formData.append("file", file.file)
      formData.append("title", file.name.split(".")[0])

      // Add timeout to prevent hanging requests on Vercel
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed (${response.status})`)
      }

      const result = await response.json()

      // Update to processing
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing", progress: 50 } : f)))

      // Simulate processing completion
      setTimeout(() => {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "completed", progress: 100 } : f)))
        toast({
          title: "File uploaded successfully!",
          description: "Your study materials are ready to use.",
        })
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error", progress: 0 } : f)))
      
      let errorMessage = "There was an error uploading your file. Please try again."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Upload timeout. Please try with a smaller file or check your connection."
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          errorMessage = "File is too large. Please use a file smaller than 2MB."
        } else if (error.message.includes('408')) {
          errorMessage = "Upload timeout. Please try again with a smaller file."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      return `File "${file.name}" is too large. Maximum size: ${maxSizeMB}MB`
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported`
    }

    return null
  }

  const handleFileUpload = (uploadedFiles: FileList) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upload files.",
        variant: "destructive",
      })
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(uploadedFiles).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    // Show validation errors
    if (errors.length > 0) {
      toast({
        title: "Some files were rejected",
        description: errors.join(". "),
        variant: "destructive",
      })
    }

    if (validFiles.length === 0) return

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
      file: file,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Start uploading each file
    newFiles.forEach((file) => {
      uploadFileToServer(file)
    })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFileUpload(droppedFiles)
      }
    },
    [session],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing with AI..."
      case "completed":
        return "Ready to study!"
      case "error":
        return "Upload failed"
      default:
        return ""
    }
  }

  const maxFileSizeMB = MAX_FILE_SIZE / (1024 * 1024)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Study Materials</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload your documents and let AI transform them into interactive learning tools
        </p>
      </div>

      {/* Supported File Types */}
      <Card>
        <CardHeader>
          <CardTitle>Supported File Types</CardTitle>
          <CardDescription>We support various document formats for optimal learning experience</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">or click to browse and select files</p>
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
            <p className="text-xs text-gray-500 mt-2">Maximum file size: {maxFileSizeMB}MB per file</p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Track the progress of your file uploads and AI processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <Badge variant={file.status === "completed" ? "default" : "secondary"}>
                        {getStatusText(file.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{Math.round(file.progress)}%</span>
                  </div>

                  <Progress value={file.progress} className="h-1" />
                </div>

                <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {files.some((f) => f.status === "completed") && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">Files Ready!</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Your materials have been processed. Start studying now!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/dashboard/cards">Study Flashcards</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard/quiz">Take a Quiz</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard/chat">Ask AI Questions</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}