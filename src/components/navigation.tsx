"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, Grid3X3, Settings, LogOut, UserCircle, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/services/auth' // Assuming auth service is here
import type { User } from '@/types' // Using the consolidated type from @/types
import { supabase } from '@/lib/supabase' // For logout

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Calendar, roles: ['resident', 'program_director', 'admin'] },
  // { name: 'Templates', href: '/templates', icon: FileSpreadsheet, roles: ['resident', 'program_director', 'admin'] },
  { name: 'Admin', href: '/admin', icon: Grid3X3, roles: ['program_director', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['resident', 'program_director', 'admin'] },
]

export function Navigation() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true)
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        setCurrentUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error)
    } else {
      // Redirect to login page or home page after logout
      // For now, just clear the user and let effects handle the redirect if any
      setCurrentUser(null)
      // router.push('/login'); // Example if using Next.js router
    }
  }

  const filteredNavigation = currentUser
    ? baseNavigation.filter(item => item.roles.includes(currentUser.role))
    : []

  const displayName = currentUser 
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email
    : 'Guest'

  if (isLoading) {
    return (
      <nav className="border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex flex-shrink-0 items-center">
              <h1 className="text-xl font-bold">Residency Hours</h1>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <h1 className="text-xl font-bold">Residency Hours</h1>
            </div>
            {currentUser && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2",
                        pathname === item.href
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {displayName}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link href="/login" passHref> {/* Assuming you have a /login page */}
                <Button variant="outline" size="sm">
                  <UserCircle className="mr-1 h-3 w-3" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}