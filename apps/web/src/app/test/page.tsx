'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card w-full max-w-md mx-4 text-center">
        <h1 className="text-2xl font-bold mb-4">✅ ClubOps AI is Working</h1>
        <p className="text-gray-500 mb-4">The web app is rendering correctly.</p>
        <div className="flex gap-2 justify-center">
          <a href="/login" className="btn btn-primary">Go to Login</a>
          <a href="/signup" className="btn">Go to Signup</a>
        </div>
      </div>
    </div>
  );
}