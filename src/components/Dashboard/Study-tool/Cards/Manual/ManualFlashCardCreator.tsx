"use client"
import React, { useState, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  Plus, 
  Upload, 
  X, 
  FileText, 
  Presentation, 
  Image, 
  Sparkles,
  Edit3,
  Trash2,
  Save,
  BookOpen,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Flashcard {
  question: string;
  answer: string;
  difficulty?: string;
  tags?: string[];
}

interface FileWithMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
  documentId?: string;
}

const ManualFlashCardCreator: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [studyGoal, setStudyGoal] = useState<string>('');
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [answerMode, setAnswerMode] = useState<'manual' | 'ai'>('manual');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState<boolean>(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [aiAnswerSource, setAiAnswerSource] = useState<string>('');

  const categories: string[] = [
    'Mathematics',
    'Computer Science', 
    'Science',
    'History',
    'Literature',
    'Languages',
    'Business',
    'Medicine',
    'Engineering',
    'Other'
  ];

  const studyGoals: string[] = [
    'Exam Preparation',
    'Course Completion', 
    'General Knowledge',
    'Skill Development',
    'Professional Certification'
  ];

  const uploadFileToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.split('.')[0]);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.document) {
        return data.document.id;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleFileUpload = async (selectedFiles: FileList): Promise<void> => {
    const newFiles: FileWithMetadata[] = Array.from(selectedFiles).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    // Upload files immediately to get document IDs
    setIsUploadingFiles(true);
    try {
      const uploadedFiles: FileWithMetadata[] = [];
      
      for (const fileItem of newFiles) {
        const documentId = await uploadFileToServer(fileItem.file);
        if (documentId) {
          uploadedFiles.push({ ...fileItem, documentId });
        } else {
          uploadedFiles.push(fileItem);
          toast({
            title: "Upload Warning",
            description: `Failed to upload ${fileItem.name}. AI answers will be general for this file.`,
            variant: "destructive"
          });
        }
      }

      // Update files with document IDs
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        newFiles.forEach((newFile, index) => {
          const fileIndex = updatedFiles.findIndex(
            f => f.name === newFile.name && f.size === newFile.size
          );
          if (fileIndex !== -1 && uploadedFiles[index].documentId) {
            updatedFiles[fileIndex] = uploadedFiles[index];
          }
        });
        return updatedFiles;
      });

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${uploadedFiles.filter(f => f.documentId).length} of ${newFiles.length} file(s)`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Error",
        description: "Some files failed to upload. AI answers will be general.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeFile = (index: number): void => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) 
      return <Presentation className="w-6 h-6 text-orange-500" />;
    if (fileType.includes('image')) return <Image className="w-6 h-6 text-green-500" />;
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateAIAnswer = async (): Promise<void> => {
    if (!currentQuestion.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before generating an AI answer",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingAnswer(true);
    setAiAnswerSource('');
    
    try {
      const documentIds = files
        .filter(f => f.documentId)
        .map(f => f.documentId);

      console.log(`🤖 Generating AI answer for question with ${documentIds.length} document(s)...`);

      const response = await fetch('/api/flashcards/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          documentIds: documentIds.length > 0 ? documentIds : undefined,
          category,
          studyGoal
        }),
      });
      
      const data = await response.json();
      console.log('📥 Answer generation response:', data);
      
      if (data.success && data.answer) {
        setCurrentAnswer(data.answer);
        
        if (data.hasDocuments && data.documentsProcessed > 0) {
          setAiAnswerSource(`Based on ${data.documentsProcessed} uploaded document(s)`);
          toast({
            title: "Answer Generated ✓",
            description: `AI generated answer from ${data.documentsProcessed} document(s)`,
          });
        } else if (documentIds.length > 0 && data.documentsProcessed === 0) {
          setAiAnswerSource('General answer (documents are being processed)');
          toast({
            title: "General Answer Generated",
            description: "Your documents are still being processed. This is a general answer for now.",
          });
        } else {
          setAiAnswerSource('General answer (no documents uploaded)');
          toast({
            title: "General Answer Generated",
            description: "This is a general answer. Upload documents for more specific answers.",
          });
        }
      } else {
        throw new Error(data.error || 'Failed to generate answer');
      }
    } catch (error) {
      console.error('❌ Error generating AI answer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCurrentAnswer(`Failed to generate answer: ${errorMessage}`);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI answer. Please try again or write manually.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const addFlashcard = (): void => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      toast({
        title: "Incomplete Flashcard",
        description: "Both question and answer are required",
        variant: "destructive"
      });
      return;
    }
    
    const newCard: Flashcard = { 
      question: currentQuestion.trim(), 
      answer: currentAnswer.trim(),
      difficulty: 'medium'
    };
    
    if (editingIndex >= 0) {
      const updatedCards = [...flashcards];
      updatedCards[editingIndex] = newCard;
      setFlashcards(updatedCards);
      setEditingIndex(-1);
      toast({
        title: "Flashcard Updated",
        description: "Your flashcard has been updated",
      });
    } else {
      setFlashcards(prevCards => [...prevCards, newCard]);
      toast({
        title: "Flashcard Added",
        description: "Flashcard added to your deck",
      });
    }
    
    setCurrentQuestion('');
    setCurrentAnswer('');
    setAiAnswerSource('');
  };

  const editFlashcard = (index: number): void => {
    setCurrentQuestion(flashcards[index].question);
    setCurrentAnswer(flashcards[index].answer);
    setEditingIndex(index);
    setAiAnswerSource('');
  };

  const deleteFlashcard = (index: number): void => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
    toast({
      title: "Flashcard Deleted",
      description: "Flashcard removed from your deck",
    });
  };

  const handleCreate = async (): Promise<void> => {
    if (!projectName.trim()) {
      toast({
        title: "Deck Name Required",
        description: "Please enter a name for your flashcard deck",
        variant: "destructive"
      });
      return;
    }

    if (flashcards.length === 0) {
      toast({
        title: "No Flashcards",
        description: "Please add at least one flashcard to your deck",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingDeck(true);

    try {
      const documentIds = files
        .filter(f => f.documentId)
        .map(f => f.documentId);

      const response = await fetch('/api/flashcard-sets/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          category,
          studyGoal,
          flashcards,
          documentIds: documentIds.length > 0 ? documentIds : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: data.message,
        });

        // Reset form
        setProjectName('');
        setCategory('');
        setStudyGoal('');
        setFiles([]);
        setFlashcards([]);
        setCurrentQuestion('');
        setCurrentAnswer('');
        setAiAnswerSource('');
        setIsCreateModalOpen(false);

        // Optional: Redirect to flashcards page
        // router.push('/dashboard/flash-cards-cards');
      } else {
        throw new Error(data.error || 'Failed to create flashcard deck');
      }
    } catch (error) {
      console.error('Error creating flashcard deck:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <BookOpen className="w-4 h-4" />
            Create Flashcards
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Flashcards</DialogTitle>
            <DialogDescription>
              Create your own flashcards with optional AI assistance from your uploaded materials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 space-y-6">
            {/* Project Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Flashcard Deck Setup
                </CardTitle>
                <CardDescription>Basic information about your flashcard deck.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectName">
                      Deck Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., JavaScript Fundamentals"
                      value={projectName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat.toLowerCase().replace(' ', '_')}>
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
                      {studyGoals.map(goal => (
                        <SelectItem key={goal} value={goal.toLowerCase().replace(' ', '_')}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Reference Materials (Optional)
                </CardTitle>
                <CardDescription>
                  Upload documents for AI-powered answers based on your materials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                    Drop your reference files here
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    PDF, DOCX, PPTX, Images supported
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploadingFiles}
                  />
                  <label htmlFor="file-upload">
                    <Button asChild variant="outline" disabled={isUploadingFiles}>
                      <span className="cursor-pointer">
                        {isUploadingFiles ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Browse Files'
                        )}
                      </span>
                    </Button>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
                      <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {files.map((fileItem, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                          {getFileIcon(fileItem.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileItem.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">{formatFileSize(fileItem.size)}</p>
                              {fileItem.documentId && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
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

            {/* Flashcard Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Create Flashcards
                </CardTitle>
                <CardDescription>Add questions and create answers manually or with AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answer Mode Selection */}
                <div>
                  <Label className="text-sm font-medium">Answer Creation Mode</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={answerMode === 'manual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnswerMode('manual')}
                      className="gap-2"
                    >
                      <User className="w-4 h-4" />
                      Write Manually
                    </Button>
                    <Button
                      variant={answerMode === 'ai' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnswerMode('ai')}
                      className="gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      AI Generated
                    </Button>
                  </div>
                  {answerMode === 'ai' && files.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      No documents uploaded - AI will provide general answers
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question">
                      Question <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="question"
                      placeholder="Enter your question here..."
                      value={currentQuestion}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentQuestion(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="answer">
                        Answer <span className="text-red-500">*</span>
                      </Label>
                      {answerMode === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAIAnswer}
                          disabled={!currentQuestion.trim() || isGeneratingAnswer}
                          className="gap-2 text-xs"
                        >
                          {isGeneratingAnswer ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id="answer"
                      placeholder={
                        answerMode === 'manual' 
                          ? "Enter your answer here..." 
                          : "Enter question first, then click 'Generate with AI'..."
                      }
                      value={currentAnswer}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                      rows={3}
                      disabled={isGeneratingAnswer}
                    />
                    {aiAnswerSource && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {aiAnswerSource}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={addFlashcard} 
                    disabled={!currentQuestion.trim() || !currentAnswer.trim() || isGeneratingAnswer}
                    className="gap-2"
                  >
                    {editingIndex >= 0 ? (
                      <>
                        <Save className="w-4 h-4" />
                        Update Card
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Card
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Flashcard List */}
            {flashcards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Flashcards ({flashcards.length})</CardTitle>
                  <CardDescription>Preview and manage your created flashcards.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {flashcards.map((card, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Question:</p>
                              <p className="text-sm">{card.question}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Answer:</p>
                              <p className="text-sm">{card.answer}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editFlashcard(index)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteFlashcard(index)}>
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
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreatingDeck}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!projectName.trim() || flashcards.length === 0 || isCreatingDeck}
                className="gap-2"
              >
                {isCreatingDeck ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Create Flashcard Deck
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualFlashCardCreator;