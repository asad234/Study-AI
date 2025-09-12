"use client"
import React, { useState } from 'react';
import PreviewQuizzes from '../../Quize/Preview/previewQuizes';

// Your existing PreviewCards component
interface FlashCard {
  id: string;
  name: string;
  cardCount?: number;
}

interface PreviewCardsProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards?: FlashCard[];
}

const PreviewCards: React.FC<PreviewCardsProps> = ({
  isOpen = false,
  onClose = () => {},
  flashcards = []
}) => {
  // Mock data for demonstration
  const mockFlashcards: FlashCard[] = [
    { id: '1', name: 'Spanish Vocabulary', cardCount: 25 },
    { id: '2', name: 'Math Formulas', cardCount: 18 },
    { id: '3', name: 'History Dates', cardCount: 32 },
    { id: '4', name: 'Science Terms', cardCount: 41 },
    { id: '5', name: 'Programming Concepts', cardCount: 15 },
  ];

  const displayCards = flashcards.length > 0 ? flashcards : mockFlashcards;

  if (!isOpen) return null;

  const handleReviewClick = (cardId: string) => {
    // This will be implemented later
    console.log(`Review card: ${cardId}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Preview Flashcards
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {displayCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No Flashcards Yet
              </h3>
              <p className="text-gray-500">
                Create your first flashcard to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1 mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">
                        {card.name}
                      </h3>
                      {card.cardCount && (
                        <p className="text-sm text-gray-600">
                          {card.cardCount} cards
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleReviewClick(card.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Review Cards
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// New component that includes the button and handles the dialog state
interface PreviewButtonProps {
  flashcards?: FlashCard[];
  buttonText?: string;
  className?: string;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ 
  flashcards, 
  buttonText = "Preview Flashcards",
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* The button that triggers the dialog */}
      <button
        onClick={handleOpenDialog}
        className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 ${className}`}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
          />
        </svg>
        {buttonText}
      </button>

      {/* The dialog */}
      <PreviewCards
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        flashcards={flashcards}
      />
    </>
  );
};

// Example usage component
const ExamplePage: React.FC = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          My Flashcard App
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Welcome to your flashcard dashboard. Click the button below to preview all your created flashcards.
          </p>
          
          {/* Your preview button */}
          <PreviewButton />
          <PreviewQuizzes/>
        </div>

        {/* You can also customize the button */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Custom Options</h2>
          <div className="flex flex-wrap gap-4">
            <PreviewButton 
              buttonText="View All Cards" 
              className="bg-green-600 hover:bg-green-700"
            />
            
            <PreviewButton 
              buttonText="Browse Cards" 
              className="bg-purple-600 hover:bg-purple-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplePage;