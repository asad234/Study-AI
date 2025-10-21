"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import FlashcardsStudy from "@/components/Dashboard/Study-tool/Cards/flashcards-study"



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

interface FlashcardSet {
  id: string
  name: string
  cardCount: number
  status: string
  subject?: string
  flashcards: string[] | Flashcard[]
}

export default function StudyFlashcardSetPage() {
  const params = useParams()
  const router = useRouter()
  const setId = params.id as string

  const [loading, setLoading] = useState(true)
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the flashcard set
        const setResponse = await fetch(`/api/flashcard-sets/${setId}`)
        const setData = await setResponse.json()

        if (!setData.success) {
          throw new Error(setData.error || "Failed to fetch flashcard set")
        }

        setFlashcardSet(setData.flashcardSet)

        // Fetch all flashcards in this set
        const flashcardsResponse = await fetch(`/api/flashcard-sets/${setId}/flashcards`)
        const flashcardsData = await flashcardsResponse.json()

        if (!flashcardsData.success) {
          throw new Error(flashcardsData.error || "Failed to fetch flashcards")
        }

        if (flashcardsData.flashcards.length === 0) {
          throw new Error("This flashcard set has no cards")
        }

        setFlashcards(flashcardsData.flashcards)
      } catch (err) {
        console.error("Error fetching flashcard set:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load flashcard set"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (setId) {
      fetchFlashcardSet()
    }
  }, [setId])

  const handleBack = () => {
    router.push("/dashboard/flash-cards")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading flashcard set...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Flashcard Set Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {error || "The flashcard set you're looking for doesn't exist or has been deleted."}
              </p>
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Flashcards
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <FlashcardsStudy
          flashcards={flashcards}
          onBack={handleBack}
          projectName={flashcardSet.name}
          projectId={flashcardSet.id}
        />
      </div>
    </div>
  )
}