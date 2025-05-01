'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '@/app/utils/axios';
import { User } from '@prisma/client';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await axios.post(
      '/api/auth/register',
      {
        name,
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: Omit<User, 'passwordHash'> = await res.data;
    console.log('register', result);

    if (res.status === 200) {
      router.push('/login'); // Redirect to login after registration
    } else {
      setError(res.data.error);
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
}
