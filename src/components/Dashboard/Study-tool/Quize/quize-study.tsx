"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, CheckCircle, X, RotateCcw, Trophy, ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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
 * Score written answers with partial credit (returns 0-100 percentage)
 */
function scoreWrittenAnswer(userAnswer: string, correctAnswer: string): number {
  if (!userAnswer || userAnswer.trim().length === 0) return 0

  const similarity = calculateStringSimilarity(userAnswer, correctAnswer)
  const conceptMatch = calculateConceptualMatch(userAnswer, correctAnswer)

  const combinedScore = similarity * 0.4 + conceptMatch * 0.6

  return Math.round(combinedScore * 100)
}

/**
 * Calculate points for a question based on difficulty and type
 */
function calculateQuestionPoints(difficulty: "easy" | "medium" | "hard", isOpenEnded: boolean): number {
  const basePoints = {
    easy: 3,
    medium: 5,
    hard: 7,
  }

  let points = basePoints[difficulty]

  if (isOpenEnded) {
    points += 1
  }

  return points
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
  type?: "multiple_choice" | "open_ended"
  openEndedAnswer?: string
  points?: number // Added points field for each question
}

interface QuizResult {
  questionId: string
  selectedAnswer: number
  textAnswer?: string
  isCorrect: boolean
  timeSpent: number
  scorePercentage?: number
  pointsEarned?: number // Added points earned for this question
  maxPoints?: number // Added max points for this question
}

interface QuizStudyProps {
  questions: Question[]
  quizId: string
  quizName?: string
  isAIGenerated?: boolean
  timeLimit?: number
  onBack: () => void
}

export default function QuizStudy({
  questions,
  quizId,
  quizName = "Quiz",
  isAIGenerated = false,
  timeLimit,
  onBack,
}: QuizStudyProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState<string>("")
  const [allAnswers, setAllAnswers] = useState<Map<number, { selected: number | null; text: string }>>(new Map())
  const [showResult, setShowResult] = useState(false) // Removed - no longer showing immediate results
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isOpenEnded = currentQuestion.type === "open_ended"
  const maxPoints = currentQuestion.points || calculateQuestionPoints(currentQuestion.difficulty, isOpenEnded)

  const loadSavedAnswer = (questionIndex: number) => {
    const savedAnswer = allAnswers.get(questionIndex)
    if (savedAnswer) {
      setSelectedAnswer(savedAnswer.selected)
      setTextAnswer(savedAnswer.text)
    } else {
      setSelectedAnswer(null)
      setTextAnswer("")
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setAllAnswers((prev) => {
        const newMap = new Map(prev)
        newMap.set(currentQuestionIndex, { selected: selectedAnswer, text: textAnswer })
        return newMap
      })

      setCurrentQuestionIndex((prev) => prev - 1)

      loadSavedAnswer(currentQuestionIndex - 1)
    }
  }

  const handleSubmitAnswer = () => {
    if (!isOpenEnded && selectedAnswer === null) return
    if (isOpenEnded && !textAnswer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please write your answer before submitting.",
        variant: "destructive",
      })
      return
    }

    setAllAnswers((prev) => {
      const newMap = new Map(prev)
      newMap.set(currentQuestionIndex, { selected: selectedAnswer, text: textAnswer })
      return newMap
    })

    const timeSpent = Date.now() - startTime

    let isCorrect = false
    let scorePercentage = 0
    let pointsEarned = 0

    if (isOpenEnded) {
      const correctAnswerStr = currentQuestion.openEndedAnswer || currentQuestion.explanation
      scorePercentage = scoreWrittenAnswer(textAnswer, correctAnswerStr)
      pointsEarned = Math.round((scorePercentage / 100) * maxPoints * 10) / 10
      isCorrect = scorePercentage >= 90
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer
      scorePercentage = isCorrect ? 100 : 0
      pointsEarned = isCorrect ? maxPoints : 0
    }

    const result: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer: isOpenEnded ? 0 : selectedAnswer!,
      textAnswer: isOpenEnded ? textAnswer : undefined,
      isCorrect,
      timeSpent,
      scorePercentage,
      pointsEarned,
      maxPoints,
    }

    setQuizResults((prev) => [...prev, result])

    handleNextQuestion(result)
  }

  const handleNextQuestion = async (newResult?: QuizResult) => {
    const updatedResults = newResult ? [...quizResults, newResult] : quizResults

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      loadSavedAnswer(currentQuestionIndex + 1)
      setStartTime(Date.now())
    } else {
      setQuizCompleted(true)

      try {
        await fetch("/api/quiz/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            answers: updatedResults.map((result) => ({
              questionId: result.questionId,
              selectedAnswer: result.selectedAnswer,
              textAnswer: result.textAnswer,
              timeSpent: result.timeSpent,
              pointsEarned: result.pointsEarned,
            })),
            totalTime: Date.now() - startTime,
          }),
        })
      } catch (error) {
        console.error("Failed to save quiz attempt:", error)
      }
    }
  }

  const handleSaveQuiz = async () => {
    if (isSaving || isSaved) return

    setIsSaving(true)

    try {
      const score = calculateScore()
      const percentage = score.total > 0 ? Math.round((score.earned / score.total) * 100) : 0

      const response = await fetch("/api/quiz-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quizName,
          questions: questions,
          questionCount: questions.length,
          difficulty: currentQuestion.difficulty,
          timeLimit: timeLimit,
          lastScore: percentage, // Save as percentage (0-100)
          isAIGenerated: isAIGenerated,
          subject: currentQuestion.subject,
          quizResults: quizResults,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSaved(true)
        toast({
          title: "Quiz Saved!",
          description: data.message || `"${quizName}" has been saved to your quiz library.`,
        })
      } else {
        throw new Error(data.error || "Failed to save quiz")
      }
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setTextAnswer("")
    setAllAnswers(new Map())
    setQuizResults([])
    setQuizCompleted(false)
    setStartTime(Date.now())
    setIsSaved(false)
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
    if (quizResults.length === 0) return { earned: 0, total: 0 }

    const totalEarned = quizResults.reduce((sum, result) => sum + (result.pointsEarned ?? 0), 0)
    const totalMax = quizResults.reduce((sum, result) => sum + (result.maxPoints ?? 5), 0)

    return {
      earned: Math.round(totalEarned * 10) / 10, // Round to 1 decimal
      total: totalMax,
    }
  }

  const calculateDetailedStats = () => {
    const fullyCorrect = quizResults.filter((r) => (r.scorePercentage ?? 0) >= 90).length
    const partialCredit = quizResults.filter((r) => {
      const score = r.scorePercentage ?? 0
      return score > 0 && score < 90
    }).length
    const incorrect = quizResults.filter((r) => (r.scorePercentage ?? 0) === 0).length

    return { fullyCorrect, partialCredit, incorrect }
  }

  if (quizCompleted) {
    const score = calculateScore()
    const stats = calculateDetailedStats()
    const hasPartialCredit = stats.partialCredit > 0

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quiz Selection
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Quiz Complete!
            </h1>
            <p className="text-lg text-muted-foreground">Here are your results</p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Your Score</CardTitle>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                {score.earned}/{score.total}
              </div>
              <CardDescription className="text-lg">
                {stats.fullyCorrect} out of {questions.length} questions fully correct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {hasPartialCredit ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-6 border-2 border-green-200 rounded-xl bg-green-50 dark:bg-green-950/30 backdrop-blur-sm">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-green-600">{stats.fullyCorrect}</p>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Fully Correct</p>
                  </div>
                  <div className="text-center p-6 border-2 border-yellow-200 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 backdrop-blur-sm">
                    <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-yellow-600">{stats.partialCredit}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Partial Credit</p>
                  </div>
                  <div className="text-center p-6 border-2 border-red-200 rounded-xl bg-red-50 dark:bg-red-950/30 backdrop-blur-sm">
                    <X className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-red-600">{stats.incorrect}</p>
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">Incorrect</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 border-2 border-green-200 rounded-xl bg-green-50 dark:bg-green-950/30 backdrop-blur-sm">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-green-600">{stats.fullyCorrect}</p>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Correct</p>
                  </div>
                  <div className="text-center p-6 border-2 border-red-200 rounded-xl bg-red-50 dark:bg-red-950/30 backdrop-blur-sm">
                    <X className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-red-600">{questions.length - stats.fullyCorrect}</p>
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">Incorrect</p>
                  </div>
                </div>
              )}

              {hasPartialCredit && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    💫 Partial Credit Awarded
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    You received partial credit on {stats.partialCredit} question{stats.partialCredit > 1 ? "s" : ""}{" "}
                    based on answer quality and key concept coverage.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Review</h3>
                {questions.map((question, index) => {
                  const result = quizResults[index]
                  if (!result) return null

                  const isQuestionOpenEnded = question.type === "open_ended"
                  const scorePercent = result.scorePercentage ?? 0
                  const pointsEarned = result.pointsEarned ?? 0
                  const maxPoints = result.maxPoints ?? 5

                  return (
                    <div key={question.id} className="p-6 border-2 rounded-xl bg-card/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-base">Question {index + 1}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {isQuestionOpenEnded ? "Open-Ended" : "Multiple Choice"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {scorePercent >= 90 ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : scorePercent > 0 ? (
                            <AlertCircle className="w-6 h-6 text-yellow-500" />
                          ) : (
                            <X className="w-6 h-6 text-red-500" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              scorePercent >= 90
                                ? "bg-green-100 text-green-700 border-green-300"
                                : scorePercent >= 70
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                  : scorePercent >= 50
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "bg-red-100 text-red-700 border-red-300"
                            }
                          >
                            {pointsEarned}/{maxPoints}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{question.question}</p>

                      {isQuestionOpenEnded ? (
                        <div className="text-sm space-y-3 bg-muted/50 p-4 rounded-lg">
                          {scorePercent > 0 && scorePercent < 90 && (
                            <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-900 dark:text-yellow-300">
                                <strong>Partial Credit:</strong> You earned {pointsEarned} out of {maxPoints} points (
                                {scorePercent}% of key concepts).
                                {scorePercent >= 70
                                  ? " Great work!"
                                  : scorePercent >= 50
                                    ? " You're on the right track!"
                                    : " Review the model answer for improvement."}
                              </p>
                            </div>
                          )}

                          <div className="mb-3">
                            <Progress value={scorePercent} className="h-2 mb-2" />
                            <p className="text-xs text-muted-foreground text-center">Answer Quality: {scorePercent}%</p>
                          </div>

                          <div className="p-4 border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">📝 Your Answer:</p>
                            <p className="text-foreground whitespace-pre-wrap">{result.textAnswer}</p>
                          </div>

                          <div className="p-4 border-2 border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="font-medium text-green-900 dark:text-green-300 mb-2">✓ Model Answer:</p>
                            <p className="text-foreground whitespace-pre-wrap">
                              {question.openEndedAnswer || question.explanation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg">
                          <p
                            className={
                              result.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }
                          >
                            <span className="font-medium">Your answer:</span> {question.options[result.selectedAnswer]}
                          </p>
                          {!result.isCorrect && (
                            <p className="text-green-600 dark:text-green-400">
                              <span className="font-medium">Correct answer:</span>{" "}
                              {question.options[question.correctAnswer]}
                            </p>
                          )}
                          <p className="text-muted-foreground mt-2">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={restartQuiz}
                  className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button onClick={onBack} variant="outline" className="h-12 border-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  New Quiz
                </Button>
                <Button
                  onClick={handleSaveQuiz}
                  disabled={isSaving || isSaved}
                  className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Quiz
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quiz Selection
        </Button>

        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Quiz in Progress
          </h1>
          <p className="text-lg text-muted-foreground">Test your knowledge with AI-generated questions</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 font-semibold border-2 border-blue-500 text-blue-700 dark:text-blue-300"
              >
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-base text-muted-foreground font-medium">{Math.round(progress)}% Complete</span>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-blue-100 dark:bg-blue-950" />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className={getDifficultyColor(currentQuestion.difficulty)} variant="secondary">
                {currentQuestion.difficulty}
              </Badge>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-blue-200 text-blue-700 dark:text-blue-300">
                  {currentQuestion.subject}
                </Badge>
                <Badge variant="outline" className="border-purple-200 text-purple-700 dark:text-purple-300">
                  {isOpenEnded ? "Open-Ended" : "Multiple Choice"}
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-700 dark:text-green-300">
                  {maxPoints} points
                </Badge>
              </div>
            </div>
            <CardTitle className="text-2xl leading-relaxed">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {isOpenEnded ? (
              <div className="space-y-4">
                <Label htmlFor="text-answer" className="text-base font-medium">
                  Write your answer below:
                </Label>
                <Textarea
                  id="text-answer"
                  placeholder="Type your answer here..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  rows={8}
                  className="text-base resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Write a complete answer. You'll see the results after completing all questions.
                </p>
              </div>
            ) : (
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
            )}

            <div className="flex gap-3">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="h-14 text-lg font-semibold border-2 flex-1 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleSubmitAnswer}
                disabled={isOpenEnded ? !textAnswer.trim() : selectedAnswer === null}
                className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex-[2]"
              >
                {currentQuestionIndex < questions.length - 1 ? "Submit & Next Question" : "Submit & Finish Quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
