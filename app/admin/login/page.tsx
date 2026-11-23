'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('Email ou mot de passe incorrect');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white rounded-xl shadow w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-4 text-gray-800 text-center">
          Admin Login
        </h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full mb-3 p-2 border rounded text-gray-700"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full mb-3 p-2 border rounded text-gray-700"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button className="w-full bg-black text-white p-2 rounded">
          Se connecter
        </button>
      </form>
    </div>
  );
}
