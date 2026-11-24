import React, { useState } from 'react'
import {
  CornerDownRight,
  Filter,
  Hash,
  Info,
  Lock,
  MessageSquare,
  Plus,
  Settings2,
  Sliders,
  Tag,
  Ticket,
} from 'lucide-react'
import type { Channel, CreateChannelPayload } from '../lib/types'
import { CreateChannelForm } from './CreateChannelForm'

interface ChannelListProps {
  channels: Channel[]
  activeChannelId: string
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: (payload: CreateChannelPayload) => Promise<Channel>
  onToast: (msg: string) => void
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onToast,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-xs overflow-hidden flex flex-col border border-slate-200">
      {/* Header */}
      <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate">
              Kênh & Luồng
            </span>
            <span className="font-mono text-[11px] text-slate-500 truncate">
              {channels.length} Kênh • 2 Luồng
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onToast('Bộ lọc nhanh: Hiển thị các kênh có quyết định RFC')}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
            title="Lọc kênh"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToast('Mở cấu hình phân quyền và mã hóa kênh')}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
            title="Cài đặt kênh"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="p-2 space-y-1.5">
        {channels.map((chan) => {
          const isActive = chan.id === activeChannelId || chan.name === activeChannelId

          if (chan.type === 'general' || chan.name === 'general') {
            return (
              <div
                key={chan.id}
                onClick={() => onSelectChannel(chan)}
                className={`group p-2 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 border border-indigo-200 shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Ticket className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-slate-900 truncate">
                      general
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] shrink-0 font-medium">
                    {chan.ticketCount !== undefined ? `${chan.ticketCount} vé` : '14 vé'}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">Ticket Ledger Hub • Không có Thread</span>
                </div>
              </div>
            )
          }

          if (chan.type === 'project-memory' || chan.name === 'project-memory') {
            return (
              <div
                key={chan.id}
                onClick={() => onSelectChannel(chan)}
                className={`group p-2 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 border border-indigo-200 shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono text-xs font-medium text-slate-900 truncate">
                      memory
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] shrink-0 font-semibold">
                    Sync
                  </span>
                </div>
                <div className="mt-1 ml-3.5 pl-2 border-l-2 border-slate-200 space-y-0.5 pt-0.5">
                  <div className="flex items-center justify-between text-slate-600 hover:text-indigo-600 py-0.5 text-[11px] font-mono transition-colors">
                    <span className="truncate flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3 text-slate-400" /> RFC-3161
                    </span>
                    <span className="text-[10px] text-slate-400">Live</span>
                  </div>
                </div>
              </div>
            )
          }

          if (chan.type === 'personal-vault' || chan.name === 'personal-vault') {
            return (
              <div
                key={chan.id}
                onClick={() => onSelectChannel(chan)}
                className={`group p-2 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 border border-indigo-200 shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="font-mono text-xs font-medium text-slate-900 truncate">
                      personal
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] shrink-0 font-medium">
                    Bot
                  </span>
                </div>
              </div>
            )
          }

          // Custom channels
          return (
            <div
              key={chan.id}
              onClick={() => onSelectChannel(chan)}
              className={`group p-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-50/80 border border-indigo-200 shadow-xs'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-mono text-xs font-medium text-slate-900 truncate">
                    {chan.displayName || chan.name}
                  </span>
                </div>
                {chan.badge && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] shrink-0">
                    {chan.badge}
                  </span>
                )}
              </div>
              {chan.subtitle && (
                <div className="mt-1 text-[11px] font-mono text-slate-400 truncate">
                  {chan.subtitle}
                </div>
              )}
            </div>
          )
        })}

        {/* Add Channel Button */}
        <div className="pt-1">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full py-1 text-center font-mono text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm kênh mới
          </button>
        </div>
      </div>

      {/* Channel Configuration Box */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900">
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold">Cấu hình Kênh</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đã lưu
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Đồng bộ:</span>
            <span className="font-medium text-slate-900">RFC 3161 Merkle</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ký duyệt:</span>
            <span className="font-medium text-slate-900">Dual-Sign (Lead/VP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Timeout:</span>
            <span className="font-medium text-emerald-700">10s · Idempotency 24h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">CLI hook:</span>
            <span className="font-medium text-indigo-600">nexus sync --live</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToast('Cấu hình kênh nâng cao tại Insight dự án')}
          className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-indigo-600 font-mono text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Sliders className="w-3 h-3" />
          <span>Xem & Sửa cấu hình</span>
        </button>
      </div>

      <CreateChannelForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={onCreateChannel}
      />
    </div>
  )
}
