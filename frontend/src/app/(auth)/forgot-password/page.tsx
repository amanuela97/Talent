"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import axios from "@/app/utils/axios"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setIsSubmitting(true)

    try {
      const res = await axios.post("/auth/forgot-password", {
        email,
      })
      console.log(res)
      setMessage(res.data.message || "Password reset email has been sent.")
    } catch (err: unknown) {
      const errorMsg = isAxiosError(err) ? err?.response?.data?.message : "Something went wrong. Try again."
      setError(errorMsg)
      console.log(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container flex justify-start py-4">
        <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <Image
              src="/assets/talent_logo.png"
              alt="Talent Logo"
              width={150}
              height={60}
              priority
            />
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-gray-500 text-center">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <div className="space-y-6">
            {message && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <AlertDescription>
                  {typeof message === "string" ? message : "Password reset email has been sent."}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{typeof error === "string" ? error : "An error occurred."}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="min-w-[80px] max-w-[120px] w-[200px] bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
