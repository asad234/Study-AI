"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Calendar, 
  Star,
  Zap,
  Bug,
  Shield,
  Palette,
  Database,
  Users,
  Brain,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Rocket,
  Settings,
  BookOpen
} from 'lucide-react';
import UnderDevelopmentBanner from '@/components/common/underDevelopment';

interface UpdateItem {
  type: 'feature' | 'improvement' | 'bugfix' | 'security';
  title: string;
  description: string;
}

interface VersionUpdate {
  version: string;
  date: string;
  status: 'latest' | 'recent' | 'older';
  highlights: string[];
  updates: UpdateItem[];
  isBreaking?: boolean;
}

const versionUpdates: VersionUpdate[] = [
  {
    version: "2.4.0",
    date: "March 15, 2024",
    status: "latest",
    highlights: [
      "AI-powered study recommendations",
      "Enhanced dark mode experience",
      "Real-time collaboration features"
    ],
    updates: [
      {
        type: "feature",
        title: "Smart Study Recommendations",
        description: "Our AI now analyzes your performance patterns to suggest personalized study paths and focus areas."
      },
      {
        type: "feature",
        title: "Real-time Study Groups",
        description: "Collaborate with classmates in real-time with shared notes, live chat, and synchronized study sessions."
      },
      {
        type: "improvement",
        title: "Enhanced Dark Mode",
        description: "Improved contrast ratios and reduced eye strain with our redesigned dark theme across all components."
      },
      {
        type: "improvement",
        title: "Faster Loading Times",
        description: "Optimized backend infrastructure reduces page load times by up to 40%."
      },
      {
        type: "bugfix",
        title: "Quiz Timer Accuracy",
        description: "Fixed an issue where quiz timers would occasionally drift or reset unexpectedly."
      },
      {
        type: "security",
        title: "Enhanced Authentication",
        description: "Implemented additional security layers for account protection and data encryption."
      }
    ]
  },
  {
    version: "2.3.2",
    date: "February 28, 2024",
    status: "recent",
    highlights: [
      "Mobile app improvements",
      "Export functionality",
      "Performance optimizations"
    ],
    updates: [
      {
        type: "feature",
        title: "Study Data Export",
        description: "Export your study progress, notes, and performance analytics in multiple formats (PDF, CSV, JSON)."
      },
      {
        type: "improvement",
        title: "Mobile Responsiveness",
        description: "Better touch interactions and optimized layouts for tablets and smartphones."
      },
      {
        type: "improvement",
        title: "Search Performance",
        description: "Lightning-fast search across all your study materials with improved relevance ranking."
      },
      {
        type: "bugfix",
        title: "Notification Delivery",
        description: "Resolved issues with push notifications not appearing consistently across all devices."
      },
      {
        type: "bugfix",
        title: "Session Persistence",
        description: "Fixed occasional logouts during long study sessions."
      }
    ]
  },
  {
    version: "2.3.1",
    date: "February 14, 2024",
    status: "recent",
    highlights: [
      "Valentine's UI theme",
      "Accessibility improvements",
      "Bug fixes"
    ],
    updates: [
      {
        type: "feature",
        title: "Accessibility Enhancements",
        description: "Improved screen reader support, keyboard navigation, and high contrast mode for better accessibility."
      },
      {
        type: "improvement",
        title: "Study Streak Tracking",
        description: "Visual indicators and achievements for maintaining consistent daily study habits."
      },
      {
        type: "bugfix",
        title: "Image Upload Issues",
        description: "Fixed problems with uploading images in study notes and flashcards."
      },
      {
        type: "bugfix",
        title: "Calendar Sync",
        description: "Resolved calendar integration issues with Google Calendar and Outlook."
      }
    ]
  },
  {
    version: "2.3.0",
    date: "January 30, 2024",
    status: "older",
    isBreaking: true,
    highlights: [
      "Major UI redesign",
      "New study modes",
      "API v3 migration"
    ],
    updates: [
      {
        type: "feature",
        title: "Spaced Repetition Algorithm",
        description: "Intelligent flashcard scheduling based on your learning patterns and retention rates."
      },
      {
        type: "feature",
        title: "Study Analytics Dashboard",
        description: "Comprehensive insights into your study habits, progress trends, and performance metrics."
      },
      {
        type: "improvement",
        title: "Complete UI Overhaul",
        description: "Modern, intuitive interface with improved navigation and visual hierarchy."
      },
      {
        type: "improvement",
        title: "API Performance",
        description: "Migrated to API v3 with 60% faster response times and better error handling."
      },
      {
        type: "security",
        title: "Data Encryption Upgrade",
        description: "Enhanced encryption standards for all user data with zero-knowledge architecture."
      }
    ]
  }
];

const updateTypeConfig = {
  feature: { icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', label: 'New Feature' },
  improvement: { icon: Zap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'Improvement' },
  bugfix: { icon: Bug, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', label: 'Bug Fix' },
  security: { icon: Shield, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', label: 'Security' }
};

export default function WhatsNewPage() {
  const [selectedVersion, setSelectedVersion] = useState<string>("2.4.0");
  const [filterType, setFilterType] = useState<string>('all');

  const selectedUpdate = versionUpdates.find(update => update.version === selectedVersion);
  
  const filteredUpdates = selectedUpdate?.updates.filter(update => 
    filterType === 'all' || update.type === filterType
  ) || [];

  const getStatusBadge = (status: string, isBreaking?: boolean) => {
    if (isBreaking) {
      return <Badge variant="destructive" className="ml-2">Breaking Changes</Badge>;
    }
    
    switch (status) {
      case 'latest':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 ml-2">Latest</Badge>;
      case 'recent':
        return <Badge variant="secondary" className="ml-2">Recent</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <UnderDevelopmentBanner/>
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">What's New</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and fixes in Study-AI. 
            We're constantly working to make your learning experience better.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Rocket className="w-3 h-3" />
              Version {versionUpdates[0].version}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
              {versionUpdates[0].updates.length} Updates
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Version Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Version History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {versionUpdates.map((update) => (
                    <button
                      key={update.version}
                      onClick={() => setSelectedVersion(update.version)}
                      className={`w-full text-left px-4 py-3 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedVersion === update.version
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">v{update.version}</span>
                            {getStatusBadge(update.status, update.isBreaking)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {update.date}
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Release Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Releases</span>
                    <Badge variant="outline">{versionUpdates.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">New Features</span>
                    <Badge variant="outline">
                      {versionUpdates.reduce((acc, v) => acc + v.updates.filter(u => u.type === 'feature').length, 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bug Fixes</span>
                    <Badge variant="outline">
                      {versionUpdates.reduce((acc, v) => acc + v.updates.filter(u => u.type === 'bugfix').length, 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {selectedUpdate && (
              <>
                {/* Version Header */}
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          Version {selectedUpdate.version}
                          {getStatusBadge(selectedUpdate.status, selectedUpdate.isBreaking)}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          Released on {selectedUpdate.date}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedUpdate.isBreaking && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Breaking Changes:</strong> This version includes changes that may affect existing functionality. 
                          Please review the updates carefully and test your workflows.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Key Highlights
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedUpdate.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    All Updates ({selectedUpdate.updates.length})
                  </Button>
                  {Object.entries(updateTypeConfig).map(([type, config]) => {
                    const count = selectedUpdate.updates.filter(u => u.type === type).length;
                    if (count === 0) return null;
                    
                    const IconComponent = config.icon;
                    return (
                      <Button
                        key={type}
                        variant={filterType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType(type)}
                        className="flex items-center gap-2"
                      >
                        <IconComponent className="w-3 h-3" />
                        {config.label} ({count})
                      </Button>
                    );
                  })}
                </div>

                {/* Updates List */}
                <div className="space-y-4">
                  {filteredUpdates.map((update, index) => {
                    const config = updateTypeConfig[update.type];
                    const IconComponent = config.icon;
                    
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                              <IconComponent className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{update.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{update.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredUpdates.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No updates found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No updates of the selected type in version {selectedUpdate.version}.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Feedback Section */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Share Your Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Help us improve Study-AI! Share your thoughts on new features, report issues, or suggest improvements.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Star className="w-4 h-4 mr-2" />
                    Rate This Update
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bug className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                  <Button variant="outline" size="sm">
                    <Brain className="w-4 h-4 mr-2" />
                    Suggest Feature
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Preview */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-dashed border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Here's a sneak peek at what we're working on for the next release:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Advanced AI tutoring with voice interaction</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Offline mode for studying without internet</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Integration with major learning management systems</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">Enhanced mobile app with Apple Watch support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}