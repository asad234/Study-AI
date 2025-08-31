"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RotateCcw, ChevronLeft, ChevronRight, Shuffle, BookOpen, CheckCircle, X, Star, BarChart3 } from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  subject: string
  mastered: boolean
}

const sampleCards: Flashcard[] = [
  {
    id: "1",
    question: "What is photosynthesis?",
    answer:
      "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
    difficulty: "medium",
    subject: "Biology",
    mastered: false,
  },
  {
    id: "2",
    question: "What is the formula for the area of a circle?",
    answer: "The formula for the area of a circle is A = πr², where r is the radius of the circle.",
    difficulty: "easy",
    subject: "Mathematics",
    mastered: true,
  },
  {
    id: "3",
    question: 'Who wrote "To Kill a Mockingbird"?',
    answer: 'Harper Lee wrote "To Kill a Mockingbird", published in 1960.',
    difficulty: "easy",
    subject: "Literature",
    mastered: false,
  },
  {
    id: "4",
    question: "What is the difference between mitosis and meiosis?",
    answer:
      "Mitosis produces two identical diploid cells for growth and repair, while meiosis produces four genetically different haploid gametes for reproduction.",
    difficulty: "hard",
    subject: "Biology",
    mastered: false,
  },
]

export default function FlashcardsPage() {
  const [cards] = useState<Flashcard[]>(sampleCards)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState<"all" | "unmastered">("all")

  const filteredCards = studyMode === "all" ? cards : cards.filter((card) => !card.mastered)
  const currentCard = filteredCards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / filteredCards.length) * 100

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
    // In a real app, you would shuffle the cards array
  }

  const markAsKnown = () => {
    // In a real app, you would update the card's mastered status
    nextCard()
  }

  const markAsUnknown = () => {
    // In a real app, you would update the card's mastered status
    nextCard()
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

  if (!currentCard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">No cards available. Upload some study materials first!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">Study with AI-generated flashcards from your materials</p>
        </div>
        <div className="flex gap-2">
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

      {/* Progress */}
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

      {/* Main Flashcard */}
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

      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Navigation */}
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

        {/* Study Actions */}
        {isFlipped && (
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={markAsUnknown}>
              <X className="w-4 h-4 mr-2" />
              Need Review
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={markAsKnown}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Got It!
            </Button>
          </div>
        )}

        {/* Additional Controls */}
        <div className="flex justify-center">
          <Button variant="ghost" onClick={shuffleCards}>
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle Cards
          </Button>
        </div>
      </div>

      {/* Study Stats */}
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
  )
}
