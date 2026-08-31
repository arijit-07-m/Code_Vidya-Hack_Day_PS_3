'use client';
import { useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    }
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
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <a href="/login" className="block text-sm text-gray-500 hover:underline">Back to Login</a>
          </form>
        )}
      </div>
    </div>
  );
}