import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Cpu,
  Landmark,
  Pause,
  Play,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Fingerprint,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { NexusLogo } from '@nexus/ui'
import { mockAnnouncements } from '../data/mockData'
import type { Workspace } from '../lib/types'
import { workspaceClient } from '../lib/workspaceClient'
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal'

export default function DashboardWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0)
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true)

  const navigate = useNavigate()

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current))
    }, 3000)
  }

  useEffect(() => {
    let active = true
    workspaceClient
      .getWorkspaces()
      .then((data) => {
        if (active) {
          setWorkspaces(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          showToast('Lỗi tải danh sách không gian làm việc')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Carousel autoplay timer
  useEffect(() => {
    if (!isCarouselPlaying) return
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % mockAnnouncements.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isCarouselPlaying])

  const handleCreated = (newWs: Workspace) => {
    setWorkspaces((prev) => [newWs, ...prev])
    showToast(`Đã phân bổ thành công workspace https://${newWs.slug}.nexus.com`)
    navigate(`/workspaces/${newWs.slug}/channels`)
  }

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'precision_manufacturing':
        return <Cpu className="w-5 h-5 text-indigo-600" />
      case 'account_balance':
        return <Landmark className="w-5 h-5 text-indigo-600" />
      default:
        return <CreditCard className="w-5 h-5 text-indigo-600" />
    }
  }

  return (
    <div className="bg-[#FAF8FF] min-h-screen text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-[1240px] mx-auto h-14 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-2">
              <NexusLogo size={28} />
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                DELIVERY
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-900">Nexus Delivery Hub</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án, slug, nhân sự... (Ctrl + K)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <kbd className="absolute right-3 font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Không có thông báo chưa đọc mới')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors">
              <div className="flex flex-col text-right hidden lg:flex">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  Huy
                </span>
                <span className="font-mono text-[10px] text-indigo-600 leading-none">
                  Delivery Member
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                H
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1240px] w-full mx-auto px-4 py-6 flex flex-col gap-6 flex-1">
        {/* Header Action Strip: Carousel + Create Button */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          {/* Real-time Carousel */}
          <div className="flex-1 min-w-0">
            <div className="w-full bg-slate-50 rounded-xl border border-indigo-100 shadow-xs overflow-hidden relative">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white/90">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                    THÔNG BÁO TỔNG QUAN
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                    | Cập nhật Real-time Merkle Event Bus
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-700 font-bold">
                    {activeSlide + 1} / {mockAnnouncements.length}
                  </span>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() =>
                        setActiveSlide(
                          (prev) => (prev - 1 + mockAnnouncements.length) % mockAnnouncements.length,
                        )
                      }
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsCarouselPlaying(!isCarouselPlaying)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                      {isCarouselPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setActiveSlide((prev) => (prev + 1) % mockAnnouncements.length)
                      }
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    {mockAnnouncements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeSlide ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Current slide content */}
              <div className="p-3 px-4 min-h-[58px] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                      mockAnnouncements[activeSlide].type === 'error'
                        ? 'bg-red-600 text-white'
                        : mockAnnouncements[activeSlide].type === 'tertiary'
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {mockAnnouncements[activeSlide].typeLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px] font-semibold shrink-0">
                    {mockAnnouncements[activeSlide].tag}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {mockAnnouncements[activeSlide].title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-indigo-700 font-mono text-[11px] font-bold bg-indigo-50 px-2 py-0.5 rounded">
                    {mockAnnouncements[activeSlide].timeAgo}
                  </span>
                  <button
                    onClick={() => showToast(mockAnnouncements[activeSlide].title)}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                  >
                    <span className="hidden md:inline">{mockAnnouncements[activeSlide].linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Create Site */}
          <div className="flex items-center shrink-0 self-stretch lg:self-auto justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs group whitespace-nowrap"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Khởi tạo Site Mới</span>
            </button>
          </div>
        </div>

        {/* Directory Header Strip */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">Hiển thị không gian vận hành</span>
              <span className="font-mono text-slate-400">
                | Đồng bộ trạng thái thực 100% qua Merkle Tree
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> 8 Live Node
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 1 Pending RFC
              </span>
            </div>
          </div>

          {/* Projects List */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Đang tải danh sách không gian vận hành...
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-400 font-mono text-xs">
              Không tìm thấy dự án nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl px-4 py-3 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {renderIcon(ws.icon)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {ws.name}
                        </h3>
                        <span className="font-mono text-xs text-slate-400 font-medium">
                          /{ws.slug}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          {ws.statusBadge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 leading-normal">
                        {ws.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center -space-x-1.5">
                      {ws.members.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-[9px] ring-2 ring-white"
                          title={`${m.name} (${m.roleLabel})`}
                        >
                          {m.avatar}
                        </div>
                      ))}
                      {ws.memberCount > 3 && (
                        <span className="pl-2 font-mono text-[11px] text-slate-400">
                          +{ws.memberCount - 3}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/workspaces/${ws.slug}/channels`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white text-xs font-semibold transition-all"
                    >
                      <span>Truy cập Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & RFC Policy Footer Callout */}
        <footer className="w-full border-t border-slate-200 bg-white/80 rounded-xl p-4 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900">
                  Quy chuẩn Bảo mật Kiến trúc RFC 3161 & ISO/IEC 27001
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Tất cả thông điệp tại kênh #project-memory được bảo đảm bằng chuỗi băm Merkle Tree thời gian thực.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs shrink-0">
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">AUDIT HASH: 0x7e3f...a891</span>
            </div>
          </div>
        </footer>
      </main>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
