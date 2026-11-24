import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardChannel from './pages/DashboardChannel'
import DashboardWorkspace from './pages/DashboardWorkspace'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardWorkspace />} />
      <Route path="/workspaces/:workspaceId/channels" element={<DashboardChannel />} />
      <Route
        path="/workspaces/:workspaceId"
        element={<WorkspaceRedirect />}
      />
      <Route path="/login" element={<LoginShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function WorkspaceRedirect() {
  return <Navigate to="channels" replace />
}

function LoginShell() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef0f8] px-4">
      <section className="w-full max-w-md rounded-3xl bg-white px-8 py-10 text-center shadow-[0_20px_60px_rgba(80,70,160,0.08)]">
        <p className="text-sm font-semibold tracking-wide text-[#5b4dff]">Nexus</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Delivery Portal</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Khung ứng dụng đã chạy. Màn đăng nhập sẽ được dựng trên route này.
        </p>
      </section>
    </main>
  )
}
