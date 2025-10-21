"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ArrowLeft,
  Save,
  Loader2,
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

interface FlashcardsStudyProps {
  flashcards: Flashcard[]
  onBack: () => void
  projectName?: string
  projectId?: string
}

export default function FlashcardsStudy({ 
  flashcards, 
  onBack, 
  projectName, 
  projectId 
}: FlashcardsStudyProps) {
  const [cards, setCards] = useState<Flashcard[]>(flashcards)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState<"all" | "unmastered">("all")
  const [isSaving, setIsSaving] = useState(false)
  
  // Name dialog state
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [setName, setSetName] = useState("")

  const updateFlashcardStatus = async (flashcardId: string, mastered: boolean) => {
    try {
      // Update local state immediately for instant feedback
      setCards((prev) =>
        prev.map((card) =>
          card.id === flashcardId ? { ...card, mastered, review_count: (card.review_count || 0) + 1 } : card,
        ),
      )

      // Save to database in the background
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mastered,
          review_count: (cards.find(c => c.id === flashcardId)?.review_count || 0) + 1,
          last_reviewed: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        console.error('Failed to save flashcard status to database')
      }
    } catch (error) {
      console.error("Failed to update flashcard:", error)
    }
  }

  const handleSaveClick = () => {
    // Suggest a default name based on project or date
    const defaultName = projectName 
      ? `${projectName} - Study Set` 
      : `Study Set - ${new Date().toLocaleDateString()}`
    
    setSetName(defaultName)
    setShowNameDialog(true)
  }

  const saveFlashcardSet = async () => {
    if (!setName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your flashcard set",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
    try {
      const flashcardIds = cards.map(card => card.id)
      
      const response = await fetch('/api/flashcard-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setName.trim(),
          subject: cards[0]?.subject || 'Mixed',
          status: 'active',
          projectId: projectId,
          flashcardIds: flashcardIds,
          description: `Study set with ${flashcardIds.length} flashcards`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: `Saved ${flashcardIds.length} flashcard(s) to "${setName.trim()}"`,
        })
        setShowNameDialog(false)
        setSetName("")
      } else {
        throw new Error(data.error || 'Failed to save flashcard set')
      }
    } catch (error) {
      console.error("Failed to save flashcard set:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save flashcard set",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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

  if (!currentCard) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">No flashcards available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-300">
                {projectName ? `Studying: ${projectName}` : 'Study with AI-generated flashcards'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSaveClick}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Cards
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

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name Your Flashcard Set</DialogTitle>
            <DialogDescription>
              Give your flashcard set a memorable name. You can always change it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="set-name">Set Name</Label>
              <Input
                id="set-name"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="e.g., Biology Chapter 3 - Cell Structure"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && setName.trim()) {
                    saveFlashcardSet()
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                {cards.length} flashcard{cards.length !== 1 ? 's' : ''} will be saved
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowNameDialog(false)
                setSetName("")
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveFlashcardSet}
              disabled={!setName.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Set
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}