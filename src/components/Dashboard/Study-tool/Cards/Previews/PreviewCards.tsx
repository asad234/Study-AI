"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, BookOpen, ArrowRight, X } from "lucide-react";

interface FlashCard {
  id: string;
  name: string;
  cardCount?: number;
  status?: string;
  createdAt?: string;
}

interface PreviewCardsProps {
  flashcards?: FlashCard[];
  buttonText?: string;
  className?: string;
}

const PreviewCards: React.FC<PreviewCardsProps> = ({ 
  flashcards, 
  buttonText = "Preview Flashcards",
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data for demonstration
  const mockFlashcards: FlashCard[] = [
    { id: '1', name: 'Spanish Vocabulary', cardCount: 25, status: 'active', createdAt: '2024-01-15' },
    { id: '2', name: 'Math Formulas', cardCount: 18, status: 'completed', createdAt: '2024-01-12' },
    { id: '3', name: 'History Dates', cardCount: 32, status: 'active', createdAt: '2024-01-10' },
    { id: '4', name: 'Science Terms', cardCount: 41, status: 'draft', createdAt: '2024-01-08' },
    { id: '5', name: 'Programming Concepts', cardCount: 15, status: 'active', createdAt: '2024-01-05' },
  ];

  const displayCards = flashcards && flashcards.length > 0 ? flashcards : mockFlashcards;

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleReviewClick = (cardId: string) => {
    // This will be implemented later
    console.log(`Review card: ${cardId}`);
    // You can add navigation logic here later
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

  return (
    <>
      {/* The button that triggers the dialog */}
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        className={`gap-2 hover:bg-blue-50 hover:border-blue-300 ${className}`}
      >
        <Eye className="w-4 h-4" />
        {buttonText}
      </Button>

      {/* The dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Preview Flashcards
            </DialogTitle>
            <DialogDescription>
              View and manage all your created flashcard sets.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-1">
            {displayCards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No Flashcards Yet
                </h3>
                <p className="text-gray-500">
                  Create your first flashcard set to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayCards.map((card) => (
                  <Card 
                    key={card.id} 
                    className="hover:shadow-md transition-shadow duration-200 border-2 hover:border-blue-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
                          {card.name}
                        </CardTitle>
                        {card.status && (
                          <Badge variant={getStatusColor(card.status)} className="text-xs">
                            {card.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {card.cardCount || 0} cards
                          </span>
                          {card.createdAt && (
                            <span className="text-xs">
                              {formatDate(card.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleReviewClick(card.id)}
                          className="w-full gap-2 bg-blue-400 hover:bg-blue-700"
                          size="sm"
                        >
                          Review Cards
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleCloseDialog}
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

export default PreviewCards;