"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BookOpen, FileText, MessageSquare, Brain, Plus, TrendingUp, Award, FolderPlus, Calendar as CalendarIcon, Upload, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function CreateProjectPage() {
  // State for the new project form
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [studyGoal, setStudyGoal] = useState("")
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [estimatedHours, setEstimatedHours] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [loadingProject, setLoadingProject] = useState(false)

  // Handlers for form logic
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const handleCreateProject = async () => {
    // Add validation and API call logic here
    console.log("Creating project with:", { projectName, description, category, studyGoal, targetDate, estimatedHours, files })
    setLoadingProject(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoadingProject(false)
    // Redirect to dashboard or success page on success
    // Example: window.location.href = '/dashboard';
  }

  const handleBack = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" className="text-gray-600 dark:text-gray-400" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="text-gray-600 dark:text-gray-300">Organize your study materials, set goals, and unlock powerful AI study tools.</p>
        </div>
      </div>
      <div className="p-4 space-y-6">
        {/* Project Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Tell us a little about your new study project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name <span className="text-red-500">*</span></Label>
              <Input id="projectName" placeholder="e.g., Biology Midterm Prep" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A brief description of your project." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
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
                  <SelectItem value="Exam Preparation">Exam Preparation</SelectItem>
                  <SelectItem value="Course Completion">Course Completion</SelectItem>
                  <SelectItem value="General Knowledge">General Knowledge</SelectItem>
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
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="estimatedHours">Estimated Study Hours</Label>
              <Input id="estimatedHours" type="number" placeholder="e.g., 20" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">AI-powered tools you'll get:</h4>
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
          <CardContent className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag and drop files here, or <span className="font-medium text-primary">click to browse</span></p>
              <Input type="file" multiple className="sr-only" onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            </div>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleBack}>Cancel</Button>
          <Button onClick={handleCreateProject} disabled={loadingProject}>
            {loadingProject ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  )
}
