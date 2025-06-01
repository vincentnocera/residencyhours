import { redirect } from 'next/navigation'

export default function Home() {
  // Temporary redirect to dashboard while we don't have auth
  redirect('/dashboard')
}