import React, { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Lock,
  Shield,
  Upload,
  UserPlus,
  X,
} from 'lucide-react'
import { defaultMembers } from '../data/mockData'
import type { Workspace, WorkspaceMember } from '../lib/types'
import { workspaceClient } from '../lib/workspaceClient'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (workspace: Workspace) => void
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManual, setIsSlugManual] = useState(false)
  const [description, setDescription] = useState(
    'Nền tảng cộng tác kỹ thuật, quản lý context kiến trúc và kết nối Jira/GitHub cho team Nexus.',
  )
  const [members, setMembers] = useState<WorkspaceMember[]>([...defaultMembers])
  const [newMemberName, setNewMemberName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successToast, setSuccessToast] = useState<string | null>(null)

  if (!isOpen) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isSlugManual) {
      setSlug(generateSlug(val))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManual(true)
    setSlug(generateSlug(e.target.value))
  }

  const handleAddMember = () => {
    const trimmed = newMemberName.trim()
    if (!trimmed) return
    const newM: WorkspaceMember = {
      id: `mem-${Date.now()}`,
      name: trimmed,
      email: `${generateSlug(trimmed)}@nexus.com`,
      role: 'member',
      roleLabel: 'Member',
      avatar: trimmed
        .split(' ')
        .map((p) => p[0])
        .slice(-2)
        .join('')
        .toUpperCase(),
      online: true,
    }
    setMembers([...members, newM])
    setNewMemberName('')
  }

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên Dự án')
      return
    }
    const finalSlug = slug.trim() || generateSlug(name)
    if (!finalSlug) {
      setErrorMsg('Vui lòng nhập hoặc tạo mã định danh Slug')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const created = await workspaceClient.createWorkspace({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        members: members.map((m) => ({
          name: m.name,
          role: m.role,
          roleLabel: m.roleLabel,
          email: m.email,
        })),
        defaultChannels: ['general', 'project-memory', 'personal-vault'],
      })

      setSuccessToast(`Đã khởi tạo thành công Dedicated Workspace Site: https://${finalSlug}.nexus.com`)

      setTimeout(() => {
        setIsSubmitting(false)
        onCreated(created)
        onClose()
      }, 700)
    } catch (err: unknown) {
      setIsSubmitting(false)
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo workspace')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#131b2e]/50 backdrop-blur-xs transition-all">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start justify-between bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                Khởi tạo Không gian Dự án Mới
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Tạo Dedicated Workspace Site & Cấu hình Kênh Ghi nhớ Tự động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-sm">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Field 1: Project Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>
                Tên Dự án (Project Name) <span className="text-red-500">*</span>
              </span>
              <span className="text-slate-400 font-normal">Tiêu đề định danh chính thức</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Nexus — Collaboration Platform"
              className="bg-slate-50 text-slate-900 px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
              required
            />
          </div>

          {/* Field 2: Slug preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>
                Mã định danh Site / Slug (Project Site URL) <span className="text-red-500">*</span>
              </span>
              <span className="text-indigo-600 font-mono text-[11px] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Tách biệt DNS & Quyền truy cập
              </span>
            </label>
            <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 shadow-xs">
              <Lock className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
              <span className="font-mono text-xs text-slate-400 select-none">https://</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="nexus-pay"
                className="bg-transparent font-mono text-xs text-indigo-700 font-bold focus:outline-none w-32 px-1 text-right"
                required
              />
              <span className="font-mono text-xs text-slate-400 select-none flex-1">.nexus.com</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>SSL Active
              </span>
            </div>
          </div>

          {/* Field 3: Scope & Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800">
              Mô tả dự án & Phạm vi nghiệp vụ (Project Scope)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mục tiêu triển khai, khách hàng bảo trợ và các cột mốc bàn giao kỹ thuật..."
              rows={2}
              className="bg-slate-50 text-slate-900 px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm resize-none transition-all"
            />
          </div>

          {/* Field 4: Lead & Core Members */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600" /> Quản trị viên dự án & Thành viên cốt lõi
              </label>
              <span className="text-xs text-slate-400">{members.length} thành viên đã chọn</span>
            </div>
            <div className="flex flex-col gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-wrap items-center gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs text-xs font-medium text-slate-800"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-[10px]">
                      {m.avatar}
                    </div>
                    <span>{m.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold">
                      {m.roleLabel}
                    </span>
                    {m.id !== 'mem-1' && m.id !== 'mem-2' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddMember()
                      }
                    }}
                    placeholder="Tìm kiếm tên kỹ sư để thêm..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-16 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="absolute right-1 px-2.5 py-1 rounded bg-indigo-600 text-white font-mono text-[11px] font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Thêm
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white border border-dashed border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-indigo-700 font-semibold truncate leading-tight">
                        Nhập từ file Excel (.xlsx, .csv)
                      </span>
                      <span className="text-[10px] text-slate-400 truncate leading-tight font-mono">
                        Kéo thả danh sách nhân sự
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Chức năng tải lên file Excel (.xlsx, .csv) mô phỏng đã sẵn sàng.')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <Upload className="w-3 h-3" /> Tải lên
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Field 5: Auto-provisioned Channels */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="text-indigo-600 font-mono font-bold">#</span> Kênh khởi tạo mặc định (Default Channels)
              </span>
              <span className="text-xs text-slate-400 font-mono">3 kênh tiêu chuẩn</span>
            </div>
            <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2 flex-1">
                  <p className="text-xs text-slate-700 leading-normal">
                    Hệ thống tự động thiết lập các channel mặc định cho không gian làm việc:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-xs font-mono text-xs text-slate-800 font-semibold">
                      <span className="text-indigo-600">#</span>general
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-xs font-mono text-xs text-indigo-700 font-semibold">
                      <span className="text-indigo-600">#</span>project-memory
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-xs font-mono text-xs text-slate-800 font-semibold">
                      <span className="text-indigo-600">#</span>personal-vault
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200 text-slate-500 text-xs">
                    <span>
                      Để cài đặt quyền hạn, vui lòng thiết lập tại <strong>Insight dự án</strong> sau khi khởi tạo.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Site Isolation block */}
          <div className="flex items-start gap-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
            <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-indigo-900">Dedicated Site Isolation:</strong> Dự án hoạt động như một site độc lập với đường dẫn riêng biệt, cơ sở dữ liệu mã hóa và quyền hạn cô lập.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Đang khởi tạo...' : 'Khởi tạo & Chuyển đến Site Dự án'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  )
}
