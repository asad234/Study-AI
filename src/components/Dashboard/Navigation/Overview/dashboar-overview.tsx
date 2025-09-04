"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, MessageSquare, Brain, Upload, TrendingUp, Award, Plus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  status: string
  createdAt: string
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  bio?: string
  location?: string
}

export default function DashboardPage() {
  const [recentFiles, setRecentFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchRecentFiles = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/documents")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] API response:", data)
          const documents = data.documents || []
          console.log("[v0] Documents array:", documents)
          setRecentFiles(documents.slice(0, 3)) // Show only 3 most recent
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserProfile = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const profile = await response.json()
          setUserProfile(profile)
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      }
    }

    fetchRecentFiles()
    fetchUserProfile()
  }, [session])

  const formatUploadTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  const studyStats = [
    { label: "Cards Studied", value: 156, change: "+12%" },
    { label: "Quizzes Completed", value: 23, change: "+8%" },
    { label: "Study Streak", value: 7, change: "days" },
    { label: "Average Score", value: 87, change: "+5%" },
  ]

  const getWelcomeMessage = () => {
    if (userProfile?.firstName) {
      return `Welcome back, ${userProfile.firstName}!`
    }
    return "Welcome back, Student!"
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getWelcomeMessage()}</h1>
          <p className="text-gray-600 dark:text-gray-300">Ready to continue your learning journey?</p>
        </div>
        <Link href="/dashboard/upload">
          <Button size="lg" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Materials
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {studyStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">{stat.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Study Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/cards">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Flashcards</CardTitle>
              <CardDescription>Study with AI-generated flashcards</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/quiz">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Quiz Generator</CardTitle>
              <CardDescription>Test your knowledge with custom quizzes</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/chat">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">AI Chat</CardTitle>
              <CardDescription>Ask questions about your materials</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/exam">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Brain className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg">Exam Simulator</CardTitle>
              <CardDescription>Practice with realistic exam conditions</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Files
            </CardTitle>
            <CardDescription>Your recently uploaded study materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading your files...</div>
            ) : recentFiles.length > 0 ? (
              recentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.title || file.file_name}</p>
                      <p className="text-xs text-gray-500">{formatUploadTime(file.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={file.status === "ready" ? "default" : "secondary"}>{file.status}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No files uploaded yet. Upload your first study material!
              </div>
            )}
            <Link href="/dashboard/upload">
              <Button variant="outline" className="w-full bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Upload New File
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Study Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Study Progress
            </CardTitle>
            <CardDescription>Your learning progress this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal</span>
                <span>7/10 sessions</span>
              </div>
              <Progress value={70} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cards Mastered</span>
                <span>156/200</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Quiz Accuracy</span>
                <span>87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Great progress!</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  You&apos;re on track to meet your weekly goal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
