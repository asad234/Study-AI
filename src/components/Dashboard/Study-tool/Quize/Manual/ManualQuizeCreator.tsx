"use client"
import type React from "react"
import { useState, type ChangeEvent, type JSX } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Plus,
  Upload,
  X,
  FileText,
  Presentation,
  ImageIcon,
  Sparkles,
  Edit3,
  Trash2,
  Save,
  BookOpen,
  Bot,
  Loader2,
  CheckCircle,
  Circle,
  Wand2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface QuizQuestion {
  question: string
  type: "multiple_choice" | "open_ended"
  alternatives: { text: string; isCorrect: boolean }[]
  correctAnswer: string
}

interface FileWithMetadata {
  file: File
  name: string
  size: number
  type: string
  documentId?: string
}

interface ManualQuizCreatorEnhancedProps {
  onQuizCreated?: (quiz: any) => void
}

const ManualQuizCreatorEnhanced: React.FC<ManualQuizCreatorEnhancedProps> = ({ onQuizCreated }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [quizName, setQuizName] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [studyGoal, setStudyGoal] = useState<string>("")
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])

  const [currentQuestionText, setCurrentQuestionText] = useState<string>("")
  const [currentQuestionType, setCurrentQuestionType] = useState<"multiple_choice" | "open_ended">("multiple_choice")
  const [multipleChoiceAlternatives, setMultipleChoiceAlternatives] = useState<string[]>(["", "", "", ""])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>("")

  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState<boolean>(false)
  const [isGeneratingAlternatives, setIsGeneratingAlternatives] = useState<boolean>(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false)
  const [isCreatingQuiz, setIsCreatingQuiz] = useState<boolean>(false)

  const [aiAnswerSource, setAiAnswerSource] = useState<string>("")
  const [isGeneralAnswer, setIsGeneralAnswer] = useState<boolean>(false)
  const [warningMessage, setWarningMessage] = useState<string>("")

  const categories: string[] = [
    "Mathematics",
    "Computer Science",
    "Science",
    "History",
    "Literature",
    "Languages",
    "Business",
    "Medicine",
    "Engineering",
    "Other",
  ]

  const studyGoals: string[] = [
    "Exam Preparation",
    "Course Completion",
    "General Knowledge",
    "Skill Development",
    "Professional Certification",
  ]

  const removeFile = (index: number): void => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileType: string): JSX.Element => {
    if (fileType.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return <Presentation className="w-6 h-6 text-orange-500" />
    if (fileType.includes("image")) return <ImageIcon className="w-6 h-6 text-green-500" />
    return <FileText className="w-6 h-6 text-blue-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleAlternativeChange = (index: number, value: string): void => {
    const newAlternatives = [...multipleChoiceAlternatives]
    newAlternatives[index] = value
    setMultipleChoiceAlternatives(newAlternatives)
  }

  const uploadFileToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", file.name.split(".")[0])

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.document) {
        return data.document.id
      }
      return null
    } catch (error) {
      console.error("Upload error:", error)
      return null
    }
  }

  const handleFileUpload = async (selectedFiles: FileList): Promise<void> => {
    const newFiles: FileWithMetadata[] = Array.from(selectedFiles).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setFiles((prevFiles) => [...prevFiles, ...newFiles])

    setIsUploadingFiles(true)
    try {
      const uploadedFiles: FileWithMetadata[] = []

      for (const fileItem of newFiles) {
        const documentId = await uploadFileToServer(fileItem.file)
        if (documentId) {
          uploadedFiles.push({ ...fileItem, documentId })
        } else {
          uploadedFiles.push(fileItem)
          toast({
            title: "Upload Warning",
            description: `Failed to upload ${fileItem.name}. AI answers will be general for this file.`,
            variant: "destructive",
          })
        }
      }

      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles]
        newFiles.forEach((newFile, index) => {
          const fileIndex = updatedFiles.findIndex((f) => f.name === newFile.name && f.size === newFile.size)
          if (fileIndex !== -1 && uploadedFiles[index].documentId) {
            updatedFiles[fileIndex] = uploadedFiles[index]
          }
        })
        return updatedFiles
      })

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${uploadedFiles.filter((f) => f.documentId).length} of ${newFiles.length} file(s)`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload Error",
        description: "Some files failed to upload. AI answers will be general.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingFiles(false)
    }
  }

  const generateAIAnswer = async (): Promise<void> => {
    if (!currentQuestionText.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before generating an AI answer",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAnswer(true)
    setAiAnswerSource("")
    setIsGeneralAnswer(false)
    setWarningMessage("")

    try {
      const documentIds = files.filter((f) => f.documentId).map((f) => f.documentId)

      if (documentIds.length > 0) {
        console.log("📝 Ensuring documents have extracted text...")

        const extractResponse = await fetch("/api/documents/extract-selected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentIds }),
        })

        const extractData = await extractResponse.json()

        if (!extractResponse.ok) {
          console.error("Failed to extract documents:", extractData.error)
        } else {
          console.log("✅ Document extraction completed:", extractData.message)
        }
      }

      const response = await fetch("/api/quiz/generate-open-ended-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestionText,
          documentIds: documentIds.length > 0 ? documentIds : undefined,
          category,
          studyGoal,
        }),
      })

      const data = await response.json()

      if (data.success && data.answer) {
        setOpenEndedAnswer(data.answer)

        setIsGeneralAnswer(data.isGeneralAnswer || false)
        setWarningMessage(data.warningMessage || "")

        if (data.hasDocuments && data.documentsProcessed > 0) {
          setAiAnswerSource(`Based on ${data.documentsProcessed} uploaded document(s)`)
          toast({
            title: "Answer Generated from Documents",
            description: `AI generated answer based on ${data.documentsProcessed} document(s)`,
          })
        } else {
          setAiAnswerSource("General answer (no documents uploaded)")
          toast({
            title: "⚠️ General Answer - Not From Your Documents",
            description:
              data.warningMessage ||
              "This answer is based on general knowledge. Upload documents for answers specific to your materials.",
            className: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
          })
        }
      } else {
        throw new Error(data.error || "Failed to generate answer")
      }
    } catch (error) {
      console.error("Error generating AI answer:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI answer. Please try again or write manually.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAnswer(false)
    }
  }

  const generateAIAlternatives = async (): Promise<void> => {
    if (!currentQuestionText.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before generating alternatives",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAlternatives(true)
    setAiAnswerSource("")
    setIsGeneralAnswer(false)
    setWarningMessage("")

    try {
      const documentIds = files.filter((f) => f.documentId).map((f) => f.documentId)

      if (documentIds.length > 0) {
        console.log("📝 Ensuring documents have extracted text...")

        const extractResponse = await fetch("/api/documents/extract-selected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentIds }),
        })

        const extractData = await extractResponse.json()

        if (!extractResponse.ok) {
          console.error("Failed to extract documents:", extractData.error)
        } else {
          console.log("✅ Document extraction completed:", extractData.message)
        }
      }

      const response = await fetch("/api/quiz/generate-alternatives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestionText,
          documentIds: documentIds.length > 0 ? documentIds : undefined,
          category,
          studyGoal,
        }),
      })

      const data = await response.json()

      if (data.success && data.alternatives) {
        setMultipleChoiceAlternatives(data.alternatives)
        setCorrectAnswerIndex(data.correctAnswerIndex || 0)

        setIsGeneralAnswer(data.isGeneralAnswer || false)
        setWarningMessage(data.warningMessage || "")

        if (data.hasDocuments && data.documentsProcessed > 0) {
          setAiAnswerSource(`Based on ${data.documentsProcessed} uploaded document(s)`)
          toast({
            title: "Alternatives Generated from Documents",
            description: `AI generated alternatives based on ${data.documentsProcessed} document(s)`,
          })
        } else {
          setAiAnswerSource("General alternatives (no documents uploaded)")
          toast({
            title: "⚠️ General Alternatives - Not From Your Documents",
            description:
              data.warningMessage ||
              "These alternatives are based on general knowledge. Upload documents for alternatives specific to your materials.",
            className: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
          })
        }
      } else {
        throw new Error(data.error || "Failed to generate alternatives")
      }
    } catch (error) {
      console.error("Error generating AI alternatives:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate alternatives. Please try again or write manually.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAlternatives(false)
    }
  }

  const addQuestion = (): void => {
    if (!currentQuestionText.trim()) return

    let newQuestion: QuizQuestion

    if (currentQuestionType === "multiple_choice") {
      const validAlternatives = multipleChoiceAlternatives.filter((alt) => alt.trim() !== "")
      if (validAlternatives.length < 2 || !validAlternatives[correctAnswerIndex]) {
        toast({
          title: "Incomplete Question",
          description: "Please provide at least two alternatives and select a correct answer.",
          variant: "destructive",
        })
        return
      }

      const alternatives = validAlternatives.map((alt, index) => ({
        text: alt,
        isCorrect: index === correctAnswerIndex,
      }))

      newQuestion = {
        question: currentQuestionText,
        type: "multiple_choice",
        alternatives,
        correctAnswer: validAlternatives[correctAnswerIndex],
      }
    } else {
      if (!openEndedAnswer.trim()) {
        toast({
          title: "Answer Required",
          description: "Please provide an answer for the open-ended question.",
          variant: "destructive",
        })
        return
      }
      newQuestion = {
        question: currentQuestionText,
        type: "open_ended",
        alternatives: [],
        correctAnswer: openEndedAnswer,
      }
    }

    if (editingIndex >= 0) {
      const updatedQuestions = [...quizQuestions]
      updatedQuestions[editingIndex] = newQuestion
      setQuizQuestions(updatedQuestions)
      setEditingIndex(-1)
      toast({
        title: "Question Updated",
        description: "Your question has been updated",
      })
    } else {
      setQuizQuestions((prevQuestions) => [...prevQuestions, newQuestion])
      toast({
        title: "Question Added",
        description: "Question added to your quiz",
      })
    }

    // Reset form
    setCurrentQuestionText("")
    setMultipleChoiceAlternatives(["", "", "", ""])
    setCorrectAnswerIndex(0)
    setOpenEndedAnswer("")
    setAiAnswerSource("")
    setIsGeneralAnswer(false)
    setWarningMessage("")
  }

  const editQuestion = (index: number): void => {
    const questionToEdit = quizQuestions[index]
    setCurrentQuestionText(questionToEdit.question)
    setCurrentQuestionType(questionToEdit.type)

    if (questionToEdit.type === "multiple_choice") {
      const alternatives = questionToEdit.alternatives.map((alt) => alt.text)
      setMultipleChoiceAlternatives(alternatives.concat(Array(4 - alternatives.length).fill("")))
      setCorrectAnswerIndex(questionToEdit.alternatives.findIndex((alt) => alt.isCorrect))
    } else {
      setOpenEndedAnswer(questionToEdit.correctAnswer)
    }

    setEditingIndex(index)
    setAiAnswerSource("")
    setIsGeneralAnswer(false)
    setWarningMessage("")
  }

  const deleteQuestion = (index: number): void => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index))
    toast({
      title: "Question Deleted",
      description: "Question removed from your quiz",
    })
  }

  const handleCreate = async (): Promise<void> => {
    if (!quizName.trim()) {
      toast({
        title: "Quiz Name Required",
        description: "Please enter a name for your quiz",
        variant: "destructive",
      })
      return
    }

    if (quizQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question to your quiz",
        variant: "destructive",
      })
      return
    }

    setIsCreatingQuiz(true)

    try {
      const documentIds = files.filter((f) => f.documentId).map((f) => f.documentId)

      const response = await fetch("/api/quiz-sets/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizName,
          category,
          studyGoal,
          questions: quizQuestions,
          documentIds: documentIds.length > 0 ? documentIds : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: data.message,
        })

        setIsCreateModalOpen(false)

        if (onQuizCreated) {
          onQuizCreated(data.quizSet)
        }

        // Reset form
        setTimeout(() => {
          setQuizName("")
          setCategory("")
          setStudyGoal("")
          setFiles([])
          setQuizQuestions([])
          setCurrentQuestionText("")
          setOpenEndedAnswer("")
          setMultipleChoiceAlternatives(["", "", "", ""])
          setCorrectAnswerIndex(0)
          setAiAnswerSource("")
          // Reset warning states when creating quiz
          setIsGeneralAnswer(false)
          setWarningMessage("")
        }, 300)
      } else {
        throw new Error(data.error || "Failed to create quiz")
      }
    } catch (error) {
      console.error("Error creating quiz:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreatingQuiz(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const renderAnswerSection = () => {
    if (currentQuestionType === "multiple_choice") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Alternatives <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAIAlternatives}
              disabled={isGeneratingAlternatives || !currentQuestionText.trim()}
              className="gap-2 bg-transparent"
            >
              {isGeneratingAlternatives ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
          {files.length === 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              No documents uploaded - AI will provide general alternatives
            </p>
          )}
          {isGeneralAnswer && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  General Answer - Not From Your Documents
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {warningMessage ||
                    "These alternatives are generated based on general knowledge. Upload documents for answers specific to your materials."}
                </p>
              </div>
            </div>
          )}
          {aiAnswerSource && !isGeneralAnswer && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {aiAnswerSource}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Select one radio button to indicate the correct answer, or use AI to generate alternatives.
          </p>
          <RadioGroup
            onValueChange={(value) => setCorrectAnswerIndex(Number.parseInt(value))}
            value={correctAnswerIndex.toString()}
          >
            {multipleChoiceAlternatives.map((alt, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`alt-${index}`} disabled={!alt.trim()} />
                <Input
                  id={`alt-${index}`}
                  placeholder={`Alternative ${index + 1}`}
                  value={alt}
                  onChange={(e) => handleAlternativeChange(index, e.target.value)}
                  className={alt.trim() && correctAnswerIndex === index ? "border-green-500" : ""}
                />
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="openEndedAnswer">
              Perfect Answer <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAIAnswer}
              disabled={isGeneratingAnswer || !currentQuestionText.trim()}
              className="gap-2 bg-transparent"
            >
              {isGeneratingAnswer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
          {files.length === 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              No documents uploaded - AI will provide a general answer
            </p>
          )}
          {isGeneralAnswer && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  General Answer - Not From Your Documents
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {warningMessage ||
                    "This answer is generated based on general knowledge. Upload documents for answers specific to your materials."}
                </p>
              </div>
            </div>
          )}
          {aiAnswerSource && !isGeneralAnswer && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {aiAnswerSource}
            </p>
          )}
          <Textarea
            id="openEndedAnswer"
            placeholder="Enter the perfect answer here or generate one with AI..."
            value={openEndedAnswer}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setOpenEndedAnswer(e.target.value)}
            rows={4}
            disabled={isGeneratingAnswer}
          />
          <p className="text-xs text-gray-500">
            This should be the complete, perfect answer that students should aim for.
          </p>
        </div>
      )
    }
  }

  return (
    <div>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <BookOpen className="w-4 h-4" />
            Create Manual Quiz
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Quiz with AI Assistance</DialogTitle>
            <DialogDescription>
              Create your own quiz with multiple choice or open-ended questions. Use AI to generate answers and
              alternatives based on your documents.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-6">
            {/* Quiz Setup Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Quiz Setup
                </CardTitle>
                <CardDescription>Basic information about your quiz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quizName">
                      Quiz Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quizName"
                      placeholder="e.g., JavaScript Fundamentals"
                      value={quizName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuizName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase().replace(" ", "_")}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="goal">Study Goal</Label>
                  <Select value={studyGoal} onValueChange={setStudyGoal}>
                    <SelectTrigger>
                      <SelectValue placeholder="What's your study goal?" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyGoals.map((goal) => (
                        <SelectItem key={goal} value={goal.toLowerCase().replace(" ", "_")}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reference Materials Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Reference Materials (Optional)
                </CardTitle>
                <CardDescription>Upload documents for AI-powered answers based on your materials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Drop your reference files here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOCX, PPTX, Images supported</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        document.getElementById("file-upload")?.click()
                      }}
                      disabled={isUploadingFiles}
                    >
                      {isUploadingFiles ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Browse Files
                        </>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files)
                      }
                    }}
                    disabled={isUploadingFiles}
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files ({files.length})</Label>
                    <div className="space-y-2">
                      {files.map((fileItem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(fileItem.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                {fileItem.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">{formatFileSize(fileItem.size)}</p>
                                {fileItem.documentId && <CheckCircle className="w-3 h-3 text-green-500" />}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Creation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Create Questions
                </CardTitle>
                <CardDescription>
                  Add questions and their corresponding answers. Use AI assistance to generate content automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select
                    value={currentQuestionType}
                    onValueChange={(value) => {
                      setCurrentQuestionType(value as "multiple_choice" | "open_ended")
                      setAiAnswerSource("")
                      // Resetting general answer flags when question type changes
                      setIsGeneralAnswer(false)
                      setWarningMessage("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="open_ended">Open-Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionText">
                    Question <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question here..."
                    value={currentQuestionText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      setCurrentQuestionText(e.target.value)
                      setAiAnswerSource("")
                      // Resetting general answer flags when question text changes
                      setIsGeneralAnswer(false)
                      setWarningMessage("")
                    }}
                    rows={3}
                  />
                </div>

                {renderAnswerSection()}

                <div className="flex justify-end">
                  <Button
                    onClick={addQuestion}
                    disabled={!currentQuestionText.trim() || isGeneratingAnswer || isGeneratingAlternatives}
                    className="gap-2"
                  >
                    {editingIndex >= 0 ? (
                      <>
                        <Save className="w-4 h-4" />
                        Update Question
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Question
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Question List */}
            {quizQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Questions ({quizQuestions.length})</CardTitle>
                  <CardDescription>Preview and manage your created questions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {quizQuestions.map((question, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Question:</p>
                              <p className="text-sm">{question.question}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Type:</p>
                              <p className="text-sm capitalize">{question.type.replace("_", " ")}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Correct Answer:</p>
                              <p className="text-sm">{question.correctAnswer}</p>
                            </div>
                            {question.type === "multiple_choice" && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-600">Alternatives:</p>
                                <ul className="text-sm list-disc pl-5">
                                  {question.alternatives.map((alt, i) => (
                                    <li
                                      key={i}
                                      className={`flex items-center gap-2 ${alt.isCorrect ? "text-green-600 font-bold" : ""}`}
                                    >
                                      {alt.isCorrect ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : (
                                        <Circle className="w-3 h-3" />
                                      )}
                                      {alt.text}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editQuestion(index)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteQuestion(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreatingQuiz}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!quizName.trim() || quizQuestions.length === 0 || isCreatingQuiz}
                className="gap-2"
              >
                {isCreatingQuiz ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Create Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManualQuizCreatorEnhanced
