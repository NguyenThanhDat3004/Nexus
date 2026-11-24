import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BarChart2,
  Bot,
  CheckCircle2,
  GitBranch,
  Lock,
  Mic,
  Paperclip,
  Pin,
  Play,
  Radio,
  Send,
  Share2,
  Sparkles,
  Terminal,
  Undo2,
  Verified,
} from 'lucide-react'
import type { Channel, ChannelMessage, Workspace } from '../lib/types'

interface ChannelMessagesProps {
  workspace: Workspace
  channel: Channel
  messages: ChannelMessage[]
  onSendMessage: (content: string) => Promise<void>
  onToggleRightPanel: (tab?: 'copilot' | 'analytics') => void
  onToast: (msg: string) => void
}

export const ChannelMessages: React.FC<ChannelMessagesProps> = ({
  workspace,
  channel,
  messages,
  onSendMessage,
  onToggleRightPanel,
  onToast,
}) => {
  const [inputText, setInputText] = useState('')
  const [cliInput, setCliInput] = useState('')
  const [isCliMode, setIsCliMode] = useState(false)
  const streamEndRef = useRef<HTMLDivElement>(null)

  const isReadOnly = channel.isReadOnly || channel.name === 'general'

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (isReadOnly) {
      onToast('chỉ admin/PM mới được đăng thông báo')
      return
    }

    const text = inputText.trim()
    if (!text) return

    try {
      await onSendMessage(text)
      setInputText('')
      onToast('Đã gửi tin nhắn & ghi nhận vào bộ đệm phiên')
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Lỗi gửi tin nhắn')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExecuteCli = () => {
    const cmd = cliInput.trim()
    if (!cmd) return
    onToast(`Đang thực thi: $ nexus ${cmd} (Trạng thái: Hoàn tất OK)`)
    setCliInput('')
  }

  const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleExecuteCli()
    }
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-3 shadow-xs flex items-center justify-between gap-2 border border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            {channel.type === 'general' ? (
              <Radio className="w-4 h-4 text-white" />
            ) : channel.type === 'project-memory' ? (
              <Verified className="w-4 h-4 text-white" />
            ) : (
              <Lock className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900 truncate">
                #{channel.name} {channel.displayName ? `(${channel.displayName})` : ''}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold flex items-center gap-1 shrink-0">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>RFC-3161 Live</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 truncate">
              {channel.subtitle || `${workspace.name} • Merkle Validated`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleRightPanel('copilot')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-mono"
            title="Bật/Tắt Ngăn Copilot"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline text-indigo-600 font-medium">Copilot</span>
          </button>
          <button
            onClick={() => onToggleRightPanel('analytics')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-mono"
            title="Bật/Tắt Phân tích"
          >
            <BarChart2 className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline font-medium">Phân tích</span>
          </button>
          <button
            onClick={() => onToast('Đã ghim luồng trao đổi vào mục lưu trữ ưu tiên của dự án.')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Ghim luồng này"
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToast('Đang tạo báo cáo kiểm toán Cryptographic Ledger RFC-3161...')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Xuất báo cáo kiểm toán RFC"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="bg-white rounded-xl p-4 shadow-xs flex flex-col gap-4 max-h-[580px] min-h-[380px] overflow-y-auto border border-slate-200">
        <div className="flex items-center gap-3 my-1">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
            HÔM NAY • 14 THÁNG 2, 2025
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {messages.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 font-mono text-xs">
            <Radio className="w-8 h-8 text-slate-300" />
            <span>Chưa có tin nhắn nào trong kênh #{channel.name}</span>
          </div>
        ) : (
          messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {/* Message Bubble */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 shadow-xs ${
                    msg.isSelf
                      ? 'bg-indigo-600 text-white'
                      : msg.senderId === 'system-rfc'
                        ? 'bg-emerald-600 text-white'
                        : msg.senderId === 'system-bot'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-700 text-white'
                  }`}
                >
                  {msg.senderAvatar}
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900">{msg.senderName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {msg.senderRole}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                      msg.isSelf
                        ? 'bg-indigo-50/70 text-slate-900 border border-indigo-100'
                        : 'bg-slate-50 text-slate-900 border border-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              </div>

              {/* RFC Card if present */}
              {msg.rfcCard && (
                <div className="ml-0 sm:ml-11 bg-white rounded-xl p-4 shadow-xs relative overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent">
                  <div className="flex items-start justify-between gap-2 pb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Verified className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {msg.rfcCard.rfcId}: {msg.rfcCard.title}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 mt-0.5">
                          <span className="text-indigo-600 font-semibold">
                            JIRA: {msg.rfcCard.jiraIssue}
                          </span>
                          <span>•</span>
                          <span>PR: {msg.rfcCard.prNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold shrink-0">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{msg.rfcCard.status}</span>
                    </div>
                  </div>

                  <div className="py-2 text-slate-700 text-xs space-y-1.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    {msg.rfcCard.items.map((item, i) => (
                      <p key={i}>{item}</p>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {msg.rfcCard.signers.map((s, i) => (
                          <span
                            key={i}
                            className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white"
                          >
                            {s.avatar}
                          </span>
                        ))}
                      </div>
                      <span>
                        Đã ký số bởi:{' '}
                        <strong>{msg.rfcCard.signers.map((s) => s.name).join(' • ')}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{msg.rfcCard.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                        {msg.rfcCard.hash}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Version Lineage Card if present */}
              {msg.blockInfo && (
                <div className="ml-0 sm:ml-11 p-3 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">
                        Immutable Version Lineage: {msg.blockInfo.version}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Mọi thay đổi commit code đều neo vào Merkle Block {msg.blockInfo.merkleBlock}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onToast(`Block ${msg.blockInfo?.merkleBlock}: Hash ${msg.blockInfo?.hash} Hợp lệ tuyệt đối.`)
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-medium transition-colors shadow-xs"
                  >
                    Kiểm tra Block
                  </button>
                </div>
              )}
            </React.Fragment>
          ))
        )}
        <div ref={streamEndRef} />
      </div>

      {/* Message Composer Cluster */}
      <div className="bg-white rounded-xl p-3 shadow-xs flex flex-col gap-2 border border-slate-200">
        {/* Read-Only Warning Banner for #general */}
        {isReadOnly && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>#general</strong> là kênh thông báo chỉ đọc. Chỉ admin/PM mới được đăng thông báo vào kênh này.
            </span>
          </div>
        )}

        {!isCliMode ? (
          /* Mode 1: Regular Chat */
          <div className="flex flex-col gap-2.5">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isReadOnly}
                placeholder={
                  isReadOnly
                    ? '#general là kênh thông báo chỉ đọc (chỉ admin/PM mới được đăng tin)...'
                    : 'Nhập tin nhắn thảo luận, nhấn Enter để gửi...'
                }
                rows={2}
                className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm p-2.5 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all resize-none border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => onToast('Chọn tài liệu kiến trúc đính kèm (PDF, Markdown, JSON Specs)...')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                  title="Đính kèm tài liệu kiến trúc"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputText(
                      '/rfc [Tên quyết định kỹ thuật]: SLA < 10s, Khóa Idempotency 24h, Băm Merkle Tree SHA-256.',
                    )
                    onToast('Đã chèn mẫu chuẩn hóa RFC-3161')
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-emerald-700 font-mono text-[11px] font-semibold transition-colors border border-emerald-500/20"
                  title="Ký duyệt & Khóa quyết định RFC"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ký duyệt RFC</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!inputText.includes('@AI Bot')) {
                      setInputText((prev) => (prev ? `${prev} @AI Bot: ` : '@AI Bot: '))
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[11px] font-medium transition-colors"
                  title="Gọi trợ lý AI"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>@AI Bot</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleRightPanel('analytics')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-amber-800 font-mono text-[11px] font-medium transition-colors"
                  title="Mở bảng phân tích"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Phân tích</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToast('Đang kích hoạt micro ghi âm voice note (Bảo mật kênh)...')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                  title="Ghi chú âm thanh bảo mật"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCliMode(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-mono text-[11px] font-medium transition-all shadow-xs"
                  title="Mở giao diện Nexus CLI Terminal"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nexus CLI</span>
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                  {isReadOnly ? 'Chỉ đọc' : 'Enter để gửi'}
                </span>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isReadOnly}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Gửi</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Mode 2: Interactive CLI Mode */
          <div className="flex flex-col gap-2 p-3 bg-slate-950 rounded-xl text-slate-100 font-mono text-xs border border-slate-800 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                </div>
                <span className="text-emerald-400 font-bold ml-1">
                  NEXUS CRYPTOGRAPHIC TERMINAL v4.19
                </span>
                <span className="text-[10px] text-slate-500">node: sg-cluster-01</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCliMode(false)}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Quay lại Chat</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-slate-400">Gợi ý lệnh:</span>
              <button
                type="button"
                onClick={() => setCliInput('rfc sign --id=RFC-2025-084')}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 hover:bg-slate-700 transition-colors font-mono"
              >
                nexus rfc sign
              </button>
              <button
                type="button"
                onClick={() => setCliInput('sync --channel=all')}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 hover:bg-slate-700 transition-colors font-mono"
              >
                nexus sync --channel
              </button>
              <button
                type="button"
                onClick={() => setCliInput('compile-proof --root=4409')}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 hover:bg-slate-700 transition-colors font-mono"
              >
                nexus compile-proof
              </button>
              <button
                type="button"
                onClick={() => setCliInput('audit --pci-dss')}
                className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 hover:bg-slate-700 transition-colors font-mono"
              >
                nexus audit
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-emerald-400 font-bold shrink-0">$ nexus</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={handleCliKeyDown}
                placeholder="nhập cờ hoặc câu lệnh... gõ 'help' để xem danh sách"
                className="flex-1 bg-transparent border-0 text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
                autoFocus
              />
              <button
                type="button"
                onClick={handleExecuteCli}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs transition-all flex items-center gap-1 shrink-0"
              >
                <span>Chạy</span>
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
