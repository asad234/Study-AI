"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  BookOpen, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  Trash2,
  AlertTriangle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import UnderDevelopmentBanner from '@/components/common/underDevelopment';

interface FlashCardSet {
  id: string;
  name: string;
  cardCount?: number;
  status?: string;
  createdAt?: string;
  description?: string;
  subject?: string;
  masteryPercentage?: number;
  lastStudied?: string;
}

interface PreviewCardsProps {
  buttonText?: string;
  className?: string;
}

const PreviewCards: React.FC<PreviewCardsProps> = ({ 
  buttonText = "Preview Flashcards",
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState<FlashCardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<FlashCardSet | null>(null);
  
  const router = useRouter();

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/flashcard-sets');
      const data = await response.json();

      if (data.success) {
        setFlashcardSets(data.flashcardSets);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch flashcard sets",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching flashcard sets:", error);
      toast({
        title: "Error",
        description: "Failed to load flashcard sets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      fetchFlashcardSets();
    }
  }, [isDialogOpen]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleReviewClick = (setId: string) => {
    router.push(`/dashboard/flashcards/study/${setId}`);
  };

  const handleDeleteClick = (set: FlashCardSet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setSetToDelete(set);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;

    setDeleteLoading(setToDelete.id);
    
    try {
      const response = await fetch(`/api/flashcard-sets/${setToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove the deleted set from the state
        setFlashcardSets(prev => prev.filter(set => set.id !== setToDelete.id));
        
        toast({
          title: "Success",
          description: `"${setToDelete.name}" has been deleted`,
        });
        
        setDeleteDialogOpen(false);
        setSetToDelete(null);
      } else {
        throw new Error(data.error || 'Failed to delete flashcard set');
      }
    } catch (error) {
      console.error("Error deleting flashcard set:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete flashcard set",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSetToDelete(null);
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
      case 'archived':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        className={`gap-2 hover:bg-blue-50 hover:border-blue-300 ${className}`}
      >
        <Eye className="w-4 h-4" />
        {buttonText}
      </Button>

      {/* Main Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <UnderDevelopmentBanner/>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Your Flashcard Sets
                </DialogTitle>
                <DialogDescription>
                  View and manage all your created flashcard sets.
                </DialogDescription>
              </div>
              <Button
                onClick={fetchFlashcardSets}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : flashcardSets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No Flashcard Sets Yet
                </h3>
                <p className="text-gray-500">
                  Create your first flashcard set to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcardSets.map((set) => (
                  <Card 
                    key={set.id} 
                    className="hover:shadow-md transition-shadow duration-200 border-2 hover:border-blue-200 relative group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {set.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {set.status && (
                            <Badge variant={getStatusColor(set.status)} className="text-xs shrink-0">
                              {set.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteClick(set, e)}
                            disabled={deleteLoading === set.id}
                          >
                            {deleteLoading === set.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {set.subject && (
                        <p className="text-xs text-gray-500 mt-1">{set.subject}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {set.cardCount ?? 0} cards
                            </span>
                            {set.createdAt && (
                              <span className="text-xs">
                                {formatDate(set.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleReviewClick(set.id)}
                          className="w-full gap-2 bg-blue-400 hover:bg-blue-700"
                          size="sm"
                          disabled={!set.cardCount || set.cardCount <= 0}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle>Delete Flashcard Set</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold">"{setToDelete?.name}"</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will permanently delete the flashcard set with {setToDelete?.cardCount || 0} card(s).
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteLoading !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading !== null}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Set
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreviewCards;