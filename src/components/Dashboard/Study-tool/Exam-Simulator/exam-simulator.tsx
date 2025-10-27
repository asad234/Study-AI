"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Clock,
  BookOpen,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import type { ExamQuestion } from "@/lib/exam-schema"
import { ExamGenerationDialog } from "./ExamGenerationDialog"

interface Project {
  id: string
  name: string
  documents: Document[]
}

interface Document {
  id: string
  name?: string
  title?: string
  file_name?: string
}

// ===== PARTIAL SCORING HELPER FUNCTIONS =====

/**
 * Calculate similarity between two strings (0-1 scale)
 * Uses Levenshtein distance algorithm
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const matrix: number[][] = []

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length)
  const distance = matrix[s2.length][s1.length]
  const similarity = 1 - distance / maxLength

  return Math.max(0, similarity)
}

/**
 * Check if answer contains key concepts from the correct answer
 */
function calculateConceptualMatch(userAnswer: string, correctAnswer: string): number {
  const userWords = userAnswer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  const correctWords = correctAnswer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  if (correctWords.length === 0) return 0

  let matchCount = 0
  correctWords.forEach((correctWord) => {
    if (userWords.some((userWord) => userWord.includes(correctWord) || correctWord.includes(userWord))) {
      matchCount++
    }
  })

  return matchCount / correctWords.length
}

/**
 * Score written answers with partial credit
 */
function scoreWrittenAnswer(userAnswer: string, correctAnswer: string, maxMarks: number): number {
  if (!userAnswer || userAnswer.trim().length === 0) return 0

  const similarity = calculateStringSimilarity(userAnswer, correctAnswer)
  const conceptMatch = calculateConceptualMatch(userAnswer, correctAnswer)

  const combinedScore = similarity * 0.4 + conceptMatch * 0.6

  let awardedMarks = 0

  if (combinedScore >= 0.9) {
    awardedMarks = maxMarks
  } else if (combinedScore >= 0.7) {
    awardedMarks = maxMarks * 0.8
  } else if (combinedScore >= 0.5) {
    awardedMarks = maxMarks * 0.6
  } else if (combinedScore >= 0.3) {
    awardedMarks = maxMarks * 0.4
  } else if (combinedScore >= 0.15) {
    awardedMarks = maxMarks * 0.2
  }

  return Math.round(awardedMarks * 10) / 10
}

/**
 * Score multiple-select answers with partial credit
 */
function scoreMultipleSelect(userAnswers: number[], correctAnswers: number[], maxMarks: number): number {
  if (!userAnswers || userAnswers.length === 0) return 0

  const correctSet = new Set(correctAnswers)
  const userSet = new Set(userAnswers)

  let correctSelections = 0
  let wrongSelections = 0

  userAnswers.forEach((answer) => {
    if (correctSet.has(answer)) {
      correctSelections++
    } else {
      wrongSelections++
    }
  })

  if (correctSelections === correctAnswers.length && wrongSelections === 0) {
    return maxMarks
  }

  const accuracy = correctSelections / correctAnswers.length
  const penaltyRatio = wrongSelections / correctAnswers.length

  let awardedMarks = 0

  if (accuracy >= 0.75) {
    awardedMarks = maxMarks * (0.5 + accuracy * 0.5)
  } else if (accuracy >= 0.5) {
    awardedMarks = maxMarks * (0.3 + accuracy * 0.4)
  } else if (accuracy >= 0.25) {
    awardedMarks = maxMarks * (accuracy * 0.5)
  }

  const penalty = Math.min(penaltyRatio * 0.5, 0.5)
  awardedMarks = awardedMarks * (1 - penalty)

  return Math.max(0, Math.round(awardedMarks * 10) / 10)
}

// ===== MAIN COMPONENT =====

export default function ExamSimulatorPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState("20")
  const [duration, setDuration] = useState("60")
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["easy", "medium", "hard"])

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    "multiple-choice",
    "true-false",
    "multiple-select",
    "written",
  ])

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [examId, setExamId] = useState<string>("")
  const [showExam, setShowExam] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(3600)
  const [examStarted, setExamStarted] = useState(false)
  const [examFinished, setExamFinished] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showReviewMode, setShowReviewMode] = useState(false)

  const [showGenerationDialog, setShowGenerationDialog] = useState(false)
  const [generationStage, setGenerationStage] = useState<"extracting" | "generating" | "complete">("extracting")

  // Variables for time warnings
  const [isCritical, setIsCritical] = useState(false)
  const [isWarning, setIsWarning] = useState(false)

  const difficulties = ["easy", "medium", "hard"]
  const questionTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "written", label: "Written Answer" },
    { value: "multiple-select", label: "Multiple Select" },
  ]

  const fetchProjects = async () => {
    if (status !== "authenticated") return

    try {
      const response = await fetch("/api/projects")
      const data = await response.json()

      if (data.success) {
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

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
        console.log("📄 Fetched documents:", allDocs) // Debug log
        setAvailableDocuments(allDocs)
      } catch (error) {
        console.error("Failed to fetch documents:", error)
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        })
      }
    }

    fetchDocuments()
  }, [selectedProjects])

  // Add this useEffect for the timer countdown
  // Place this after your other useEffect hooks

  useEffect(() => {
    // Only run timer when exam is active
    if (!examStarted || examFinished || showResults) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        // Time's up!
        if (prevTime <= 1) {
          clearInterval(timer)
          handleFinishExam()
          toast({
            title: "Time's Up! ⏰",
            description: "Your exam has been automatically submitted.",
            variant: "destructive",
          })
          return 0
        }

        const newTime = prevTime - 1
        const totalDuration = Number.parseInt(duration) * 60
        const timeRemaining = newTime
        const percentageLeft = (timeRemaining / totalDuration) * 100

        // Update warning states
        setIsWarning(percentageLeft <= 20 && percentageLeft > 19.5)
        setIsCritical(percentageLeft <= 5 && percentageLeft > 4.5)

        // Warning at 20% time remaining (only show once)
        if (percentageLeft <= 20 && percentageLeft > 19.5 && prevTime > newTime) {
          const minutesLeft = Math.floor(timeRemaining / 60)
          toast({
            title: "⚠️ Time Warning",
            description: `Only ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""} remaining! Please review your answers.`,
            variant: "default",
          })
        }

        // Critical warning at 5% time remaining (only show once)
        if (percentageLeft <= 5 && percentageLeft > 4.5 && prevTime > newTime) {
          const minutesLeft = Math.floor(timeRemaining / 60)
          const secondsLeft = timeRemaining % 60
          toast({
            title: "🚨 Critical Time Warning",
            description: `Only ${minutesLeft}:${secondsLeft.toString().padStart(2, "0")} remaining!`,
            variant: "destructive",
          })
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted, examFinished, showResults, duration])

  const generateExam = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to generate an exam.",
        variant: "destructive",
      })
      return
    }

    if (selectedQuestionTypes.length === 0) {
      toast({
        title: "No question types selected",
        description: "Please select at least one question type.",
        variant: "destructive",
      })
      return
    }

    const minQuestions = selectedQuestionTypes.length
    if (Number.parseInt(questionCount) < minQuestions) {
      toast({
        title: "Not enough questions",
        description: `You need at least ${minQuestions} questions for ${selectedQuestionTypes.length} question types. Please increase the question count.`,
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setShowGenerationDialog(true)
    setGenerationStage("extracting")

    try {
      console.log("🚀 Starting exam generation for documents:", selectedDocuments)

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
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }

        if (extractData.results.alreadyExtracted > 0) {
          console.log(`✅ ${extractData.results.alreadyExtracted} document(s) already have content`)
        }

        if (extractData.results.failed.length > 0) {
          console.warn("⚠️ Some documents failed extraction:", extractData.results.failed)
        }
      }

      // STEP 2: Generate exam
      console.log("📋 Step 2: Generating exam...")
      setGenerationStage("generating")

      const requestBody = {
        documentIds: selectedDocuments.map(String),
        projectIds: selectedProjects.map(String),
        questionCount: Number.parseInt(questionCount),
        difficulties: selectedDifficulties,
        duration: Number.parseInt(duration) * 60,
        questionTypes: selectedQuestionTypes,
      }

      console.log("🚀 Sending exam generation request:", requestBody)

      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      // Close the dialog before showing results
      setShowGenerationDialog(false)
      setGenerationStage("complete")

      if (data.success && data.exam) {
        setExamQuestions(data.exam.questions)
        setExamId(String(data.exam.id))
        setTimeLeft(data.exam.duration)
        setShowExam(true)
        setExamStarted(true)

        const typeDistribution = data.metadata?.questionTypeDistribution || {}
        const distributionText = Object.entries(typeDistribution)
          .map(([type, count]) => `${type}: ${count}`)
          .join(", ")

        toast({
          title: "Exam Generated! 🎉",
          description: `Your exam with ${data.exam.questions.length} questions is ready from ${selectedDocuments.length} document(s)! (${distributionText})`,
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
        console.error("Generation failed:", data)
        toast({
          title: "Generation failed",
          description: data.error || "Could not generate exam questions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Exam generation error:", error)
      setShowGenerationDialog(false)

      toast({
        title: "Error",
        description: "Failed to generate exam. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const calculateResults = () => {
    let correctCount = 0
    let totalMarks = 0
    let earnedMarks = 0
    const questionScores: Record<string, { earned: number; max: number; status: string }> = {}

    examQuestions.forEach((q) => {
      totalMarks += q.marks
      const userAnswer = answers[q.id]

      if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
        questionScores[q.id] = { earned: 0, max: q.marks, status: "unanswered" }
        return
      }

      if (q.type === "multiple-select") {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : []
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : []

        const isFullyCorrect =
          correctAnswers.length === userAnswers.length &&
          correctAnswers.sort().every((val, idx) => val === userAnswers.sort()[idx])

        if (isFullyCorrect) {
          correctCount++
          earnedMarks += q.marks
          questionScores[q.id] = { earned: q.marks, max: q.marks, status: "correct" }
        } else {
          const partialMarks = scoreMultipleSelect(userAnswers, correctAnswers, q.marks)
          earnedMarks += partialMarks
          questionScores[q.id] = {
            earned: partialMarks,
            max: q.marks,
            status: partialMarks > 0 ? "partial" : "incorrect",
          }
        }
      } else if (q.type === "written") {
        const correctAnswerStr = typeof q.correctAnswer === "string" ? q.correctAnswer : ""
        const userAnswerStr = typeof userAnswer === "string" ? userAnswer : ""

        const partialMarks = scoreWrittenAnswer(userAnswerStr, correctAnswerStr, q.marks)
        earnedMarks += partialMarks

        if (partialMarks >= q.marks * 0.9) {
          correctCount++
          questionScores[q.id] = { earned: partialMarks, max: q.marks, status: "correct" }
        } else {
          questionScores[q.id] = {
            earned: partialMarks,
            max: q.marks,
            status: partialMarks > 0 ? "partial" : "incorrect",
          }
        }
      } else {
        if (userAnswer === q.correctAnswer) {
          correctCount++
          earnedMarks += q.marks
          questionScores[q.id] = { earned: q.marks, max: q.marks, status: "correct" }
        } else {
          questionScores[q.id] = { earned: 0, max: q.marks, status: "incorrect" }
        }
      }
    })

    return {
      correctCount,
      totalQuestions: examQuestions.length,
      earnedMarks: Math.round(earnedMarks * 10) / 10,
      totalMarks,
      percentage: totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0,
      questionScores,
    }
  }

  const handleFinishExam = async () => {
    setExamFinished(true)
    setExamStarted(false)

    const results = calculateResults()

    const formattedAnswers = examQuestions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] !== undefined ? answers[q.id] : null,
      timeSpent: 0,
    }))

    try {
      const response = await fetch("/api/exams/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: examId,
          answers: formattedAnswers,
          totalTime: Number.parseInt(duration) * 60 - timeLeft,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowResults(true)
        toast({
          title: "Exam Submitted Successfully",
          description: `You scored ${results.percentage.toFixed(1)}% (${results.earnedMarks}/${results.totalMarks} marks)!`,
        })
      } else {
        throw new Error(data.error || "Failed to submit")
      }
    } catch (error) {
      console.error("Failed to submit exam:", error)
      setShowResults(true)
      toast({
        title: "Submission Warning",
        description: "Your answers couldn't be saved to the server, but you can still see your results.",
        variant: "destructive",
      })
    }
  }

  const renderQuestion = (question: ExamQuestion) => {
    switch (question.type) {
      case "multiple-choice":
      case "true-false":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === index
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => setAnswers({ ...answers, [question.id]: index })}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[question.id] === index ? "border-purple-500 bg-purple-500" : "border-gray-300"
                    }`}
                  >
                    {answers[question.id] === index && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        )

      case "multiple-select":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const selectedOptions = answers[question.id] || []
              const isSelected = selectedOptions.includes(index)

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    const newSelected = isSelected
                      ? selectedOptions.filter((i: number) => i !== index)
                      : [...selectedOptions, index]
                    setAnswers({ ...answers, [question.id]: newSelected })
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={isSelected} />
                    <span>{option}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "written":
        return (
          <Textarea
            placeholder="Type your answer here..."
            value={answers[question.id] || ""}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="min-h-[150px]"
          />
        )

      default:
        return null
    }
  }

  const isAnswerCorrect = (question: ExamQuestion): boolean | "partial" | null => {
    const userAnswer = answers[question.id]

    if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
      return false
    }

    if (question.type === "multiple-select") {
      const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : []

      const isFullyCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.sort().every((val, idx) => val === userAnswers.sort()[idx])

      if (isFullyCorrect) return true

      const hasAnyCorrect = userAnswers.some((ans: number) => correctAnswers.includes(ans))
      return hasAnyCorrect ? "partial" : false
    } else if (question.type === "written") {
      const correctAnswerStr = typeof question.correctAnswer === "string" ? question.correctAnswer : ""
      const userAnswerStr = typeof userAnswer === "string" ? userAnswer : ""

      const similarity = calculateStringSimilarity(userAnswerStr, correctAnswerStr)
      const conceptMatch = calculateConceptualMatch(userAnswerStr, correctAnswerStr)
      const combinedScore = similarity * 0.4 + conceptMatch * 0.6

      if (combinedScore >= 0.9) return true
      if (combinedScore >= 0.3) return "partial"
      return false
    } else {
      return userAnswer === question.correctAnswer
    }
  }

  const renderAnswerComparison = (question: ExamQuestion) => {
    const correct = isAnswerCorrect(question)
    const results = calculateResults()
    const questionScore = results.questionScores?.[question.id]

    switch (question.type) {
      case "multiple-choice":
      case "true-false":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isCorrect = question.correctAnswer === index
              const isUserAnswer = answers[question.id] === index

              return (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : isUserAnswer
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                      <span className={isCorrect || isUserAnswer ? "font-semibold" : ""}>{option}</span>
                    </span>
                    {isCorrect && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Correct Answer
                      </Badge>
                    )}
                    {isUserAnswer && !isCorrect && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        Your Answer
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "multiple-select":
        return (
          <div className="space-y-3">
            {questionScore && questionScore.status === "partial" && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-900 dark:text-yellow-300">
                  Partial Credit: {questionScore.earned}/{questionScore.max} marks - You got some correct answers!
                </span>
              </div>
            )}
            {question.options?.map((option, index) => {
              const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
              const userAnswers = Array.isArray(answers[question.id]) ? answers[question.id] : []
              const isCorrect = correctAnswers.includes(index)
              const isUserAnswer = userAnswers.includes(index)

              return (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg ${
                    isCorrect && isUserAnswer
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : isUserAnswer && !isCorrect
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : isCorrect
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {isCorrect && isUserAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                      <span className={isCorrect || isUserAnswer ? "font-semibold" : ""}>{option}</span>
                    </span>
                    {isCorrect && isUserAnswer && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        ✓ Correct Selection
                      </Badge>
                    )}
                    {isUserAnswer && !isCorrect && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        ✗ Wrong Selection
                      </Badge>
                    )}
                    {isCorrect && !isUserAnswer && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        ⚠ Missed Answer
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )

      case "written":
        const userAnswerStr = typeof answers[question.id] === "string" ? answers[question.id] : ""
        const correctAnswerStr = typeof question.correctAnswer === "string" ? question.correctAnswer : ""

        const similarity = calculateStringSimilarity(userAnswerStr, correctAnswerStr)
        const conceptMatch = calculateConceptualMatch(userAnswerStr, correctAnswerStr)
        const combinedScore = similarity * 0.4 + conceptMatch * 0.6
        const scorePercentage = Math.round(combinedScore * 100)

        return (
          <div className="space-y-4">
            {questionScore && (
              <div
                className={`p-4 border-2 rounded-lg ${
                  questionScore.status === "correct"
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200"
                    : questionScore.status === "partial"
                      ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200"
                      : "bg-red-50 dark:bg-red-950/30 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    {questionScore.status === "correct"
                      ? "✓ Excellent Answer!"
                      : questionScore.status === "partial"
                        ? "⚠ Partial Credit"
                        : "✗ Needs Improvement"}
                  </span>
                  <Badge variant="outline">
                    {questionScore.earned}/{questionScore.max} marks ({scorePercentage}% match)
                  </Badge>
                </div>
                <Progress value={scorePercentage} className="h-2" />
              </div>
            )}

            <div className="p-4 border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📝 Your Answer:</p>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {userAnswerStr || "No answer provided"}
              </p>
            </div>

            <div className="p-4 border-2 border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">✓ Model Answer:</p>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{correctAnswerStr}</p>
            </div>

            {questionScore && questionScore.status === "partial" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  💡 <strong>Scoring Breakdown:</strong> Your answer captured {scorePercentage}% of the key concepts.
                  {scorePercentage >= 70
                    ? " Great work!"
                    : scorePercentage >= 50
                      ? " You're on the right track!"
                      : " Review the model answer for improvement."}
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access the exam simulator.</p>
        </div>
      </div>
    )
  }

  // Review Mode
  if (showReviewMode && showResults && examFinished) {
    const question = examQuestions[currentQuestion]
    const correct = isAnswerCorrect(question)
    const progress = ((currentQuestion + 1) / examQuestions.length) * 100
    const results = calculateResults()
    const questionScore = results.questionScores?.[question.id]

    return (
      <div>
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => setShowReviewMode(false)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Summary
                </Button>
                <Badge variant="outline" className="text-base">
                  Question {currentQuestion + 1} of {examQuestions.length}
                </Badge>
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl">{question.question}</CardTitle>
                <div className="flex gap-2 flex-shrink-0 flex-col items-end">
                  <Badge
                    variant={correct === true ? "default" : correct === "partial" ? "secondary" : "destructive"}
                    className={correct === "partial" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                  >
                    {correct === true ? "✓ Correct" : correct === "partial" ? "⚠ Partial Credit" : "✗ Incorrect"}
                  </Badge>
                  {questionScore && (
                    <Badge variant="outline">
                      {questionScore.earned}/{questionScore.max} marks
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Difficulty: {question.difficulty} • Type: {question.type.replace("-", " ")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {renderAnswerComparison(question)}

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📚 Explanation:</p>
                <p className="text-gray-800 dark:text-gray-200">{question.explanation}</p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (currentQuestion < examQuestions.length - 1) {
                    setCurrentQuestion((prev) => prev + 1)
                  } else {
                    setShowReviewMode(false)
                    setCurrentQuestion(0)
                  }
                }}
              >
                {currentQuestion === examQuestions.length - 1 ? "Back to Summary" : "Next"}
                {currentQuestion < examQuestions.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Results Summary Screen
  if (showResults && examFinished) {
    const results = calculateResults()
    const passed = results.percentage >= 60

    const statusBreakdown = Object.values(results.questionScores || {}).reduce(
      (acc, score) => {
        acc[score.status] = (acc[score.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return (
      <div>
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                {passed ? (
                  <CheckCircle className="w-20 h-20 text-green-500" />
                ) : (
                  <XCircle className="w-20 h-20 text-orange-500" />
                )}
              </div>
              <CardTitle className="text-3xl mb-2">{passed ? "Congratulations!" : "Exam Completed"}</CardTitle>
              <CardDescription className="text-base">
                {passed ? "You passed the exam!" : "Keep studying and try again!"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</p>
                  <p className="text-2xl font-bold text-purple-600">{results.percentage.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Marks</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {results.earnedMarks}/{results.totalMarks}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.correctCount}/{results.totalQuestions}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.floor((Number.parseInt(duration) * 60 - timeLeft) / 60)}m
                  </p>
                </div>
              </div>

              {statusBreakdown.partial > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    💫 Partial Credit Awarded
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{statusBreakdown.correct || 0}</p>
                      <p className="text-xs text-gray-600">Fully Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{statusBreakdown.partial || 0}</p>
                      <p className="text-xs text-gray-600">Partial Credit</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{statusBreakdown.incorrect || 0}</p>
                      <p className="text-xs text-gray-600">Incorrect</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Performance</span>
                  <span className="font-medium">{results.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={results.percentage} className="h-3" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setShowReviewMode(true)
                  setCurrentQuestion(0)
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Award className="mr-2 h-4 w-4" />
                Review Answers
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowExam(false)
                  setShowResults(false)
                  setExamFinished(false)
                  setShowReviewMode(false)
                  setAnswers({})
                  setCurrentQuestion(0)
                  setExamQuestions([])
                  setExamId("")
                }}
              >
                Create New Exam
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Exam Taking Screen
  if (showExam && examQuestions.length > 0) {
    const question = examQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / examQuestions.length) * 100

    return (
      <div>
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                >
                  Question {currentQuestion + 1} of {examQuestions.length}
                </Badge>
                <div
                  className={`flex items-center space-x-2 text-lg font-mono ${
                    isCritical
                      ? "text-red-600 dark:text-red-400 animate-pulse"
                      : isWarning
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <Clock className={`w-5 h-5 ${isCritical ? "animate-bounce" : isWarning ? "animate-pulse" : ""}`} />
                  <span className="font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
              {/* </CHANGE> */}
              <Progress value={progress} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{question.question}</CardTitle>
              <CardDescription>
                {question.type === "multiple-select" && "Select all that apply"}
                {question.type === "written" && "Provide a detailed answer"}
                {question.type === "multiple-choice" && "Select one answer"}
                {question.type === "true-false" && "Choose True or False"}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderQuestion(question)}</CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (currentQuestion === examQuestions.length - 1) {
                    handleFinishExam()
                  } else {
                    setCurrentQuestion((prev) => prev + 1)
                  }
                }}
              >
                {currentQuestion === examQuestions.length - 1 ? "Finish Exam" : "Next"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Exam Generation Form
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>{/*<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exam Setup</h1>*/}</div>
      </div>

      <Card className="max-w-3xl mx-auto border-2 border-white dark:border-gray-950">
        <CardHeader className="text-center pb-6 space-y-2">
          <CardTitle className="text-2xl font-bold">Generate Exam with AI</CardTitle>
          <CardDescription className="text-base">Set up your exam preferences</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Select Projects */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Projects</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950"
                >
                  <span className="text-gray-700 dark:text-gray-300">
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
                  <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg dark:bg-gray-900">
                    <Checkbox
                      checked={selectedProjects.length === projects.length}
                      onCheckedChange={(checked) => {
                        setSelectedProjects(checked ? projects.map((p) => p.id) : [])
                        setSelectedDocuments([])
                      }}
                    />
                    <span className="font-semibold text-purple-700 dark:text-purple-400 cursor-pointer">
                      Select All
                    </span>
                  </div>
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-800"
                    >
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project.id])
                          } else {
                            setSelectedProjects(selectedProjects.filter((id) => id !== project.id))
                            setSelectedDocuments(
                              selectedDocuments.filter((docId) => !project.documents.some((doc) => doc.id === docId)),
                            )
                          }
                        }}
                      />
                      <span className="cursor-pointer flex-1">{project.name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Select Documents */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Documents</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950"
                  disabled={selectedProjects.length === 0}
                >
                  <span className="text-gray-700 dark:text-gray-300">
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
                          checked={selectedDocuments.length === availableDocuments.length}
                          onCheckedChange={(checked) =>
                            setSelectedDocuments(checked ? availableDocuments.map((d) => d.id) : [])
                          }
                        />
                        <span className="font-semibold text-purple-700 dark:text-purple-400 cursor-pointer">
                          Select All
                        </span>
                      </div>
                      {availableDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-800"
                        >
                          <Checkbox
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocuments([...selectedDocuments, doc.id])
                              } else {
                                setSelectedDocuments(selectedDocuments.filter((id) => id !== doc.id))
                              }
                            }}
                          />
                          <span className="cursor-pointer flex-1">
                            {doc.title || doc.name || doc.file_name || "Untitled Document"}
                          </span>
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

          {/* Question Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Input
                type="number"
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                min="15"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 border-2 hover:border-purple-300 bg-white dark:bg-gray-950"
              />
            </div>
          </div>

          {/* Question Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Question Types
              {selectedQuestionTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedQuestionTypes.length} selected
                </Badge>
              )}
            </label>
            <div className="space-y-3 p-4 border-2 rounded-lg bg-purple-50/50 dark:bg-gray-950">
              {questionTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedQuestionTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedQuestionTypes([...selectedQuestionTypes, type.value])
                      } else {
                        setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== type.value))
                      }
                    }}
                  />
                  <span className="cursor-pointer">{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Levels */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Difficulty Level</label>
            <div className="space-y-3 p-4 border-2 rounded-lg bg-purple-50/50 dark:bg-gray-950">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedDifficulties.length === 3}
                  onCheckedChange={(checked) => {
                    setSelectedDifficulties(checked ? ["easy", "medium", "hard"] : [])
                  }}
                />
                <span className="font-semibold cursor-pointer">Mix (All difficulties)</span>
              </div>
              {difficulties.map((diff) => (
                <div key={diff} className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedDifficulties.includes(diff)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDifficulties([...selectedDifficulties, diff])
                      } else {
                        setSelectedDifficulties(selectedDifficulties.filter((d) => d !== diff))
                      }
                    }}
                  />
                  <span className="cursor-pointer capitalize">{diff}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4 space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Your exam will contain <span className="font-bold text-purple-600">{questionCount} questions</span> and
              last <span className="font-bold text-purple-600">{duration} minutes</span>
            </p>

            <Button
              onClick={generateExam}
              disabled={isGenerating}
              className="w-full h-14 text-lg font-semibold bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Exam...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Exam
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* The Exam Generation Dialog at the end */}
      <ExamGenerationDialog
        open={showGenerationDialog}
        documentCount={selectedDocuments.length}
        questionCount={Number.parseInt(questionCount)}
        duration={Number.parseInt(duration)}
        stage={generationStage}
      />
    </div>
  )
}
