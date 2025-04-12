'use client';

import Image from "next/image"
import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import ClientOnly from '@/components/custom/ClientOnly';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import GoogleButton from "react-google-button"


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/dashboard'); // Redirect to protected page after login
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen flex flex-col">
        <div className="container flex justify-start py-4">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
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
              <h1 className="text-2xl font-bold tracking-tight">Log in to your account</h1>
              {error && <p className="text-red-500">{error}</p>}
              <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required value={email}
                    onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me for 30 days
                  </Label>
                </div>
                <div className="flex justify-center">
                  <Button type="submit" className="min-w-[80px] max-w-[120px] w-[30%] bg-orange-500 hover:bg-orange-600">Log in</Button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleButton onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="w-auto" />
              </div>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>

        <footer className="py-6 border-t">
          <div className="container flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Talent Booking Platform. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Link href="#" className="text-xs text-gray-500 hover:underline">
                Terms
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:underline">
                Privacy
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:underline">
                Help
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  )
}
