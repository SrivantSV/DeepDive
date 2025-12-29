import Link from 'next/link'

export default function TestLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Test Navigation */}
            <nav className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-6 h-14">
                        <span className="font-bold text-gray-900">🧪 Test Suite</span>
                        <Link
                            href="/test"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            API Dashboard
                        </Link>
                        <Link
                            href="/test/extrapolation"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Extrapolation Tests
                        </Link>
                        <Link
                            href="/test/chat"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Chat Tester
                        </Link>
                        <div className="flex-1" />
                        <Link
                            href="/"
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            ← Back to App
                        </Link>
                    </div>
                </div>
            </nav>
            {children}
        </div>
    )
}
