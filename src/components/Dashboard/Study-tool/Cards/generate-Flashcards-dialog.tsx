"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GenerateFlashcardDialogProps {
  onFlashcardsGenerated?: (flashcards: Flashcard[]) => void
  trigger?: React.ReactNode
}

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
}

export default function GenerateFlashcardDialog({ onFlashcardsGenerated, trigger }: GenerateFlashcardDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [context, setContext] = useState("")
  const [count, setCount] = useState("5")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mix">("mix")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your flashcards",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          context: context.trim(),
          count: Number.parseInt(count),
          difficulty: difficulty === "mix" ? ["easy", "medium", "hard"] : [difficulty],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.flashcards) {
          toast({
            title: "Flashcards generated!",
            description: `Created ${data.flashcards.length} flashcards`,
          })
          onFlashcardsGenerated?.(data.flashcards)
          setOpen(false)
          resetForm()
        } else {
          throw new Error("Invalid response format")
        }
      } else {
        throw new Error("Failed to generate flashcards")
      }
    } catch (error) {
      console.error("Flashcard generation error:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setTopic("")
    setContext("")
    setCount("5")
    setDifficulty("mix")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Generate Flashcards with AI</DialogTitle>
          <DialogDescription>Enter a topic and optional context to generate flashcards automatically</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium">
              Topic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g., Photosynthesis, World War II, Python Functions"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium">
              Additional Context <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="context"
              placeholder="Add any specific details, focus areas, or learning objectives..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count" className="text-sm font-medium">
                Number of Cards
              </Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger id="count" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Cards</SelectItem>
                  <SelectItem value="5">5 Cards</SelectItem>
                  <SelectItem value="10">10 Cards</SelectItem>
                  <SelectItem value="15">15 Cards</SelectItem>
                  <SelectItem value="20">20 Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as typeof difficulty)}>
                <SelectTrigger id="difficulty" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mix">Mix</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
