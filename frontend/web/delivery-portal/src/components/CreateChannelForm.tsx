import React, { useState } from 'react'
import { Hash, Plus, X } from 'lucide-react'
import type { Channel, CreateChannelPayload } from '../lib/types'

interface CreateChannelFormProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (payload: CreateChannelPayload) => Promise<Channel>
}

export const CreateChannelForm: React.FC<CreateChannelFormProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Vui lòng nhập tên kênh')
      return
    }

    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')

    setIsSubmitting(true)
    setError('')

    try {
      await onCreate({
        name: cleanName,
        displayName: displayName.trim() || cleanName,
        type: 'custom',
        subtitle: subtitle.trim() || 'Kênh thảo luận kiến trúc',
      })
      setIsSubmitting(false)
      setName('')
      setDisplayName('')
      setSubtitle('')
      onClose()
    } catch (err: unknown) {
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo kênh')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Tạo Kênh Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg">{error}</div>}

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Tên định danh kênh *</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="font-mono text-slate-400 mr-1">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: security-review"
                className="bg-transparent font-mono text-slate-900 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Tiêu đề hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="vd: Security Review Hub"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Mô tả / Mục đích</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="vd: Kiểm duyệt bảo mật và compliance"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo kênh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
