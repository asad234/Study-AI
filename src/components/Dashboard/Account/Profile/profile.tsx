"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ProfileType = {
  firstName: string
  lastName: string
  email: string
  bio: string
  location: string
  profileImage?: string
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType>({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    location: "",
    profileImage: "",
  })

  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile")
        if (!res.ok) throw new Error("Failed to fetch profile")
        const data = await res.json()
        setProfile(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile({ ...profile, [name]: value })
  }

  const handleProfileUpdate = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error("Failed to update profile")

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile information.",
        variant: "destructive",
      })
    }
  }

  if (loading) return <p>Loading profile...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </CardTitle>
        <CardDescription>Update your personal information and profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.profileImage || "/placeholder.svg?height=80&width=80"} />
            <AvatarFallback className="text-lg">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Change Photo
            </Button>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>

        <Separator />

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>First Name</Label>
            <Input name="firstName" value={profile.firstName} onChange={handleInputChange} placeholder="First Name" />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input name="lastName" value={profile.lastName} onChange={handleInputChange} placeholder="Last Name" />
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" name="email" value={profile.email} onChange={handleInputChange} placeholder="Email" />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              placeholder="Write something about yourself"
              className="w-full border rounded-md p-2"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Location</Label>
            <Input name="location" value={profile.location} onChange={handleInputChange} placeholder="Location" />
          </div>
        </div>

        <Button onClick={handleProfileUpdate} className="mt-4">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}
