"use client";
import React, { useState, ChangeEvent, JSX } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  CheckCircle,
  Circle,
  Wand2,
  RefreshCw
} from 'lucide-react';
import UnderDevelopmentBanner from '@/components/common/underDevelopment';

// Type definitions
interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'open_ended';
  alternatives: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
}

interface FileWithMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
}

const ManualQuizCreator: React.FC = () => {
  // All state variables
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [quizName, setQuizName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [studyGoal, setStudyGoal] = useState<string>('');
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  // State for the current question being edited/added
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentQuestionType, setCurrentQuestionType] = useState<'multiple_choice' | 'open_ended'>('multiple_choice');
  const [multipleChoiceAlternatives, setMultipleChoiceAlternatives] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');
  
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [answerMode, setAnswerMode] = useState<'manual' | 'ai'>('manual');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState<boolean>(false);
  const [isGeneratingAlternatives, setIsGeneratingAlternatives] = useState<boolean>(false);

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

  const handleAlternativeChange = (index: number, value: string): void => {
    const newAlternatives = [...multipleChoiceAlternatives];
    newAlternatives[index] = value;
    setMultipleChoiceAlternatives(newAlternatives);
  };

  // AI Answer Generation Functions
  const generateAIAnswer = async (): Promise<void> => {
    if (!currentQuestionText.trim()) {
      alert("Please enter a question first.");
      return;
    }

    setIsGeneratingAnswer(true);
    
    try {
      // Simulate AI API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated answer based on question context
      const mockAnswer = generateMockAnswer(currentQuestionText, category);
      setOpenEndedAnswer(mockAnswer);
      
    } catch (error) {
      console.error('Error generating AI answer:', error);
      alert('Failed to generate AI answer. Please try again.');
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const generateAIAlternatives = async (): Promise<void> => {
    if (!currentQuestionText.trim()) {
      alert("Please enter a question first.");
      return;
    }

    setIsGeneratingAlternatives(true);
    
    try {
      // Simulate AI API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock AI-generated alternatives
      const mockAlternatives = generateMockAlternatives(currentQuestionText, category);
      setMultipleChoiceAlternatives(mockAlternatives);
      setCorrectAnswerIndex(0); // First alternative is correct by default
      
    } catch (error) {
      console.error('Error generating AI alternatives:', error);
      alert('Failed to generate AI alternatives. Please try again.');
    } finally {
      setIsGeneratingAlternatives(false);
    }
  };

  // Mock functions - replace with actual AI API calls
  const generateMockAnswer = (question: string, category: string): string => {
    const answers = [
      "This is a comprehensive answer generated by AI based on the question context and category.",
      "The AI has analyzed your question and provided this detailed response considering the subject matter.",
      "Based on the question context, this AI-generated answer covers the key points and provides accurate information.",
    ];
    return answers[Math.floor(Math.random() * answers.length)] + ` (Category: ${category})`;
  };

  const generateMockAlternatives = (question: string, category: string): string[] => {
    const alternativeSets = [
      ["Correct AI-generated answer", "Plausible but incorrect option A", "Plausible but incorrect option B", "Clearly incorrect option"],
      ["AI-generated correct choice", "Alternative response A", "Alternative response B", "Distractor option"],
      ["Accurate AI answer", "Reasonable but wrong A", "Reasonable but wrong B", "Obviously wrong choice"],
    ];
    return alternativeSets[Math.floor(Math.random() * alternativeSets.length)];
  };

  const addQuestion = (): void => {
    if (!currentQuestionText.trim()) return;
    
    let newQuestion: QuizQuestion;
    
    if (currentQuestionType === 'multiple_choice') {
      const validAlternatives = multipleChoiceAlternatives.filter(alt => alt.trim() !== '');
      if (validAlternatives.length < 2 || !validAlternatives[correctAnswerIndex]) {
        alert("Please provide at least two alternatives and a correct answer.");
        return;
      }
      
      const alternatives = validAlternatives.map((alt, index) => ({
        text: alt,
        isCorrect: index === correctAnswerIndex
      }));

      newQuestion = {
        question: currentQuestionText,
        type: 'multiple_choice',
        alternatives,
        correctAnswer: validAlternatives[correctAnswerIndex]
      };
    } else { // open_ended
      if (!openEndedAnswer.trim()) {
        alert("Please provide an answer for the open-ended question.");
        return;
      }
      newQuestion = {
        question: currentQuestionText,
        type: 'open_ended',
        alternatives: [],
        correctAnswer: openEndedAnswer
      };
    }

    if (editingIndex >= 0) {
      const updatedQuestions = [...quizQuestions];
      updatedQuestions[editingIndex] = newQuestion;
      setQuizQuestions(updatedQuestions);
      setEditingIndex(-1);
    } else {
      setQuizQuestions(prevQuestions => [...prevQuestions, newQuestion]);
    }
    
    // Reset form
    setCurrentQuestionText('');
    setMultipleChoiceAlternatives(['', '', '', '']);
    setCorrectAnswerIndex(0);
    setOpenEndedAnswer('');
  };

  const editQuestion = (index: number): void => {
    const questionToEdit = quizQuestions[index];
    setCurrentQuestionText(questionToEdit.question);
    setCurrentQuestionType(questionToEdit.type);
    
    if (questionToEdit.type === 'multiple_choice') {
      const alternatives = questionToEdit.alternatives.map(alt => alt.text);
      setMultipleChoiceAlternatives(alternatives.concat(Array(4 - alternatives.length).fill('')));
      setCorrectAnswerIndex(questionToEdit.alternatives.findIndex(alt => alt.isCorrect));
    } else {
      setOpenEndedAnswer(questionToEdit.correctAnswer);
    }
    
    setEditingIndex(index);
  };

  const deleteQuestion = (index: number): void => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleCreate = (): void => {
    // Handle the creation logic here
    console.log({
      quizName,
      category,
      studyGoal,
      files: files.map(f => f.file),
      quizQuestions
    });
    setIsCreateModalOpen(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  // Helper component to render the appropriate answer section
  const renderAnswerSection = () => {
    if (currentQuestionType === 'multiple_choice') {
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
              className="gap-2"
            >
              {isGeneratingAlternatives ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate AI Alternatives
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Select one radio button to indicate the correct answer, or use AI to generate alternatives.
          </p>
          <RadioGroup 
            onValueChange={(value) => setCorrectAnswerIndex(parseInt(value))}
            value={correctAnswerIndex.toString()}
          >
            {multipleChoiceAlternatives.map((alt, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`alt-${index}`}
                  disabled={!alt.trim()}
                />
                <Input
                  id={`alt-${index}`}
                  placeholder={`Alternative ${index + 1}`}
                  value={alt}
                  onChange={(e) => handleAlternativeChange(index, e.target.value)}
                  className={alt.trim() && correctAnswerIndex === index ? 'border-green-500' : ''}
                />
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="openEndedAnswer">
              Correct Answer <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAIAnswer}
              disabled={isGeneratingAnswer || !currentQuestionText.trim()}
              className="gap-2"
            >
              {isGeneratingAnswer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Generate AI Answer
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="openEndedAnswer"
            placeholder="Enter the correct answer here or generate one with AI..."
            value={openEndedAnswer}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setOpenEndedAnswer(e.target.value)}
            rows={3}
          />
        </div>
      );
    }
  };

  return (
    <div>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <BookOpen className="w-4 h-4" />
            Create Custom Quiz
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <UnderDevelopmentBanner/>
            <DialogTitle>Create Custom Quiz</DialogTitle>
            <DialogDescription>
              Create your own custom quiz with multiple choice or open-ended questions. Use AI to generate answers and alternatives.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 space-y-6">
            {/* Quiz Setup */}
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

            {/* Question Creation */}
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
                {/* Question Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select 
                    value={currentQuestionType} 
                    onValueChange={(value) => setCurrentQuestionType(value as 'multiple_choice' | 'open_ended')}
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

                {/* Question Input */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question here..."
                    value={currentQuestionText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentQuestionText(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Dynamic Answer Section with AI Generation */}
                {renderAnswerSection()}

                <div className="flex justify-end">
                  <Button 
                    onClick={addQuestion} 
                    disabled={!currentQuestionText.trim()}
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
                              <p className="text-sm capitalize">{question.type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Correct Answer:</p>
                              <p className="text-sm">{question.correctAnswer}</p>
                            </div>
                            {question.type === 'multiple_choice' && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-600">Alternatives:</p>
                                <ul className="text-sm list-disc pl-5">
                                  {question.alternatives.map((alt, i) => (
                                    <li key={i} className={`flex items-center gap-2 ${alt.isCorrect ? 'text-green-600 font-bold' : ''}`}>
                                      {alt.isCorrect ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
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
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!quizName.trim() || quizQuestions.length === 0}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Create Quiz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualQuizCreator;