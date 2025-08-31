"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, Brain, TrendingUp, DollarSign, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalDocuments: number
  totalFlashcards: number
  totalQuizzes: number
  revenue: number
  growthRate: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  //const supabase = createClient()

  useEffect(() => {
    fetchAdminStats()
  }, [])

 /**  const fetchAdminStats = async () => {
    try {
      // Fetch user stats
      const { data: users } = await supabase.from("profiles").select("id, subscription_status, created_at")

      // Fetch document stats
      const { data: documents } = await supabase.from("documents").select("id")

      // Fetch flashcard stats
      const { data: flashcards } = await supabase.from("flashcards").select("id")

      // Fetch quiz stats
      const { data: quizzes } = await supabase.from("quizzes").select("id")

      const totalUsers = users?.length || 0
      const activeUsers = users?.filter((u) => u.subscription_status === "active").length || 0

      setStats({
        totalUsers,
        activeUsers,
        totalDocuments: documents?.length || 0,
        totalFlashcards: flashcards?.length || 0,
        totalQuizzes: quizzes?.length || 0,
        revenue: activeUsers * 9.99, // Simplified calculation
        growthRate: 12.5, // Mock data
      })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }*/

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Overview of your StudyAI platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeUsers} active subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Total uploaded documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFlashcards}</div>
            <p className="text-xs text-muted-foreground">AI-generated flashcards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.growthRate}%</div>
            <p className="text-xs text-muted-foreground">Month over month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">Generated quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock recent users */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">john.doe@example.com</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <Badge>Free</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">jane.smith@example.com</p>
                  <p className="text-sm text-gray-500">5 hours ago</p>
                </div>
                <Badge variant="secondary">Pro</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform status and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>API Response Time</span>
                <Badge className="bg-green-100 text-green-800">120ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Database Status</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Processing Queue</span>
                <Badge className="bg-yellow-100 text-yellow-800">3 pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>View All Users</Button>
            <Button variant="outline">Export Data</Button>
            <Button variant="outline">System Settings</Button>
            <Button variant="outline">View Logs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function fetchAdminStats() {
  throw new Error("Function not implemented.")
}

