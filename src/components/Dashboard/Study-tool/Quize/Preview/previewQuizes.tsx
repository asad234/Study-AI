"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, HelpCircle, ArrowRight, Clock, Trophy } from "lucide-react";
import UnderDevelopmentBanner from '@/components/common/underDevelopment';

interface Quiz {
  id: string;
  name: string;
  questionCount?: number;
  status?: string;
  createdAt?: string;
  difficulty?: string;
  timeLimit?: number;
  lastScore?: number;
  isAIGenerated?: boolean; // Indicates if the quiz is AI-generated
}

interface PreviewQuizzesProps {
  quizzes?: Quiz[];
  buttonText?: string;
  className?: string;
}

const PreviewQuizzes: React.FC<PreviewQuizzesProps> = ({ 
  quizzes, 
  buttonText = "Preview Quizzes",
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data for demonstration
  const mockQuizzes: Quiz[] = [
    { 
      id: '1', 
      name: 'Spanish Grammar Quiz', 
      questionCount: 20, 
      status: 'active', 
      createdAt: '2024-01-15',
      difficulty: 'Medium',
      timeLimit: 15,
      lastScore: 85,
      isAIGenerated: false
    },
    { 
      id: '2', 
      name: 'Advanced Math Problems', 
      questionCount: 15, 
      status: 'completed', 
      createdAt: '2024-01-12',
      difficulty: 'Hard',
      timeLimit: 30,
      lastScore: 92,
      isAIGenerated: true
    },
    { 
      id: '3', 
      name: 'World History Quiz', 
      questionCount: 25, 
      status: 'active', 
      createdAt: '2024-01-10',
      difficulty: 'Easy',
      timeLimit: 20,
      lastScore: 78,
      isAIGenerated: false
    },
    { 
      id: '4', 
      name: 'Science Fundamentals', 
      questionCount: 18, 
      status: 'draft', 
      createdAt: '2024-01-08',
      difficulty: 'Medium',
      timeLimit: 25,
      isAIGenerated: true
    },
    { 
      id: '5', 
      name: 'Programming Logic', 
      questionCount: 12, 
      status: 'active', 
      createdAt: '2024-01-05',
      difficulty: 'Hard',
      timeLimit: 40,
      lastScore: 95,
      isAIGenerated: true
    },
  ];

  const displayQuizzes = quizzes && quizzes.length > 0 ? quizzes : mockQuizzes;

  const handleTakeQuiz = (quizId: string) => {
    console.log(`Take quiz: ${quizId}`);
    // Add navigation logic here later
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Button that triggers the dialog */}
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className={`gap-2 hover:bg-purple-50 hover:border-purple-300 ${className}`}
      >
        <Eye className="w-4 h-4" />
        {buttonText}
      </Button>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <UnderDevelopmentBanner/>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Preview Quizzes
            </DialogTitle>
            <DialogDescription>
              View and take all your created quiz sets.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto p-1">
            {displayQuizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No Quizzes Yet
                </h3>
                <p className="text-gray-500">
                  Create your first quiz to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="hover:shadow-md transition-shadow duration-200 border-2 hover:border-purple-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
                          {quiz.name}
                        </CardTitle>
                        {quiz.status && (
                          <Badge variant={getStatusColor(quiz.status)} className="text-xs">
                            {quiz.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            {quiz.questionCount || 0} questions
                          </span>
                          {quiz.createdAt && (
                            <span className="text-xs">
                              {formatDate(quiz.createdAt)}
                            </span>
                          )}
                        </div>

                        {/* Quiz Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {quiz.difficulty && (
                              <span className={`px-2 py-1 text-xs rounded-md border ${getDifficultyColor(quiz.difficulty)}`}>
                                {quiz.difficulty}
                              </span>
                            )}
                            {quiz.timeLimit && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                {quiz.timeLimit}min
                              </span>
                            )}
                          </div>
                          
                          {quiz.lastScore !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Last Score:</span>
                              <span className={`flex items-center gap-1 text-sm font-semibold ${getScoreColor(quiz.lastScore)}`}>
                                <Trophy className="w-3 h-3" />
                                {quiz.lastScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* AI/Custom Badge */}
                        <div className="flex justify-start">
                          <Badge 
                            variant={quiz.isAIGenerated ? 'secondary' : 'outline'} 
                            className={`text-xs ${quiz.isAIGenerated ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {quiz.isAIGenerated ? 'AI Generated Quiz' : 'Custom Made'}
                          </Badge>
                        </div>
                        
                        <Button
                          onClick={() => handleTakeQuiz(quiz.id)}
                          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                          disabled={quiz.status === 'draft'}
                        >
                          {quiz.status === 'draft' ? 'Coming Soon' : 'Take Quiz'}
                          {quiz.status !== 'draft' && <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreviewQuizzes;
