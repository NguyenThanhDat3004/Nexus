import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BarChart2,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { NexusLogo } from '@nexus/ui'
import { ChannelList } from '../components/ChannelList'
import { ChannelMessages } from '../components/ChannelMessages'
import type { Channel, ChannelMessage, CreateChannelPayload, Workspace } from '../lib/types'
import { workspaceClient } from '../lib/workspaceClient'

export default function DashboardChannel() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation tab state
  const [activeNavTab, setActiveNavTab] = useState<string>('overview')

  // Right Panel state: Copilot & Analytics
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState<'copilot' | 'analytics'>('copilot')

  // Floating speed dial & member popover
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false)
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false)

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current))
    }, 3000)
  }

  // Load workspace and channels
  useEffect(() => {
    if (!workspaceId) return
    let isMounted = true

    const loadData = async () => {
      try {
        const ws = await workspaceClient.getWorkspace(workspaceId)
        if (!isMounted) return
        setWorkspace(ws)

        const chanList = await workspaceClient.getChannels(ws.id)
        if (!isMounted) return
        setChannels(chanList)

        const initialChan =
          chanList.find((c) => c.name === 'general') || chanList[0] || null
        setActiveChannel(initialChan)

        if (initialChan) {
          const msgs = await workspaceClient.getMessages(ws.id, initialChan.id)
          if (!isMounted) return
          setMessages(msgs)
        }
      } catch {
        if (!isMounted) return
        showToast('Không tìm thấy không gian làm việc. Đang quay lại trang chủ...')
        setTimeout(() => navigate('/'), 1500)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [workspaceId, navigate])

  // Switch channel: Must change BOTH active channel and the message list (Bug 1 fixed!)
  const handleSelectChannel = async (chan: Channel) => {
    if (!workspace) return
    setActiveChannel(chan)
    try {
      const msgs = await workspaceClient.getMessages(workspace.id, chan.id)
      setMessages(msgs)
      showToast(`Đang xem #${chan.name} (${chan.displayName || chan.name})`)
    } catch {
      showToast(`Lỗi tải tin nhắn của kênh #${chan.name}`)
    }
  }

  // Create Channel handler
  const handleCreateChannel = async (payload: CreateChannelPayload): Promise<Channel> => {
    if (!workspace) throw new Error('Chưa chọn workspace')
    const newChan = await workspaceClient.createChannel(workspace.id, payload)
    setChannels((prev) => [...prev, newChan])
    handleSelectChannel(newChan)
    showToast(`Đã tạo thành công kênh #${newChan.name}`)
    return newChan
  }

  // Send message handler (Bug 2: #general read-only checked inside ChannelMessages or here)
  const handleSendMessage = async (content: string) => {
    if (!workspace || !activeChannel) return
    if (activeChannel.name === 'general' || activeChannel.isReadOnly) {
      showToast('chỉ admin/PM mới được đăng thông báo')
      return
    }

    const sent = await workspaceClient.sendMessage(workspace.id, activeChannel.id, { content })
    setMessages((prev) => [...prev, sent])
  }

  const toggleRightPanel = (tabToFocus?: 'copilot' | 'analytics') => {
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true)
      if (tabToFocus) setRightPanelTab(tabToFocus)
      showToast('Đã mở ngăn Copilot & Phân tích')
    } else if (tabToFocus && tabToFocus !== rightPanelTab) {
      setRightPanelTab(tabToFocus)
      showToast(`Đã chuyển sang tab: ${tabToFocus === 'copilot' ? 'Copilot AI' : 'Phân tích'}`)
    } else {
      setIsRightPanelOpen(false)
      showToast('Đã thu gọn ngăn phân tích bên phải')
    }
  }

  if (loading || !workspace || !activeChannel) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center font-mono text-xs text-slate-500">
        Đang đồng bộ trạng thái Merkle Tree và tải kênh...
      </div>
    )
  }

  return (
    <div className="bg-[#FAF8FF] min-h-screen text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-xs font-medium">
              <NexusLogo size={24} markOnly />
              <span className="hidden sm:inline">Homespace</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                {workspace.name}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg hidden md:flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn, quyết định, tài liệu, RFC..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
            <kbd className="absolute right-3 font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleRightPanel('analytics')}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span>Insight</span>
            </button>
            <button
              onClick={() => showToast('Mở cài đặt không gian làm việc')}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Cài đặt</span>
            </button>
            <button
              onClick={() => showToast('Không có thông báo mới')}
              className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                H
              </div>
              <div className="hidden xl:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-slate-900">Huy</span>
                <span className="font-mono text-[10px] text-slate-500 mt-0.5">Delivery Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar: 6 Standard Tabs from Stitch */}
        <div className="border-t border-slate-200/80 bg-white shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
            <nav className="flex items-center gap-6 text-xs whitespace-nowrap">
              {[
                { id: 'overview', label: 'Tổng quan' },
                { id: 'decisions-rfc', label: 'Quyết định & RFC' },
                { id: 'artifacts-compliance', label: 'Artifacts & Compliance' },
                { id: 'jira-github-sync', label: 'Đồng bộ Jira/GitHub' },
                { id: 'team-alignment', label: 'Nhân sự & Tiến độ' },
                { id: 'audit-trail', label: 'Audit Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveNavTab(tab.id)
                    showToast(`Đang chuyển sang tab: ${tab.label}`)
                  }}
                  className={`py-2.5 transition-colors font-medium border-b-2 ${
                    activeNavTab === tab.id
                      ? 'text-indigo-600 font-semibold border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main 3-Column Responsive Grid */}
      <main className="w-full max-w-7xl mx-auto px-4 py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 transition-all duration-300 items-start">
          {/* Column 1: Kênh & Luồng (2/10) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <ChannelList
              channels={channels}
              activeChannelId={activeChannel.id}
              onSelectChannel={handleSelectChannel}
              onCreateChannel={handleCreateChannel}
              onToast={showToast}
            />
          </div>

          {/* Column 2: Khung hội thoại & Quyết định (6/10 hoặc 8/10 khi ẩn panel) */}
          <div
            className={`flex flex-col gap-3 min-w-0 transition-all duration-300 ${
              isRightPanelOpen ? 'lg:col-span-6' : 'lg:col-span-8'
            }`}
          >
            <ChannelMessages
              workspace={workspace}
              channel={activeChannel}
              messages={messages}
              onSendMessage={handleSendMessage}
              onToggleRightPanel={toggleRightPanel}
              onToast={showToast}
            />
          </div>

          {/* Column 3: AI Copilot & Phân tích tổng hợp (2/10) */}
          {isRightPanelOpen && (
            <div className="lg:col-span-2 flex flex-col gap-3 transition-all duration-300">
              <div className="bg-white rounded-xl shadow-xs overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        AI Copilot & Phân tích
                      </span>
                      <span className="font-mono text-[10px] text-emerald-600 flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active Engine v4.2
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRightPanel()}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Thu gọn ngăn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tab switch */}
                <div className="flex items-center border-b border-slate-200 bg-slate-50/50 text-xs font-mono">
                  <button
                    onClick={() => setRightPanelTab('copilot')}
                    className={`flex-1 py-2 text-center transition-all flex items-center justify-center gap-1 ${
                      rightPanelTab === 'copilot'
                        ? 'font-semibold text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Copilot AI</span>
                  </button>
                  <button
                    onClick={() => setRightPanelTab('analytics')}
                    className={`flex-1 py-2 text-center transition-all flex items-center justify-center gap-1 ${
                      rightPanelTab === 'analytics'
                        ? 'font-semibold text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Phân tích</span>
                  </button>
                </div>

                {/* Tab Content: Copilot */}
                {rightPanelTab === 'copilot' ? (
                  <div className="p-3 flex flex-col gap-3 max-h-[560px] overflow-y-auto text-xs">
                    <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-indigo-700 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> Tóm tắt nhanh
                        </span>
                        <span className="text-[10px] text-slate-400">Sprint 1</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-normal">
                        PR #11 đã merge: monorepo DDD đã có backend/domains và database. Đạt & Phúc đang triển khai login SSO, Google + PIN.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Hành động gợi ý
                      </span>
                      <div className="space-y-1 text-[11px]">
                        <button
                          onClick={() =>
                            showToast('Copilot: Đạt cập nhật spec login SSO + Google (16/11).')
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left text-slate-800 transition-all flex items-center justify-between group border border-slate-100"
                        >
                          <span className="truncate font-medium">Xem spec login SSO + Google</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                          onClick={() =>
                            showToast('Copilot: Kiểm tra branch-guard script PR #11 pass 100%.')
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left text-slate-800 transition-all flex items-center justify-between group border border-slate-100"
                        >
                          <span className="truncate font-medium">Kiểm tra branch-guard PR #11</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                          onClick={() =>
                            showToast('Copilot: Deadline mock FE: 25/11 — 3 màn đã hoàn tất.')
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left text-slate-800 transition-all flex items-center justify-between group border border-slate-100"
                        >
                          <span className="truncate font-medium">Báo cáo tiến độ mock FE</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-800 font-mono text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Độ tin cậy hạ tầng</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 block leading-tight">
                        Monorepo DDD: 100% CI branch-guard • Jira Linked
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Tab Content: Analytics */
                  <div className="p-3 flex flex-col gap-3 max-h-[560px] overflow-y-auto text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                        <span>Tiến độ mock FE (deadline 25/11)</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                          90%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[90%]"></div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 block leading-tight">
                        Hoàn thành 3 màn: Home spaces, Create Workspace, Dashboard Channel.
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Trạng thái dự án
                      </span>
                      <div className="bg-slate-50 p-2 rounded-lg text-slate-700 text-[11px] font-mono space-y-1 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Jira Link:</span>
                          <span className="font-semibold text-indigo-600">NEX-2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Team:</span>
                          <span className="font-semibold text-emerald-700">Huy, Đạt, Phúc</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">GitHub:</span>
                          <span className="font-semibold text-indigo-600">NguyenThanhDat3004/Nexus</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Đang xuất toàn văn báo cáo tiến độ...')}
                      className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-mono text-[11px] font-medium transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất báo cáo PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white py-3 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 font-mono text-[11px]">
          <span>NEXUS PROTOCOL v4.19.2 • {workspace.name.toUpperCase()}</span>
          <span>SECURED CRYPTOGRAPHIC LEDGER • ALL RIGHTS RESERVED © 2025</span>
        </div>
      </footer>

      {/* Floating Action Cluster */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Speed Dial Menu */}
        {isSpeedDialOpen && (
          <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Item 1: Nexus CLI */}
            <div
              onClick={() => {
                setIsSpeedDialOpen(false)
                showToast('Nexus CLI: Đang kết nối phiên tương tác $ nexus --status...')
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs shadow-md">
                Nexus CLI
              </span>
              <button className="w-10 h-10 rounded-full bg-white border border-slate-200 text-emerald-600 shadow-lg hover:bg-slate-50 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </button>
            </div>

            {/* Item 2: Thành viên with Popover */}
            <div className="flex items-center gap-2 cursor-pointer relative group">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs shadow-md flex items-center gap-1.5">
                <span>Thành viên</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                  4 Online
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMemberPopoverOpen(!isMemberPopoverOpen)
                }}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-lg hover:bg-slate-50 flex items-center justify-center"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Popover */}
              {isMemberPopoverOpen && (
                <div className="absolute right-12 bottom-0 w-52 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 flex flex-col gap-2 text-xs font-mono z-50">
                  <span className="font-semibold text-slate-900 pb-1 border-b border-slate-100">
                    Trực tuyến (4)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate font-semibold text-indigo-600">Huy (Bạn)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Đạt (Login SSO + PIN)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Phúc (Google + PIN)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate text-slate-500">Nexus System</span>
                  </div>
                </div>
              )}
            </div>

            {/* Item 3: Specs Document */}
            <div
              onClick={() => {
                setIsSpeedDialOpen(false)
                showToast('Tài liệu & Key Specs: Đang tải RFC-3161 v4.2 và PCI-DSS 4.0 Checklist...')
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs shadow-md">
                Tài liệu & Specs
              </span>
              <button className="w-10 h-10 rounded-full bg-white border border-slate-200 text-amber-700 shadow-lg hover:bg-slate-50 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* Item 4: AI Copilot */}
            <div
              onClick={() => {
                setIsSpeedDialOpen(false)
                toggleRightPanel('copilot')
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs shadow-md">
                AI Copilot
              </span>
              <button className="w-10 h-10 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-lg hover:bg-slate-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(!isSpeedDialOpen)
            setIsMemberPopoverOpen(false)
          }}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white transition-all cursor-pointer ${
            isSpeedDialOpen ? 'bg-red-600 hover:bg-red-700 rotate-45' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          title="Menu tác vụ nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
