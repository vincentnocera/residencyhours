"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/services/auth'
import { supabase } from '@/lib/supabase' // For updating profile
import type { User } from '@/types'
import Link from 'next/link'

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  // Placeholder for now, until schema is updated
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true)
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        if (user) {
          setFirstName(user.first_name || '')
          setLastName(user.last_name || '')
          setEmail(user.email || '')
          // Set phone & notifications if/when they are added to user type
          // setPhone(user.phone || '')
          // setEmailNotifications(user.emailNotifications || false)
          // setSmsNotifications(user.smsNotifications || false)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSaveChanges = async () => {
    if (!currentUser) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email, // Assuming email can be updated, though Supabase auth email might be separate
          // phone: phone, // Add when schema supports
          // email_notifications: emailNotifications, // Add when schema supports
          // sms_notifications: smsNotifications, // Add when schema supports
        })
        .eq('id', currentUser.id)

      if (error) {
        console.error("Error updating profile:", error)
        // TODO: Show error toast to user
      } else {
        // TODO: Show success toast to user
        // Optionally re-fetch user data if needed, though local state is updated
        setCurrentUser(prev => prev ? ({...prev, first_name: firstName, last_name: lastName, email: email }) : null);
        alert('Profile updated successfully!') // Simple alert for now
      }
    } catch (err) {
      console.error("Save changes error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUser) {
    return (
       <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
                <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and notification preferences
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information. Email updates here might not change your login email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Display Only)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences (Display Only)</CardTitle>
            <CardDescription>
              These settings are not yet functional. Choose how you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-muted-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders and updates via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-muted-foreground">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders via text message
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="h-4 w-4"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}