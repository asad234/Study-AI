// components/FlashcardGenerationDialog.tsx
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sparkles, Brain, BookOpen, Zap, Heart } from "lucide-react"
import { useEffect, useState } from "react"

interface FlashcardGenerationDialogProps {
  open: boolean
  documentCount: number
  stage: "extracting" | "generating" | "complete"
}

export function FlashcardGenerationDialog({ 
  open, 
  documentCount,
  stage 
}: FlashcardGenerationDialogProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  
  const encouragingMessages = [
    {
      icon: Sparkles,
      text: "Good things take time...",
      subtext: "We're crafting the perfect flashcards for you",
      color: "text-purple-500"
    },
    {
      icon: Brain,
      text: "Your learning journey matters to us",
      subtext: "Each flashcard is carefully designed for your success",
      color: "text-blue-500"
    },
    {
      icon: BookOpen,
      text: "Knowledge is being distilled...",
      subtext: "We're extracting the key concepts from your documents",
      color: "text-green-500"
    },
    {
      icon: Zap,
      text: "Quality over speed",
      subtext: "Great study materials are worth the wait",
      color: "text-yellow-500"
    },
    {
      icon: Heart,
      text: "We care about your success",
      subtext: "Every moment of waiting is an investment in your learning",
      color: "text-red-500"
    }
  ]

  // Rotate messages every 4 seconds
  useEffect(() => {
    if (!open) return
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % encouragingMessages.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [open])

  const currentMessage = encouragingMessages[messageIndex]
  const Icon = currentMessage.icon
  
  // Calculate estimated time based on document count
  const estimatedSeconds = documentCount * 3 // ~3 seconds per document
  const estimatedTime = estimatedSeconds < 60 
    ? `${estimatedSeconds} seconds` 
    : `${Math.ceil(estimatedSeconds / 60)} minute${Math.ceil(estimatedSeconds / 60) > 1 ? 's' : ''}`

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md border-none shadow-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
          {/* Animated Icon Container */}
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800 animate-spin-slow" 
                 style={{ 
                   width: '120px', 
                   height: '120px',
                   borderTopColor: 'transparent',
                   borderRightColor: 'transparent'
                 }} 
            />
            
            {/* Middle pulsing ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-pulse-slow"
                 style={{ 
                   width: '120px', 
                   height: '120px',
                   margin: '8px',
                 }}
            />
            
            {/* Inner icon container */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg animate-float">
              <Icon className={`w-16 h-16 ${currentMessage.color} transition-all duration-500`} />
            </div>
            
            {/* Floating sparkles */}
            <div className="absolute top-0 right-0 animate-ping-slow">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="absolute bottom-0 left-0 animate-ping-slow" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          {/* Message Content */}
          <div className="text-center space-y-3 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-500">
              {currentMessage.text}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300 transition-all duration-500">
              {currentMessage.subtext}
            </p>
          </div>

          {/* Progress Info */}
          <div className="w-full space-y-3">
            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 animate-progress" />
            </div>
            
            {/* Document Count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {stage === "extracting" ? "📝 Extracting text..." : "🤖 Generating flashcards..."}
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {documentCount} document{documentCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Estimated time: <span className="font-semibold">{estimatedTime}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              More documents = Better study session 📚
            </p>
          </div>

          {/* Patience Message */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-center text-gray-700 dark:text-gray-300">
              <span className="font-semibold">💜 Have patience</span>
              <br />
              <span className="text-xs">Quality flashcards are being crafted just for you</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add these custom animations to your globals.css or tailwind.config.js
/*
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.05); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes ping-slow {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-progress {
  animation: progress 2s ease-in-out infinite;
}

.animate-ping-slow {
  animation: ping-slow 3s ease-in-out infinite;
}
*/