export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">⚽</span>
          <h1 className="mt-3 text-2xl font-bold gold-text">Prode Mundial 2026</h1>
          <p className="text-dark-400 text-sm mt-1">El pronóstico más completo del Mundial</p>
        </div>
        {children}
      </div>
    </div>
  )
}
