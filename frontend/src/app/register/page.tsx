'use client';
/* import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/login'); // Redirect to login after registration
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleRegister} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Register
        </button>
      </form>
      <div className="mt-4">
        <Link href="/login" className="text-blue-500 hover:underline">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
} */

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"

export default function Register() {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/login'); // Redirect to login after registration
    } else {
      setError(data.error);
    }
  };

  return (
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
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-gray-500">Sign up to start booking amazing talent</p>

            {error && <p className="text-red-500">{error}</p>}

          </div>
          <div className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" className="mt-1" />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the{" "}
                  <Link href="#" className="text-orange-500 hover:text-orange-600">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-orange-500 hover:text-orange-600">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <div className="flex justify-center">
                <Button className="w-auto bg-orange-500 hover:bg-orange-600" type="submit">Create account</Button>
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
              <Button variant="outline" className="w-auto">
                Google
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                Log in
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
    </div >
  )
}

