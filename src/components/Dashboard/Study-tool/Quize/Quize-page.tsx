"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, ChevronDown, FolderOpen, FileText, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import UnderDevelopmentBanner from "@/components/common/underDevelopment"
import PreviewQuizzes from "./Preview/previewQuizes"
import ManualQuizCreator from "./Manual/ManualQuizeCreator"
import QuizStudy from "./quize-study"
import { QuizGenerationDialog } from "./QuizGenerationDialog"
interface Project {
  id: string
  name: string
  description?: string
  documents?: Document[]
}

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
}

export default function QuizProjectsPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [questionCount, setQuestionCount] = useState("20")
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([])
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizId, setQuizId] = useState<string>("")

  const [showGenerationDialog, setShowGenerationDialog] = useState(false)
  const [generationStage, setGenerationStage] = useState<"extracting" | "generating" | "complete">("extracting")


  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjects.length === 0) {
      setAvailableDocuments([])
      setSelectedDocuments([])
      return
    }

    const docs: Document[] = []
    selectedProjects.forEach((projectId) => {
      const project = projects.find((p) => p.id === projectId)
      if (project?.documents) {
        docs.push(...project.documents)
      }
    })

    setAvailableDocuments(docs)
    setSelectedDocuments([])
  }, [selectedProjects, projects])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProjects(data.projects)
        } else {
          setProjects(getSampleProjects())
        }
      } else {
        setProjects(getSampleProjects())
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      setProjects(getSampleProjects())
    } finally {
      setLoading(false)
    }
  }

  const getSampleProjects = (): Project[] => [
    {
      id: "1",
      name: "Biology Study Guide",
      description: "Comprehensive biology materials",
      documents: [
        { id: "1", title: "Cell Biology Notes", file_name: "cell-biology.pdf", file_type: "pdf" },
        { id: "2", title: "Genetics Overview", file_name: "genetics.docx", file_type: "docx" },
      ],
    },
    {
      id: "2",
      name: "Mathematics Review",
      description: "Calculus and algebra materials",
      documents: [{ id: "3", title: "Calculus Formulas", file_name: "calculus.pdf", file_type: "pdf" }],
    },
  ]

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects((prev) => [...prev, projectId])
    } else {
      setSelectedProjects((prev) => prev.filter((id) => id !== projectId))
    }
  }

  const handleAllProjectsSelection = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(projects.map((p) => p.id))
    } else {
      setSelectedProjects([])
    }
  }

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, documentId])
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== documentId))
    }
  }

  const handleAllDocumentsSelection = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(availableDocuments.map((d) => d.id))
    } else {
      setSelectedDocuments([])
    }
  }

  const handleDifficultySelection = (difficulty: string, checked: boolean) => {
    if (difficulty === "mix") {
      if (checked) {
        setSelectedDifficulties(["easy", "medium", "hard"])
      } else {
        setSelectedDifficulties([])
      }
    } else {
      if (checked) {
        setSelectedDifficulties((prev) => [...prev, difficulty])
      } else {
        setSelectedDifficulties((prev) => prev.filter((d) => d !== difficulty))
      }
    }
  }

  const generateQuiz = async () => {
  if (selectedDocuments.length === 0 || selectedDifficulties.length === 0) {
    toast({
      title: "Missing selections",
      description: "Please select documents and difficulty levels",
      variant: "destructive",
    })
    return
  }

  setIsGeneratingQuiz(true)
  setShowGenerationDialog(true)
  setGenerationStage("extracting")

  try {
    console.log("🚀 Starting quiz generation for documents:", selectedDocuments)

    // STEP 1: Extract text from selected documents first
    console.log("📝 Step 1: Ensuring documents have extracted text...")
    
    const extractResponse = await fetch("/api/documents/extract-selected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentIds: selectedDocuments }),
    })

    const extractData = await extractResponse.json()
    console.log("📝 Extraction result:", extractData)

    if (extractData.success) {
      if (extractData.results.triggered > 0) {
        console.log(`⏳ Waiting for ${extractData.results.triggered} document(s) to be extracted...`)
        
        // Wait for extraction to complete (5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      if (extractData.results.alreadyExtracted > 0) {
        console.log(`✅ ${extractData.results.alreadyExtracted} document(s) already have content`)
      }

      if (extractData.results.failed.length > 0) {
        console.warn("⚠️ Some documents failed extraction:", extractData.results.failed)
      }
    }

    // STEP 2: Generate quiz questions
    console.log("🎯 Step 2: Generating quiz questions...")
    setGenerationStage("generating")

    console.log("Generating quiz with:", {
      documentIds: selectedDocuments,
      difficulties: selectedDifficulties,
      questionCount: parseInt(questionCount),
    })

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentIds: selectedDocuments,
        difficulties: selectedDifficulties,
        questionCount: parseInt(questionCount),
      }),
    })

    console.log("Quiz API response status:", response.status)

    // Close the dialog before showing results
    setShowGenerationDialog(false)
    setGenerationStage("complete")

    if (response.ok) {
      const data = await response.json()
      console.log("Quiz API response data:", data)

      if (data.success && data.quiz?.questions) {
        setGeneratedQuestions(data.quiz.questions)
        setQuizId(String(data.quiz.id) || `quiz-${Date.now()}`)
        setShowQuiz(true)
        
        toast({
          title: "Quiz Generated! 🎉",
          description: `${data.quiz.questions.length} questions ready from ${selectedDocuments.length} document(s)`,
        })

        // Show warning if some documents failed
        if (data.metadata?.failedDocuments > 0) {
          setTimeout(() => {
            toast({
              title: "Partial Success",
              description: `${data.metadata.failedDocuments} document(s) could not be processed.`,
              variant: "default",
            })
          }, 1000)
        }
      } else {
        console.error("Invalid response structure:", data)
        toast({
          title: "Generation failed",
          description: data.error || "Could not generate quiz questions",
          variant: "destructive",
        })
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error("Quiz API error:", errorData)
      
      let errorDescription = errorData.error || "Server error occurred"
      
      if (errorData.failedDocuments && errorData.failedDocuments.length > 0) {
        errorDescription += `\n\nFailed documents: ${errorData.failedDocuments.join(", ")}`
      }
      
      toast({
        title: "Generation failed",
        description: errorDescription,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("❌ Quiz generation error:", error)
    setShowGenerationDialog(false)
    
    toast({
      title: "Error",
      description: "Failed to generate quiz. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsGeneratingQuiz(false)
  }
}

  const handleBackToSelection = () => {
    setShowQuiz(false)
    setGeneratedQuestions([])
    setQuizId("")
  }

  const allProjectsSelected = selectedProjects.length === projects.length && projects.length > 0
  const allDocumentsSelected = selectedDocuments.length === availableDocuments.length && availableDocuments.length > 0
  const allDifficultiesSelected = selectedDifficulties.length === 3

  if (showQuiz && generatedQuestions.length > 0) {
    return <QuizStudy questions={generatedQuestions} quizId={quizId} onBack={handleBackToSelection} />
  }

  return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            {/*<h1 className="text-3xl font-bold text-gray-900  dark:text-white">Start Quiz Session</h1>*/}
          </div>
          <div className="flex gap-3">
            <PreviewQuizzes className="bg-white text-black dark:bg-gray-900 dark:text-white border-black dark:border-white dark:hover:bg-slate-500 hover:bg-slate-300" />
            <ManualQuizCreator />
          </div>
        </div>

        <Card className="max-w-3xl mx-auto border-2 border-white dark:border-gray-950">
          <CardHeader className="text-center pb-6 space-y-2">
            <CardTitle className="text-2xl font-bold">Generate AI Quiz</CardTitle>
            <CardDescription className="text-base">Configure your quiz settings below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Projects</Label>
              <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950 dark:text-white"
                  >
                    <span className="text-gray-700">
                      {selectedProjects.length === 0
                        ? "Select projects"
                        : selectedProjects.length === projects.length
                          ? "All projects selected"
                          : `${selectedProjects.length} project${selectedProjects.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>  
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg dark:bg-gray-900">
                          <Checkbox
                            id="all-projects"
                            checked={allProjectsSelected}
                            onCheckedChange={handleAllProjectsSelection}
                          />
                          <Label htmlFor="all-projects" className="font-semibold text-purple-700 cursor-pointer">
                            Select All
                          </Label>
                        </div>
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-800">
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={selectedProjects.includes(project.id)}
                              onCheckedChange={(checked) => handleProjectSelection(project.id, checked as boolean)}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <FolderOpen className="w-4 h-4 text-purple-500" />
                              <Label htmlFor={`project-${project.id}`} className="cursor-pointer flex-1">
                                <p className="font-medium">{project.name}</p>
                                <p className="text-xs text-gray-500">{project.documents?.length || 0} documents</p>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Documents</Label>
              <Popover open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950"
                    disabled={selectedProjects.length === 0}
                  >
                    <span className="text-gray-700">
                      {selectedDocuments.length === 0
                        ? availableDocuments.length === 0
                          ? "No documents available"
                          : "Select documents"
                        : selectedDocuments.length === availableDocuments.length
                          ? "All documents selected"
                          : `${selectedDocuments.length} document${selectedDocuments.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {availableDocuments.length > 0 ? (
                      <>
                        <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg dark:bg-gray-900">
                          <Checkbox
                            id="all-documents"
                            checked={allDocumentsSelected}
                            onCheckedChange={handleAllDocumentsSelection}
                          />
                          <Label htmlFor="all-documents" className="font-semibold text-purple-700 cursor-pointer">
                            Select All
                          </Label>
                        </div>
                        {availableDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-800">
                            <Checkbox
                              id={`doc-${doc.id}`}
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={(checked) => handleDocumentSelection(doc.id, checked as boolean)}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="w-4 h-4 text-purple-500" />
                              <Label htmlFor={`doc-${doc.id}`} className="cursor-pointer flex-1">
                                <p className="font-medium">{doc.title}</p>
                                <p className="text-xs text-gray-500">{doc.file_type.toUpperCase()}</p>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        {selectedProjects.length === 0 ? "Select projects first" : "No documents in selected projects"}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="25">25 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Difficulty Level</Label>
              <div className="space-y-3 p-4 border-2 rounded-lg bg-purple-50/50 dark:bg-gray-950">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="difficulty-mix"
                    checked={allDifficultiesSelected}
                    onCheckedChange={(checked) => handleDifficultySelection("mix", checked as boolean)}
                  />
                  <Label htmlFor="difficulty-mix" className="font-semibold cursor-pointer">
                    Mix (All difficulties)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="difficulty-easy"
                    checked={selectedDifficulties.includes("easy")}
                    onCheckedChange={(checked) => handleDifficultySelection("easy", checked as boolean)}
                  />
                  <Label htmlFor="difficulty-easy" className="cursor-pointer">
                    Easy
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="difficulty-medium"
                    checked={selectedDifficulties.includes("medium")}
                    onCheckedChange={(checked) => handleDifficultySelection("medium", checked as boolean)}
                  />
                  <Label htmlFor="difficulty-medium" className="cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="difficulty-hard"
                    checked={selectedDifficulties.includes("hard")}
                    onCheckedChange={(checked) => handleDifficultySelection("hard", checked as boolean)}
                  />
                  <Label htmlFor="difficulty-hard" className="cursor-pointer">
                    Hard
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <p className="text-center text-sm text-gray-600">
                Your session will contain{" "}
                <span className="font-bold text-purple-600">{questionCount} unique questions</span>
              </p>

              <Button
                onClick={generateQuiz}
                disabled={selectedDocuments.length === 0 || selectedDifficulties.length === 0 || isGeneratingQuiz}
                className="w-full h-14 text-lg font-semibold bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
         {/* The Quiz Generation Dialog */}
          <QuizGenerationDialog
            open={showGenerationDialog}
            documentCount={selectedDocuments.length}
            questionCount={parseInt(questionCount)}
            stage={generationStage}
          />
      </div>
  )
}
