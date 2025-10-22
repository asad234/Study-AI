"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import QuizStudy from "@/components/Dashboard/Study-tool/Quize/quize-study"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
}

interface QuizSet {
  id: string
  name: string
  questions: Question[]
  questionCount: number
  difficulty: string
  timeLimit?: number
  isAIGenerated: boolean
  subject?: string
}

export default function QuizStudyPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) {
      setError("Quiz ID is missing")
      setLoading(false)
      return
    }

    fetchQuizSet()
  }, [quizId])

  const fetchQuizSet = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/quiz-sets/${quizId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quiz set")
      }

      if (data.success && data.quizSet) {
        setQuizSet(data.quizSet)
      } else {
        throw new Error("Quiz set not found")
      }
    } catch (err) {
      console.error("Error fetching quiz set:", err)
      setError(err instanceof Error ? err.message : "Failed to load quiz")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/dashboard/quiz")
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Loading quiz...</h2>
            <p className="text-gray-500 mt-2">Please wait while we fetch your quiz</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error Loading Quiz</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Unable to Load Quiz
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {error === "Quiz set not found" 
                ? "This quiz may have been deleted or you don't have permission to access it."
                : "There was a problem loading this quiz. Please try again later."}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <Button
                onClick={fetchQuizSet}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No quiz data
  if (!quizSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Quiz Not Found</h2>
            <p className="text-gray-500 mt-2">This quiz doesn't exist or has been deleted</p>
            <Button
              onClick={handleBack}
              variant="outline"
              className="mt-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render quiz
  return (
    <QuizStudy
      questions={quizSet.questions}
      quizId={quizSet.id}
      quizName={quizSet.name}
      isAIGenerated={quizSet.isAIGenerated}
      timeLimit={quizSet.timeLimit}
      onBack={handleBack}
    />
  )
}