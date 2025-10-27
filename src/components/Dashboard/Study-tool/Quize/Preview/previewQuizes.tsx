"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, HelpCircle, ArrowRight, Clock, Trophy, RefreshCw, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Quiz {
  id: string
  name: string
  questionCount?: number
  status?: string
  createdAt?: string
  difficulty?: string
  timeLimit?: number
  lastScore?: number
  isAIGenerated?: boolean
  subject?: string
  description?: string
}

interface PreviewQuizzesProps {
  buttonText?: string
  className?: string
}

const PreviewQuizzes: React.FC<PreviewQuizzesProps> = ({ buttonText = "Preview Quizzes", className = "" }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quizSets, setQuizSets] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)

  const router = useRouter()

  const fetchQuizSets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/quiz-sets")
      const data = await response.json()

      if (data.success) {
        setQuizSets(data.quizSets)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch quiz sets",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching quiz sets:", error)
      toast({
        title: "Error",
        description: "Failed to load quiz sets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isDialogOpen) {
      fetchQuizSets()
    }
  }, [isDialogOpen])

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleTakeQuiz = (quizId: string) => {
    // Navigate to quiz study page
    router.push(`/dashboard/quiz/study/${quizId}`)
  }

  const handleDeleteClick = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation()
    setQuizToDelete(quiz)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return

    setDeleteLoading(quizToDelete.id)

    try {
      const response = await fetch(`/api/quiz-sets/${quizToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setQuizSets((prev) => prev.filter((quiz) => quiz.id !== quizToDelete.id))

        toast({
          title: "Success",
          description: `"${quizToDelete.name}" has been deleted`,
        })

        setDeleteDialogOpen(false)
        setQuizToDelete(null)
      } else {
        throw new Error(data.error || "Failed to delete quiz set")
      }
    } catch (error) {
      console.error("Error deleting quiz set:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete quiz set",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setQuizToDelete(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "active":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        className={`gap-2 hover:bg-purple-50 hover:border-purple-300 ${className}`}
      >
        <Eye className="w-4 h-4" />
        {buttonText}
      </Button>

      {/* Main Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Your Quiz Sets
                </DialogTitle>
                <DialogDescription>View, retake, and manage all your saved quizzes.</DialogDescription>
              </div>
              <Button onClick={fetchQuizSets} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : quizSets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Saved Quizzes Yet</h3>
                <p className="text-gray-500">Complete a quiz and save it to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizSets.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="hover:shadow-md transition-shadow duration-200 border-2 hover:border-purple-200 relative group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">{quiz.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {quiz.status && (
                            <Badge variant={getStatusColor(quiz.status)} className="text-xs shrink-0">
                              {quiz.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteClick(quiz, e)}
                            disabled={deleteLoading === quiz.id}
                          >
                            {deleteLoading === quiz.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            {quiz.questionCount || 0} questions
                          </span>
                          {quiz.createdAt && <span className="text-xs">{formatDate(quiz.createdAt)}</span>}
                        </div>

                        {/* Quiz Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {quiz.difficulty && (
                              <span
                                className={`px-2 py-1 text-xs rounded-md border ${getDifficultyColor(quiz.difficulty)}`}
                              >
                                {quiz.difficulty}
                              </span>
                            )}
                            {quiz.timeLimit && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                {quiz.timeLimit}min
                              </span>
                            )}
                          </div>

                          {quiz.lastScore !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Last Score:</span>
                              <span
                                className={`flex items-center gap-1 text-sm font-semibold ${getScoreColor(quiz.lastScore)}`}
                              >
                                <Trophy className="w-3 h-3" />
                                {quiz.lastScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* AI/Custom Badge */}
                        <div className="flex justify-start">
                          <Badge
                            variant={quiz.isAIGenerated ? "secondary" : "outline"}
                            className={`text-xs ${quiz.isAIGenerated ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {/* 
                            {quiz.isAIGenerated ? 'AI Generated Quiz' : 'Custom Made'}*/}
                          </Badge>
                        </div>

                        <Button
                          onClick={() => handleTakeQuiz(quiz.id)}
                          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                          disabled={quiz.status === "draft"}
                        >
                          {quiz.status === "draft" ? "Coming Soon" : "Retake Quiz"}
                          {quiz.status !== "draft" && <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleCloseDialog} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle>Delete Quiz Set</DialogTitle>
                <DialogDescription>This action cannot be undone.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold">"{quizToDelete?.name}"</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will permanently delete the quiz with {quizToDelete?.questionCount || 0} question(s) and your score
              of {quizToDelete?.lastScore || 0}%.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDelete} disabled={deleteLoading !== null}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteLoading !== null}>
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PreviewQuizzes
