"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  BookOpen,
  CheckCircle,
  X,
  Star,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  subject: string
  mastered: boolean
  review_count?: number
  last_reviewed?: string
}

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  status: string
  created_at: string
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loadingCards, setLoadingCards] = useState(true)
  const [generatingCards, setGeneratingCards] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState<"all" | "unmastered">("all")
  const [materials, setMaterials] = useState<Document[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const { data: session } = useSession()

  const fetchFlashcards = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch("/api/flashcards")
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.flashcards)) {
          setCards(data.flashcards)
        }
      }
    } catch (error) {
      console.error("Failed to fetch flashcards:", error)
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/documents")
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.documents)) {
            setMaterials(data.documents)
          }
        }
      } catch (error) {
        console.error("Failed to fetch materials:", error)
      } finally {
        setLoadingMaterials(false)
      }
    }

    fetchMaterials()
    fetchFlashcards()
  }, [session])

  const generateFlashcards = async () => {
    const readyMaterials = materials.filter((m) => m.status === "ready")

    if (readyMaterials.length === 0) {
      console.error("No ready materials available for flashcard generation")
      return
    }

    setGeneratingCards(true)

    try {
      console.log("Starting flashcard generation...")
      console.log("Ready materials:", readyMaterials)
      console.log("Using document ID:", readyMaterials[0].id)

      const requestBody = {
        subject: "Mixed",
        documentId: readyMaterials[0].id,
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
        await fetchFlashcards()
        setCurrentCardIndex(0)
        setIsFlipped(false)
      } else {
        console.error("Failed to generate flashcards:", data.error)
        console.error("Full error response:", data)
      }
    } catch (error) {
      console.error("Failed to generate flashcards:", error)
      console.error("Network or parsing error:", error)
    } finally {
      setGeneratingCards(false)
    }
  }

  const updateFlashcardStatus = async (flashcardId: string, mastered: boolean) => {
    try {
      setCards((prev) =>
        prev.map((card) =>
          card.id === flashcardId ? { ...card, mastered, review_count: (card.review_count || 0) + 1 } : card,
        ),
      )
    } catch (error) {
      console.error("Failed to update flashcard:", error)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />
    if (type.includes("doc")) return <FileText className="w-4 h-4 text-blue-500" />
    if (type.includes("ppt")) return <FileText className="w-4 h-4 text-orange-500" />
    if (type.includes("image")) return <FileText className="w-4 h-4 text-green-500" />
    return <FileText className="w-4 h-4 text-gray-500" />
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
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

  const filteredCards = studyMode === "all" ? cards : cards.filter((card) => !card.mastered)
  const currentCard = filteredCards[currentCardIndex]
  const progress = filteredCards.length > 0 ? ((currentCardIndex + 1) / filteredCards.length) * 100 : 0

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    setIsFlipped(false)
  }

  const shuffleCards = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const markAsKnown = () => {
    if (currentCard) {
      updateFlashcardStatus(currentCard.id, true)
    }
    nextCard()
  }

  const markAsUnknown = () => {
    if (currentCard) {
      updateFlashcardStatus(currentCard.id, false)
    }
    nextCard()
  }

  if (loadingCards) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">Loading your flashcards...</p>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">No flashcards available yet.</p>
        </div>

        {materials.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generate AI Flashcards</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create study flashcards from your uploaded materials using AI
              </p>
              <Button
                onClick={generateFlashcards}
                disabled={generatingCards || materials.filter((m) => m.status === "ready").length === 0}
              >
                {generatingCards ? "Generating..." : "Generate Flashcards"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-300">Study with AI-generated flashcards from your materials</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={generateFlashcards}
              disabled={generatingCards || materials.filter((m) => m.status === "ready").length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingCards ? "Generating..." : "Generate More"}
            </Button>
            <Button variant={studyMode === "all" ? "default" : "outline"} onClick={() => setStudyMode("all")}>
              All Cards
            </Button>
            <Button
              variant={studyMode === "unmastered" ? "default" : "outline"}
              onClick={() => setStudyMode("unmastered")}
            >
              Review Mode
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Card {currentCardIndex + 1} of {filteredCards.length}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Card
              className="min-h-[400px] cursor-pointer transition-transform hover:scale-105"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(currentCard.difficulty)}>{currentCard.difficulty}</Badge>
                  <Badge variant="outline">{currentCard.subject}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px] p-8">
                <div className="text-center">
                  {!isFlipped ? (
                    <div>
                      <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-4">Question</h3>
                      <p className="text-lg leading-relaxed">{currentCard.question}</p>
                      <p className="text-sm text-gray-500 mt-6">Click to reveal answer</p>
                    </div>
                  ) : (
                    <div>
                      <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-4">Answer</h3>
                      <p className="text-lg leading-relaxed">{currentCard.answer}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={prevCard}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Flip Card
            </Button>
            <Button variant="outline" onClick={nextCard}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {isFlipped && (
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="text-red-600 border-red-200 bg-transparent" onClick={markAsUnknown}>
                <X className="w-4 h-4 mr-2" />
                Need Review
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={markAsKnown}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Got It!
              </Button>
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="ghost" onClick={shuffleCards}>
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Cards
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-sm text-gray-500">Total Cards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{cards.filter((c) => c.mastered).length}</p>
              <p className="text-sm text-gray-500">Mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{cards.filter((c) => !c.mastered).length}</p>
              <p className="text-sm text-gray-500">To Review</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Available Materials
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMaterials ? (
              <div className="text-sm text-gray-500">Loading materials...</div>
            ) : materials.length > 0 ? (
              <>
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                  >
                    {getFileIcon(material.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{material.file_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{material.file_type}</p>
                      <Badge className={`text-xs mt-1 ${getStatusBadgeColor(material.status)}`}>
                        {material.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={generateFlashcards}
                  disabled={generatingCards || materials.filter((m) => m.status === "ready").length === 0}
                  className="w-full mt-3"
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatingCards ? "Generating..." : "Generate Flashcards"}
                </Button>
              </>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No materials uploaded yet. Upload some study materials to generate flashcards!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}