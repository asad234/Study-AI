"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Clock, CheckCircle, X, RotateCcw, Trophy } from "lucide-react"

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

export default function QuizPage() {
  const [questions] = useState<Question[]>(sampleQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setQuizResults([])
    setQuizCompleted(false)
    setStartTime(Date.now())
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

  if (quizCompleted) {
    const score = calculateScore()
    const correctAnswers = quizResults.filter((result) => result.isCorrect).length

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h1>
          <p className="text-gray-600 dark:text-gray-300">Here are your results</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Your Score</CardTitle>
            <div className="text-4xl font-bold text-primary">{score}%</div>
            <CardDescription>
              {correctAnswers} out of {questions.length} questions correct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
                <p className="text-sm text-gray-500">Correct</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{questions.length - correctAnswers}</p>
                <p className="text-sm text-gray-500">Incorrect</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Question Review</h3>
              {questions.map((question, index) => {
                const result = quizResults[index]
                return (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">Question {index + 1}</p>
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{question.question}</p>
                    {!result.isCorrect && (
                      <div className="text-xs space-y-1">
                        <p className="text-red-600">Your answer: {question.options[result.selectedAnswer]}</p>
                        <p className="text-green-600">Correct answer: {question.options[question.correctAnswer]}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-4">
              <Button onClick={restartQuiz} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/dashboard">Back to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Generator</h1>
        <p className="text-gray-600 dark:text-gray-300">Test your knowledge with AI-generated questions</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>{currentQuestion.difficulty}</Badge>
            <Badge variant="outline">{currentQuestion.subject}</Badge>
          </div>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showResult ? (
            <>
              <RadioGroup
                value={selectedAnswer?.toString()}
                onValueChange={(value) => handleAnswerSelect(Number.parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} className="w-full">
                Submit Answer
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Incorrect"}
                  </span>
                </div>

                {selectedAnswer !== currentQuestion.correctAnswer && (
                  <p className="text-sm mb-2">
                    The correct answer is: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                  </p>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300">{currentQuestion.explanation}</p>
              </div>

              <Button onClick={handleNextQuestion} className="w-full">
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
