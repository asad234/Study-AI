// components/FixDocumentsButton.tsx
// Button to trigger text extraction for documents missing content

"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface FixDocumentsButtonProps {
  onComplete?: () => void
}

export function FixDocumentsButton({ onComplete }: FixDocumentsButtonProps) {
  const [fixing, setFixing] = useState(false)
  const [open, setOpen] = useState(false)

  const handleFixDocuments = async () => {
    setFixing(true)
    
    try {
      console.log("🔧 Starting document extraction fix...")
      
      const response = await fetch("/api/documents/fix-extractions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Fix completed:", data.results)
        
        if (data.results.total === 0) {
          toast({
            title: "All Documents Ready",
            description: "All your documents already have extracted content.",
          })
          setOpen(false)
          return
        }

        toast({
          title: "Extraction Started! 🚀",
          description: `Processing ${data.results.triggered} document(s). This may take a few moments.`,
        })

        if (data.results.failed.length > 0) {
          console.warn("⚠️ Some documents failed:", data.results.failed)
          
          setTimeout(() => {
            toast({
              title: "Partial Success",
              description: `${data.results.failed.length} document(s) could not be processed. Check console for details.`,
              variant: "default",
            })
          }, 2000)
        }

        // Close the dialog
        setOpen(false)

        // Wait a bit for extraction to complete, then refresh
        setTimeout(() => {
          toast({
            title: "Refreshing...",
            description: "Loading updated documents.",
          })
          
          // Call the onComplete callback if provided, otherwise reload
          if (onComplete) {
            onComplete()
          } else {
            window.location.reload()
          }
        }, 5000) // Wait 5 seconds for extraction to complete
      } else {
        throw new Error(data.error || "Failed to fix extractions")
      }
    } catch (error) {
      console.error("❌ Fix failed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix documents",
        variant: "destructive",
      })
    } finally {
      setFixing(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          Fix Missing Content
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Extract Text from Documents
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">What this does:</p>
                <p>Automatically extracts text from documents that are marked as "ready" but have no content.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Note:</p>
                <p>This process may take 10-30 seconds depending on the number and size of documents.</p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mt-4">
              After extraction completes, the page will automatically refresh to show your updated documents.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={fixing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFixDocuments}
            disabled={fixing}
          >
            {fixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Start Extraction
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ===================================
// HOW TO USE IN YOUR PROJECTS PAGE:
// ===================================

// Import the component at the top of your file:
// import { FixDocumentsButton } from "@/components/FixDocumentsButton"

// Add it to your header section:
/*
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Flashcards</h1>
    <p className="text-gray-600 dark:text-gray-300">
      View and manage all of your study flashcard projects in one place.
    </p>
  </div>
  <div className="flex gap-3">
    <FixDocumentsButton onComplete={fetchProjects} />
    <PreviewCards className="bg-purple-700 text-white hover:bg-purple-800" />
    <ManualFlashCardCreator />
  </div>
</div>
*/