export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Unified Console
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your personal hub for messages, files, and AI
        </p>
        <div className="space-x-4">
          <a
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Sign In
          </a>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
