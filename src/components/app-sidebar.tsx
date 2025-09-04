"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Upload,
  BookOpen,
  FileText,
  MessageSquare,
  Brain,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
  ChevronUp,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface UserProfile {
  firstName: string // Changed from first_name to firstName to match API response
  lastName: string // Changed from last_name to lastName to match API response
  email: string
}

const navigationItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Upload Files",
    url: "/dashboard/upload",
    icon: Upload,
  },
]

const studyTools = [
  {
    title: "Flashcards",
    url: "/dashboard/cards",
    icon: BookOpen,
  },
  {
    title: "Quiz Generator",
    url: "/dashboard/quiz",
    icon: FileText,
  },
  {
    title: "AI Chat",
    url: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    title: "Exam Simulator",
    url: "/dashboard/exam",
    icon: Brain,
  },
]

const accountItems = [
  {
    title: "Payment Plan",
    url: "/dashboard/payment",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/dashboard/help",
    icon: HelpCircle,
  },
  {
    title: "Privacy",
    url: "/dashboard/privacy",
    icon: Shield,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/profile")

        if (response.ok) {
          const profile = await response.json()
          setUserProfile(profile)
        } else {
          const errorText = await response.text()
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  const getUserInitials = () => {
    if (!userProfile) return "JD"
    const firstInitial = userProfile.firstName?.charAt(0) || "J" // Updated field name
    const lastInitial = userProfile.lastName?.charAt(0) || "D" // Updated field name
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  const getUserDisplayName = () => {
    if (!userProfile) {
      return "John Doe"
    }
    const displayName = `${userProfile.firstName || "John"} ${userProfile.lastName || "Doe"}`
    return displayName
  }

  return (
    <Sidebar className="bg-background border-r">
      <SidebarHeader className="bg-background border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">StudyAI</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="hover:bg-accent">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Study Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="hover:bg-accent">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="hover:bg-accent">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-background border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:bg-accent">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span>{loading ? "Loading..." : getUserDisplayName()}</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width) bg-background border">
                <DropdownMenuItem asChild className="hover:bg-accent">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-accent" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
