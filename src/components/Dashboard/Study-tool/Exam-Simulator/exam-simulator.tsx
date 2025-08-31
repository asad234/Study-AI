"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, RotateCcw, BookOpen } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    explanation: "Paris is the capital and most populous city of France.",
    category: "Geography"
  },
  {
    id: 2,
    question: "Which of the following is a programming paradigm?",
    options: ["Object-Oriented", "Functional", "Procedural", "All of the above"],
    correctAnswer: 3,
    explanation: "All three (Object-Oriented, Functional, and Procedural) are valid programming paradigms.",
    category: "Computer Science"
  },
  {
    id: 3,
    question: "What is the largest planet in our solar system?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 2,
    explanation: "Jupiter is the largest planet in our solar system, with a mass greater than all other planets combined.",
    category: "Science"
  },
  {
    id: 4,
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    explanation: "World War II ended in 1945 with the surrender of Japan in September.",
    category: "History"
  },
  {
    id: 5,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum'.",
    category: "Chemistry"
  }
];

export default function ExamSimulator() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (examStarted && !examFinished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setExamFinished(true);
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, examFinished, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const finishExam = () => {
    setExamFinished(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    sampleQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: sampleQuestions.length,
      percentage: Math.round((correct / sampleQuestions.length) * 100)
    };
  };

  const resetExam = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setTimeLeft(1800);
    setExamStarted(false);
    setExamFinished(false);
    setShowResults(false);
  };

  const startExam = () => {
    setExamStarted(true);
  };

  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Study-AI Exam Simulator</CardTitle>
            <CardDescription>
              Test your knowledge with our interactive exam simulator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold">{sampleQuestions.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold">30 min</div>
                <div className="text-gray-600 dark:text-gray-400">Duration</div>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                You&apos;ll have 30 minutes to complete {sampleQuestions.length} questions. You can navigate between questions and change your answers before submitting.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={startExam} className="w-full" size="lg">
              Start Exam
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Exam Complete!</CardTitle>
              <CardDescription>Here are your results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score.percentage}%</div>
                  <div className="text-gray-600 dark:text-gray-400">Overall Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score.correct}</div>
                  <div className="text-gray-600 dark:text-gray-400">Correct Answers</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{score.total - score.correct}</div>
                  <div className="text-gray-600 dark:text-gray-400">Incorrect Answers</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Question Review</h3>
                {sampleQuestions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  const wasAnswered = userAnswer !== undefined;
                  
                  return (
                    <Card key={question.id} className="border-l-4" style={{
                      borderLeftColor: !wasAnswered ? '#6b7280' : isCorrect ? '#10b981' : '#ef4444'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{question.category}</Badge>
                          {!wasAnswered ? (
                            <Badge variant="secondary">Not Answered</Badge>
                          ) : isCorrect ? (
                            <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">Correct</Badge>
                          ) : (
                            <Badge variant="destructive">Incorrect</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-2">{question.question}</h4>
                        <div className="text-sm space-y-1">
                          {wasAnswered && (
                            <p>
                              <span className="font-medium">Your answer:</span>{' '}
                              <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {question.options[userAnswer]}
                              </span>
                            </p>
                          )}
                          {!isCorrect && (
                            <p>
                              <span className="font-medium">Correct answer:</span>{' '}
                              <span className="text-green-600 dark:text-green-400">
                                {question.options[question.correctAnswer]}
                              </span>
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={resetExam} className="w-full" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Take Another Exam
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const question = sampleQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  Question {currentQuestion + 1} of {sampleQuestions.length}
                </Badge>
                <Badge variant="secondary">{question.category}</Badge>
              </div>
              <div className="flex items-center space-x-2 text-lg font-mono">
                <Clock className="w-5 h-5" />
                <span className={timeLeft < 300 ? 'text-red-600 dark:text-red-400' : ''}>{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{answeredCount} of {sampleQuestions.length} questions answered</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnswers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswers[currentQuestion] === index
                            ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedAnswers[currentQuestion] === index && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                <div className="space-x-2">
                  {currentQuestion === sampleQuestions.length - 1 ? (
                    <Button onClick={finishExam} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                      Finish Exam
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion}>
                      Next
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Question Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {sampleQuestions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        index === currentQuestion
                          ? 'bg-blue-500 text-white dark:bg-blue-600'
                          : selectedAnswers[index] !== undefined
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-800/50'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Not answered</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={finishExam} variant="outline" className="w-full">
                  Submit Exam
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}