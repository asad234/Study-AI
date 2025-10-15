// components/ExamGenerationDialog.tsx
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sparkles, Brain, BookOpen, Zap, Heart, Target, Award } from "lucide-react"
import { useEffect, useState } from "react"

interface ExamGenerationDialogProps {
  open: boolean
  documentCount: number
  questionCount: number
  duration: number
  stage: "extracting" | "generating" | "complete"
}

export function ExamGenerationDialog({ 
  open, 
  documentCount,
  questionCount,
  duration,
  stage 
}: ExamGenerationDialogProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  
  const encouragingMessages = [
    {
      icon: Target,
      text: "Preparing your comprehensive exam...",
      subtext: "Every question is carefully designed to test your knowledge",
      color: "text-purple-500"
    },
    {
      icon: Brain,
      text: "Excellence requires patience",
      subtext: "We're analyzing your materials to create meaningful challenges",
      color: "text-blue-500"
    },
    {
      icon: BookOpen,
      text: "Your success is our mission",
      subtext: "Each question represents hours of content analysis",
      color: "text-green-500"
    },
    {
      icon: Zap,
      text: "Quality takes time",
      subtext: "Creating the perfect exam to test your understanding",
      color: "text-yellow-500"
    },
    {
      icon: Heart,
      text: "We believe in your potential",
      subtext: "Every moment of preparation brings you closer to mastery",
      color: "text-red-500"
    },
    {
      icon: Award,
      text: "Greatness awaits",
      subtext: "Your personalized exam is being crafted with care",
      color: "text-pink-500"
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
  
  // Calculate estimated time based on document count and questions
  const estimatedSeconds = (documentCount * 5) + (questionCount * 2) + 10
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
            
            {/* Status Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {stage === "extracting" ? "📝 Extracting text..." : "📋 Generating exam..."}
                </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {documentCount} document{documentCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Questions
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {questionCount} questions
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Duration
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {duration} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Estimated time: <span className="font-semibold">{estimatedTime}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              More documents = More comprehensive exam 🎓
            </p>
          </div>

          {/* Patience Message */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-center text-gray-700 dark:text-gray-300">
              <span className="font-semibold">💜 Have patience</span>
              <br />
              <span className="text-xs">Your comprehensive exam is being crafted with precision</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}