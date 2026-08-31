'use client';

import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card w-full max-w-md mx-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        {sent ? (
          <div>
            <p className="text-green-600 mb-4">Password reset email sent! Check your inbox.</p>
            <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input" type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary w-full">Send Reset Link</button>
            <a href="/login" className="block text-sm text-gray-500 hover:underline">Back to Login</a>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return <AuthProvider><ForgotPasswordForm /></AuthProvider>;
}