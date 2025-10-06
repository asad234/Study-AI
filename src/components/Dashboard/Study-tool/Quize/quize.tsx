"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  CheckCircle,
  X,
  RotateCcw,
  Trophy,
  Loader2,
  Plus,
  BookOpen,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
}

interface QuizResult {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number
}

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  status: string
}

interface Project {
  id: string
  name: string
  description: string
  documents?: Document[]
}

interface Quiz {
  id: string
  questions: Question[]
}

const sampleQuestions: Question[] = [
  {
    id: "1",
    question: "What is the primary function of mitochondria in a cell?",
    options: ["Protein synthesis", "Energy production (ATP)", "DNA replication", "Waste removal"],
    correctAnswer: 1,
    explanation:
      "Mitochondria are known as the powerhouses of the cell because they produce ATP (adenosine triphosphate), which is the main energy currency of cells.",
    subject: "Biology",
    difficulty: "medium",
  },
  {
    id: "2",
    question: "Which of the following is NOT a renewable energy source?",
    options: ["Solar power", "Wind power", "Natural gas", "Hydroelectric power"],
    correctAnswer: 2,
    explanation:
      "Natural gas is a fossil fuel and is considered non-renewable because it takes millions of years to form and cannot be replenished on a human timescale.",
    subject: "Environmental Science",
    difficulty: "easy",
  },
  {
    id: "3",
    question: "What is the derivative of x² + 3x + 2?",
    options: ["2x + 3", "x² + 3", "2x + 2", "x + 3"],
    correctAnswer: 0,
    explanation:
      "Using the power rule, the derivative of x² is 2x, the derivative of 3x is 3, and the derivative of a constant (2) is 0. Therefore, the answer is 2x + 3.",
    subject: "Mathematics",
    difficulty: "medium",
  },
]

const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Biology Study Guide",
    description: "Comprehensive biology materials",
    documents: [
      { id: "1", title: "Cell Biology Fundamentals", file_name: "cell_biology.pdf", file_type: "pdf", status: "ready" },
      { id: "2", title: "Genetics Overview", file_name: "genetics.pdf", file_type: "pdf", status: "ready" },
    ],
  },
  {
    id: "2",
    name: "Mathematics Course",
    description: "Calculus and algebra resources",
    documents: [
      { id: "3", title: "Calculus Basics", file_name: "calculus.pdf", file_type: "pdf", status: "ready" },
      { id: "4", title: "Linear Algebra", file_name: "linear_algebra.pdf", file_type: "pdf", status: "ready" },
    ],
  },
  {
    id: "3",
    name: "Environmental Science",
    description: "Climate and sustainability topics",
    documents: [
      {
        id: "5",
        title: "Renewable Energy Guide",
        file_name: "renewable_energy.pdf",
        file_type: "pdf",
        status: "ready",
      },
      { id: "6", title: "Climate Change", file_name: "climate.pdf", file_type: "pdf", status: "ready" },
    ],
  },
]

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizDifficulty, setQuizDifficulty] = useState<string>("medium")
  const [questionCount, setQuestionCount] = useState<string>("5")
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [allDocumentsSelected, setAllDocumentsSelected] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [projectsExpanded, setProjectsExpanded] = useState(false)
  const [documentsExpanded, setDocumentsExpanded] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const timeSpent = Date.now() - startTime
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    const result: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
    }

    setQuizResults((prev) => [...prev, result])
    setShowResult(true)
  }

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      setQuizCompleted(true)

      // Save quiz attempt
      if (currentQuiz) {
        try {
          await fetch("/api/quiz/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId: currentQuiz.id,
              answers: quizResults.map((result) => ({
                questionId: result.questionId,
                selectedAnswer: result.selectedAnswer,
                timeSpent: result.timeSpent,
              })),
              totalTime: Date.now() - startTime,
            }),
          })
        } catch (error) {
          console.error("Failed to save quiz attempt:", error)
        }
      }
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setQuizResults([])
    setQuizCompleted(false)
    setStartTime(Date.now())
    setQuizStarted(false)
    setCurrentQuiz(null)
    setSelectedProjects([])
    setSelectedDocuments([])
    setAllProjectsSelected(false)
    setAllDocumentsSelected(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const calculateScore = () => {
    const correctAnswers = quizResults.filter((result) => result.isCorrect).length
    return Math.round((correctAnswers / questions.length) * 100)
  }

  const generateQuiz = async () => {
    if (selectedDocuments.length === 0) {
      return
    }

    setIsGeneratingQuiz(true)
    try {
      // For now, use the first selected document
      const documentId = selectedDocuments[0]

      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: documentId,
          difficulty: quizDifficulty,
          questionCount: Number.parseInt(questionCount),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentQuiz(data.quiz)
          setQuestions(data.quiz.questions)
          setQuizStarted(true)
          setCurrentQuestionIndex(0)
          setSelectedAnswer(null)
          setShowResult(false)
          setQuizResults([])
          setQuizCompleted(false)
          setStartTime(Date.now())
        }
      } else {
        console.error("Failed to generate quiz")
        setQuestions(sampleQuestions)
        setQuizStarted(true)
        setCurrentQuestionIndex(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setQuizResults([])
        setQuizCompleted(false)
        setStartTime(Date.now())
      }
    } catch (error) {
      console.error("Quiz generation error:", error)
      setQuestions(sampleQuestions)
      setQuizStarted(true)
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
      setQuizResults([])
      setQuizCompleted(false)
      setStartTime(Date.now())
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true)
      try {
        const response = await fetch("/api/projects")
        const data = await response.json()

        if (data.success) {
          setAvailableProjects(data.projects)
        } else {
          setAvailableProjects(sampleProjects)
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error)
        setAvailableProjects(sampleProjects)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    const updateDocuments = () => {
      if (selectedProjects.length === 0) {
        setAvailableDocuments([])
        return
      }

      const docs: Document[] = []
      selectedProjects.forEach((projectId) => {
        const project = availableProjects.find((p) => p.id === projectId)
        if (project?.documents) {
          docs.push(...project.documents)
        }
      })

      setAvailableDocuments(docs)

      // Reset document selection when projects change
      setSelectedDocuments([])
      setAllDocumentsSelected(false)
    }

    updateDocuments()
  }, [selectedProjects, availableProjects])

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects((prev) => [...prev, projectId])
    } else {
      setSelectedProjects((prev) => prev.filter((id) => id !== projectId))
      setAllProjectsSelected(false)
    }
  }

  const handleAllProjectsSelection = (checked: boolean) => {
    setAllProjectsSelected(checked)
    if (checked) {
      setSelectedProjects(availableProjects.map((p) => p.id))
    } else {
      setSelectedProjects([])
    }
  }

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, documentId])
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== documentId))
      setAllDocumentsSelected(false)
    }
  }

  const handleAllDocumentsSelection = (checked: boolean) => {
    setAllDocumentsSelected(checked)
    if (checked) {
      setSelectedDocuments(availableDocuments.map((d) => d.id))
    } else {
      setSelectedDocuments([])
    }
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-background dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                AI Quiz Generator
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create personalized quizzes from your study materials with advanced AI technology
              </p>
            </div>

            <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Create New Quiz</CardTitle>
                <CardDescription className="text-base">Configure your personalized quiz settings below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Difficulty Level
                    </Label>
                    <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                      <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Easy</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="hard">🔴 Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Number of Questions
                    </Label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Questions</SelectItem>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="cursor-pointer border-2 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Available Projects
                        {selectedProjects.length > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                            {selectedProjects.length} selected
                          </Badge>
                        )}
                      </Label>
                      {projectsExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {projectsExpanded && (
                    <div className="border-2 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto bg-blue-50/50 dark:bg-blue-950/20">
                      {loadingProjects ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          <span className="ml-2 text-muted-foreground">Loading projects...</span>
                        </div>
                      ) : availableProjects.length > 0 ? (
                        <>
                          <div className="flex items-center space-x-3 p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                            <Checkbox
                              id="all-projects"
                              checked={allProjectsSelected}
                              onCheckedChange={handleAllProjectsSelection}
                              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <Label htmlFor="all-projects" className="font-semibold text-blue-700 dark:text-blue-300">
                              All Projects
                            </Label>
                          </div>

                          {availableProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center space-x-3 p-2 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 rounded-lg"
                            >
                              <Checkbox
                                id={`project-${project.id}`}
                                checked={selectedProjects.includes(project.id)}
                                onCheckedChange={(checked) => handleProjectSelection(project.id, checked as boolean)}
                                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <FolderOpen className="w-4 h-4 text-blue-500" />
                                <Label htmlFor={`project-${project.id}`} className="cursor-pointer flex-1">
                                  <div>
                                    <p className="font-medium">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {project.documents?.length || 0} documents
                                    </p>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center p-8">
                          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No projects found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div
                    className="cursor-pointer border-2 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    onClick={() => setDocumentsExpanded(!documentsExpanded)}
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Documents
                        {selectedDocuments.length > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                            {selectedDocuments.length} selected
                          </Badge>
                        )}
                      </Label>
                      {documentsExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {documentsExpanded && (
                    <div className="border-2 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto bg-blue-50/50 dark:bg-blue-950/20">
                      {availableDocuments.length > 0 ? (
                        <>
                          <div className="flex items-center space-x-3 p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                            <Checkbox
                              id="all-documents"
                              checked={allDocumentsSelected}
                              onCheckedChange={handleAllDocumentsSelection}
                              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <Label htmlFor="all-documents" className="font-semibold text-blue-700 dark:text-blue-300">
                              All Documents
                            </Label>
                          </div>

                          {availableDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center space-x-3 p-2 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 rounded-lg"
                            >
                              <Checkbox
                                id={`doc-${doc.id}`}
                                checked={selectedDocuments.includes(doc.id)}
                                onCheckedChange={(checked) => handleDocumentSelection(doc.id, checked as boolean)}
                                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <Label htmlFor={`doc-${doc.id}`} className="cursor-pointer flex-1">
                                  <div>
                                    <p className="font-medium">{doc.title}</p>
                                    <p className="text-xs text-muted-foreground">{doc.file_type.toUpperCase()}</p>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : selectedProjects.length > 0 ? (
                        <div className="text-center p-8">
                          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No documents found in selected projects</p>
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Select projects to view documents</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={generateQuiz}
                  disabled={selectedDocuments.length === 0 || isGeneratingQuiz}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Generating Your Quiz...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-3" />
                      Generate Quiz
                    </>
                  )}
                </Button>

                {selectedDocuments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    Please select at least one document to generate your personalized quiz
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const score = calculateScore()
    const correctAnswers = quizResults.filter((result) => result.isCorrect).length

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-background dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Quiz Complete!
              </h1>
              <p className="text-lg text-muted-foreground">Here are your results</p>
            </div>

            <Card className="max-w-3xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Your Score</CardTitle>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  {score}%
                </div>
                <CardDescription className="text-lg">
                  {correctAnswers} out of {questions.length} questions correct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 border-2 border-green-200 rounded-xl bg-green-50 dark:bg-green-950/30">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-green-600">{correctAnswers}</p>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Correct</p>
                  </div>
                  <div className="text-center p-6 border-2 border-red-200 rounded-xl bg-red-50 dark:bg-red-950/30">
                    <X className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-red-600">{questions.length - correctAnswers}</p>
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">Incorrect</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Question Review</h3>
                  {questions.map((question, index) => {
                    const result = quizResults[index]
                    return (
                      <div key={question.id} className="p-6 border-2 rounded-xl bg-card/50">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-semibold text-base">Question {index + 1}</p>
                          {result.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <X className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{question.question}</p>
                        {!result.isCorrect && (
                          <div className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg">
                            <p className="text-red-600 dark:text-red-400">
                              <span className="font-medium">Your answer:</span>{" "}
                              {question.options[result.selectedAnswer]}
                            </p>
                            <p className="text-green-600 dark:text-green-400">
                              <span className="font-medium">Correct answer:</span>{" "}
                              {question.options[question.correctAnswer]}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={restartQuiz}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="flex-1 h-12 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 bg-transparent"
                  >
                    <a href="/dashboard">Back to Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-background dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Quiz in Progress
            </h1>
            <p className="text-lg text-muted-foreground">Test your knowledge with AI-generated questions</p>
          </div>

          {/* Progress */}
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-semibold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-base text-muted-foreground font-medium">{Math.round(progress)}% Complete</span>
                </div>
              </div>
              <Progress value={progress} className="h-3 bg-blue-100 dark:bg-blue-950" />
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)} variant="secondary">
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700 dark:text-blue-300">
                  {currentQuestion.subject}
                </Badge>
              </div>
              <CardTitle className="text-2xl leading-relaxed">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {!showResult ? (
                <>
                  <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-4 p-4 border-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer ${
                          selectedAnswer === index
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                            : "border-border hover:border-blue-300"
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <Checkbox
                          id={`option-${index}`}
                          checked={selectedAnswer === index}
                          onCheckedChange={() => handleAnswerSelect(index)}
                          className="mt-1 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base leading-relaxed">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Submit Answer
                  </Button>
                </>
              ) : (
                <div className="space-y-6">
                  <div
                    className={`p-6 rounded-xl border-2 ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"
                        : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <X className="w-6 h-6 text-red-600" />
                      )}
                      <span className="font-bold text-lg">
                        {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Incorrect"}
                      </span>
                    </div>

                    {selectedAnswer !== currentQuestion.correctAnswer && (
                      <p className="text-base mb-4 font-medium">
                        The correct answer is: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                      </p>
                    )}

                    <p className="text-base text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                  </div>

                  <Button
                    onClick={handleNextQuestion}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
