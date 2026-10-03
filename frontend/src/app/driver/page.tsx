import { logoutAction } from '../actions/auth'

export default function DriverDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fernleaf <span className="text-emerald-600">Kitchen</span></h1>
            <form action={logoutAction}>
              <button type="submit" className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors font-medium text-sm border border-gray-200">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Driver Portal</h2>
          <p className="mt-2 text-gray-500">View your assigned drops, mark as delivered, and check routes.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p className="text-gray-500 font-medium">Dashboard content will be implemented here</p>
          </div>
        </div>
      </main>
    </div>
  )
}
