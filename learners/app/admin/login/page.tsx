'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage('Invalid email or password');
      setIsSubmitting(false);
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 380, padding: 32, border: '1px solid #ddd' }}
      >
        <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>Admin Login</h1>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', marginBottom: 6 }}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ width: '100%', padding: 10, boxSizing: 'border-box' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ display: 'block', marginBottom: 6 }}>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ width: '100%', padding: 10, boxSizing: 'border-box' }}
          />
        </label>
        {errorMessage && <p style={{ color: '#b42318', margin: '0 0 16px' }}>{errorMessage}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: 10, cursor: isSubmitting ? 'wait' : 'pointer' }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
