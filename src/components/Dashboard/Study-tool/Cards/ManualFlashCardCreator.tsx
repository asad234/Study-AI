"use client"
import React, { useState, ChangeEvent, JSX } from 'react';
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
  Loader2
} from 'lucide-react';
import UnderDevelopmentBanner from '@/components/common/underDevelopment';

// Type definitions
interface Flashcard {
  question: string;
  answer: string;
}

interface FileWithMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
}

const ManualFlashCardCreator: React.FC = () => {
  // All state variables
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

  const handleFileUpload = (selectedFiles: FileList): void => {
    const newFiles: FileWithMetadata[] = Array.from(selectedFiles).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number): void => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string): JSX.Element => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation className="w-6 h-6 text-orange-500" />;
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

  const addFlashcard = (): void => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) return;
    
    const newCard: Flashcard = { question: currentQuestion, answer: currentAnswer };
    
    if (editingIndex >= 0) {
      const updatedCards = [...flashcards];
      updatedCards[editingIndex] = newCard;
      setFlashcards(updatedCards);
      setEditingIndex(-1);
    } else {
      setFlashcards(prevCards => [...prevCards, newCard]);
    }
    
    setCurrentQuestion('');
    setCurrentAnswer('');
  };

  const editFlashcard = (index: number): void => {
    setCurrentQuestion(flashcards[index].question);
    setCurrentAnswer(flashcards[index].answer);
    setEditingIndex(index);
  };

  const deleteFlashcard = (index: number): void => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const generateAIAnswer = async (): Promise<void> => {
    if (!currentQuestion.trim()) return;
    
    setIsGeneratingAnswer(true);
    try {
      // TODO: Replace with your actual AI API call
      // This is a placeholder - you'll need to implement your AI service
      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          files: files.map(f => f.file), // You may need to process files differently
          category,
          studyGoal
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentAnswer(data.answer || '');
      } else {
        // Handle error
        console.error('Failed to generate AI answer');
        setCurrentAnswer('Failed to generate answer. Please try again or write manually.');
      }
    } catch (error) {
      console.error('Error generating AI answer:', error);
      setCurrentAnswer('Error generating answer. Please try again or write manually.');
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleCreate = (): void => {
    // Handle the creation logic here
    console.log({
      projectName,
      category,
      studyGoal,
      files: files.map(f => f.file),
      flashcards
    });
    setIsCreateModalOpen(false);
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
            Create Manual Flashcards
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <UnderDevelopmentBanner/>
            <DialogTitle>Create Manual Flashcards</DialogTitle>
            <DialogDescription>
              Upload your documents and create your own flashcards. AI will help you improve your answers based on uploaded materials.
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
                  Reference Materials
                </CardTitle>
                <CardDescription>Upload documents that will help AI improve your answers.</CardDescription>
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
                  />
                  <label htmlFor="file-upload">
                    <Button asChild variant="outline">
                      <span className="cursor-pointer">Browse Files</span>
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
                            <p className="text-xs text-gray-500">{formatFileSize(fileItem.size)}</p>
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
                <CardDescription>Add questions and choose how to create answers.</CardDescription>
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
                      disabled={files.length === 0}
                    >
                      <Bot className="w-4 h-4" />
                      AI Generated
                    </Button>
                  </div>
                  {answerMode === 'ai' && files.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Upload reference materials to enable AI-generated answers
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question">Question</Label>
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
                      <Label htmlFor="answer">Answer</Label>
                      {answerMode === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAIAnswer}
                          disabled={!currentQuestion.trim() || isGeneratingAnswer || files.length === 0}
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
                          : "Click 'Generate with AI' or write manually..."
                      }
                      value={currentAnswer}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                      rows={3}
                      disabled={isGeneratingAnswer}
                    />
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
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!projectName.trim() || flashcards.length === 0}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Create Flashcard Deck
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualFlashCardCreator;