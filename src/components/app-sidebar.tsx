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
  LayoutDashboard,
  CloudUpload,
  FolderOpen,
  Zap,
  MessageCircle,
  GraduationCap,
  CreditCard,
  Settings,
  LifeBuoy,
  Shield,
  ChevronUp,
  ChevronDown,
  LogOut,
  Sparkles,
  Lightbulb,
  Trophy,
  BookOpen,
  FileQuestion,
  Brain,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
}

const navigationItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    gradient: "from-violet-500 to-purple-600",
    lightGradient: "from-violet-400 to-purple-500",
  },
  //{
    //title: "Upload Files",
    //url: "/dashboard/upload",
    //icon: CloudUpload,
    //gradient: "from-blue-500 to-cyan-600",
    //lightGradient: "from-blue-400 to-cyan-500",
  //},
   {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderOpen,
    gradient: "from-emerald-500 to-teal-600",
    lightGradient: "from-emerald-400 to-teal-500",
  },
]

const studyTools = [

  //"from-teal-400 to-cyan-500"
  //{
    //title: "Flashcards",
    //url: "/dashboard/flash-cards/cards",
    //icon: Zap,
    //"from-teal-500 to-cyan-600"
    //gradient: "from-orange-500 to-red-500",
    //lightGradient: "from-orange-400 to-red-400",
  //},
  {
    title: "Flashcards",
    url: "/dashboard/flash-cards",
    icon: Zap,
    gradient: "from-orange-500 to-red-500",
    lightGradient: "from-orange-400 to-red-400",
  },
  {
    title: "Quiz Generator",
    url: "/dashboard/quiz",
    icon: BookOpen,
    gradient: "from-purple-500 to-indigo-600",
    lightGradient: "from-purple-400 to-indigo-500",
  },
  //{
    //title: "Quiz Generator",
    //url: "/dashboard/quiz/quiz-generator",
    //icon: FileQuestion,
    //gradient: "from-pink-500 to-rose-600",
    //lightGradient: "from-pink-400 to-rose-500",
  //},
  {
    title: "AI Chat",
    url: "/dashboard/chat",
    icon: MessageCircle,
    gradient: "from-indigo-500 to-blue-600",
    lightGradient: "from-indigo-400 to-blue-500",
  },
  {
    title: "Exam Simulator",
    url: "/dashboard/exam",
    icon: GraduationCap,
    gradient: "from-amber-500 to-yellow-600",
    lightGradient: "from-amber-400 to-yellow-500",
  },
]

const accountItems = [
  {
    title: "Payment Plan",
    url: "/dashboard/payment",
    icon: CreditCard,
    gradient: "from-green-500 to-emerald-600",
    lightGradient: "from-green-400 to-emerald-500",
  },
  {
    title: "Settings",
    icon: Settings,
    gradient: "from-gray-500 to-slate-600",
    lightGradient: "from-gray-400 to-slate-500",
    isDropdown: true,
    subItems: [
      {
        title: "Account Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Privacy",
        url: "/dashboard/privacy",
        icon: Shield,
      },
      {
        title: "Help & Support",
        url: "/dashboard/help",
        icon: LifeBuoy,
      },
      {
        title: "What's New",
        url: "/dashboard/new",
        icon: Sparkles,
      }
    ]
  },
  {
    title: "Feature Request",
    url: "/dashboard/request",
    icon: Lightbulb,
    gradient: "from-yellow-500 to-amber-600",
    lightGradient: "from-yellow-400 to-amber-500",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingsExpanded, setSettingsExpanded] = useState(false)

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
    const firstInitial = userProfile.firstName?.charAt(0) || "J"
    const lastInitial = userProfile.lastName?.charAt(0) || "D"
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
    <Sidebar className="bg-gradient-to-b from-white via-gray-50 to-white dark:from-slate-900 border-r border-gray-200 dark:border-slate-700/50 backdrop-blur-xl">
      <SidebarHeader className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-600/10 dark:to-purple-600/10 border-b border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 dark:shadow-violet-500/40">
              <Brain className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              StudyAI
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">AI-Powered Learning</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2 px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    className={`
                      group relative mx-2 rounded-xl transition-all duration-200 ease-out
                      hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:shadow-lg
                      ${pathname === item.url 
                        ? 'bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-300/50 dark:border-violet-500/30 shadow-lg shadow-violet-500/10' 
                        : 'hover:bg-gray-100 dark:hover:bg-slate-800/30'
                      }
                    `}
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <div className={`
                        w-8 h-8 rounded-lg bg-gradient-to-br dark:${item.gradient} ${item.lightGradient}
                        flex items-center justify-center shadow-sm
                        group-hover:shadow-md transition-all duration-200
                        ${pathname === item.url ? 'shadow-lg' : ''}
                      `}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`font-medium text-sm ${
                        pathname === item.url 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2 px-4">
            Study Tools
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {studyTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className={`
                      group relative mx-2 rounded-xl transition-all duration-200 ease-out
                      hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:shadow-lg
                      ${pathname === item.url 
                        ? 'bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-300/50 dark:border-violet-500/30 shadow-lg shadow-violet-500/10' 
                        : 'hover:bg-gray-100 dark:hover:bg-slate-800/30'
                      }
                    `}
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <div className={`
                        w-8 h-8 rounded-lg bg-gradient-to-br dark:${item.gradient} ${item.lightGradient}
                        flex items-center justify-center shadow-sm
                        group-hover:shadow-md transition-all duration-200
                        ${pathname === item.url ? 'shadow-lg' : ''}
                      `}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`font-medium text-sm ${
                        pathname === item.url 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2 px-4">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.isDropdown ? (
                    <div>
                      <SidebarMenuButton 
                        onClick={() => setSettingsExpanded(!settingsExpanded)}
                        className={`
                          group relative mx-2 rounded-xl transition-all duration-200 ease-out cursor-pointer
                          hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:shadow-lg
                          ${settingsExpanded || item.subItems?.some(subItem => pathname === subItem.url)
                            ? 'bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-300/50 dark:border-violet-500/30 shadow-lg shadow-violet-500/10' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800/30'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div className={`
                            w-8 h-8 rounded-lg bg-gradient-to-br dark:${item.gradient} ${item.lightGradient}
                            flex items-center justify-center shadow-sm
                            group-hover:shadow-md transition-all duration-200
                            ${settingsExpanded || item.subItems?.some(subItem => pathname === subItem.url) ? 'shadow-lg' : ''}
                          `}>
                            <item.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className={`font-medium text-sm ${
                            settingsExpanded || item.subItems?.some(subItem => pathname === subItem.url)
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                          }`}>
                            {item.title}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-slate-500 transition-transform duration-200 ${settingsExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </SidebarMenuButton>
                      
                      {settingsExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems?.map((subItem) => (
                            <SidebarMenuButton 
                              key={subItem.title}
                              asChild
                              isActive={pathname === subItem.url}
                              className={`
                                group relative mx-2 rounded-xl transition-all duration-200 ease-out
                                hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:shadow-lg
                                ${pathname === subItem.url 
                                  ? 'bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-300/50 dark:border-violet-500/30 shadow-lg shadow-violet-500/10' 
                                  : 'hover:bg-gray-100 dark:hover:bg-slate-800/30'
                                }
                              `}
                            >
                              <Link href={subItem.url} className="flex items-center gap-3 p-2">
                                <div className="w-6 h-6 rounded-md bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                  <subItem.icon className="w-3 h-3 text-gray-600 dark:text-slate-400" />
                                </div>
                                <span className={`font-medium text-sm ${
                                  pathname === subItem.url 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                }`}>
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : item.url ? (
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      className={`
                        group relative mx-2 rounded-xl transition-all duration-200 ease-out
                        hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:shadow-lg
                        ${pathname === item.url 
                          ? 'bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-300/50 dark:border-violet-500/30 shadow-lg shadow-violet-500/10' 
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 p-3">
                        <div className={`
                          w-8 h-8 rounded-lg bg-gradient-to-br dark:${item.gradient} ${item.lightGradient}
                          flex items-center justify-center shadow-sm
                          group-hover:shadow-md transition-all duration-200
                          ${pathname === item.url ? 'shadow-lg' : ''}
                        `}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className={`font-medium text-sm ${
                          pathname === item.url 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-700/50 border-t border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="group mx-2 my-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-all duration-200">
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-violet-200 dark:ring-violet-500/30 shadow-lg">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-sm text-gray-800 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white">
                      {loading ? "Loading..." : getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400">
                      {userProfile?.email || "user@example.com"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto w-4 h-4 text-gray-500 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-300" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                className="w-[--radix-popper-anchor-width] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700/50 shadow-xl"
              >
                <DropdownMenuItem asChild className="hover:bg-gray-100 dark:hover:bg-slate-700/50 focus:bg-gray-100 dark:focus:bg-slate-700/50 cursor-pointer">
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
                    <span className="text-gray-800 dark:text-slate-200">Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-red-50 dark:hover:bg-red-600/20 focus:bg-red-50 dark:focus:bg-red-600/20 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-4 w-4" />
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