import { useCallback, useEffect, useMemo, useState } from 'react'

import { myEnrollments } from '@/features/dang-ky'
import type { StudentEnrollments } from '@/features/dang-ky'
import { fetchTimetable } from '@/features/lich-hoc'
import type { TimetableEntry } from '@/features/lich-hoc'
import { ApiError } from '@/shared/api'

import * as api from '../api/crossCampusApi'
import type { BusySlot } from '../lib/schedule'
import type { Campus, ClassOffer, CrossRequest } from '../types'

export interface Notice {
  tone: 'success' | 'error'
  text: string
}

/** Còn chiếm chỗ trong hạn mức hoặc còn chờ cơ sở trả lời. */
export const ACTIVE_STATUSES = ['DANG_XU_LY', 'DA_DANG_KY', 'DANG_HUY'] as const
/** Tín chỉ vẫn đang bị GIỮ — `DA_DANG_KY` đã chuyển sang "đã dùng", không tính lại. */
const HOLDING_STATUSES = ['DANG_XU_LY', 'DANG_HUY'] as const

const NETWORK = 'Không kết nối được máy chủ. Vui lòng thử lại.'

const ACTIVE: readonly string[] = ACTIVE_STATUSES
const HOLDING: readonly string[] = HOLDING_STATUSES

const isActive = (r: CrossRequest) => ACTIVE.includes(r.trangThai)
const isHolding = (r: CrossRequest) => HOLDING.includes(r.trangThai)

/**
 * Trạng thái màn liên cơ sở.
 *
 * <p>Sau mỗi lần ghi, tải lại từ server — trạng thái do saga quyết, không tự suy ở
 * client. Hạn mức đọc từ `SinhVienHocKy`; cộng thêm tín chỉ của yêu cầu
 * `DANG_XU_LY`/`DANG_HUY` vì bộ đếm "đã dùng" chưa nhận phần đó.
 */
export function useCrossCampus(maHocKy: string, homeCampus: string | null) {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [host, setHost] = useState('')
  const [classes, setClasses] = useState<ClassOffer[]>([])
  const [requests, setRequests] = useState<CrossRequest[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollments | null>(null)
  const [timetable, setTimetable] = useState<readonly TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [classesError, setClassesError] = useState<string | null>(null)
  /** `maLopHP` hoặc `maYeuCau` đang chờ — khoá đúng nút đó. */
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(async () => {
    const [list, credits, term] = await Promise.all([
      api.myRequests(maHocKy),
      myEnrollments(maHocKy).catch(() => null),
      fetchTimetable(maHocKy).catch(() => null),
    ])
    setRequests(list)
    setEnrollments(credits)
    setTimetable(term?.buoiHoc ?? [])
  }, [maHocKy])

  useEffect(() => {
    let cancelled = false
    void Promise.all([api.listCampuses(), refresh()])
      .then(([list]) => {
        if (cancelled) return
        setCampuses(list)
        setHost((cur) => cur || list.find((c) => c.maCoSo !== homeCampus)?.maCoSo || '')
      })
      .catch(() => !cancelled && setNotice({ tone: 'error', text: NETWORK }))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [refresh, homeCampus])

  useEffect(() => {
    if (!host) {
      setClasses([])
      return
    }
    let cancelled = false
    setLoadingClasses(true)
    setClassesError(null)
    void api
      .listHostClasses(host, maHocKy)
      .then((list) => !cancelled && setClasses(list))
      .catch((cause) => {
        if (cancelled) return
        setClasses([])
        setClassesError(cause instanceof ApiError ? cause.message : NETWORK)
      })
      .finally(() => !cancelled && setLoadingClasses(false))
    return () => {
      cancelled = true
    }
  }, [host, maHocKy, tick])

  const targets = useMemo(() => campuses.filter((c) => c.maCoSo !== homeCampus), [campuses, homeCampus])
  const homeInfo = useMemo(
    () => campuses.find((c) => c.maCoSo === homeCampus) ?? null,
    [campuses, homeCampus],
  )

  const holding = useMemo(() => requests.filter(isHolding).reduce((sum, r) => sum + r.soTinChi, 0), [requests])
  /**
   * Tín chỉ đã chiếm = học phần Home đang giữ chỗ + yêu cầu liên cơ sở CHƯA có
   * dòng trong `dangKy`. Home ghi `DangKyMonHoc` cho cả yêu cầu `DANG_XU_LY`, nên
   * phép trừ theo `maLopHP` chỉ thêm phần thật sự còn thiếu — không đếm hai lần.
   */
  const used = useMemo(() => {
    const rows = enrollments?.dangKy ?? []
    const daDangKy = rows.length > 0 ? rows.reduce((sum, e) => sum + e.soTinChi, 0) : (enrollments?.soTinChiDaDangKy ?? 0)
    const known = new Set(rows.map((e) => e.maLopHP))
    const thieu = requests.filter((r) => isActive(r) && !known.has(r.maLopHP))
    return daDangKy + thieu.reduce((sum, r) => sum + r.soTinChi, 0)
  }, [enrollments, requests])
  const limit = enrollments?.tranTinChi ?? null
  const waiting = requests.filter(isHolding).length

  /** Môn đã có — gửi tiếp sẽ bị ràng buộc chống trùng môn chặn. */
  const takenCourses = useMemo(
    () =>
      new Set([
        ...(enrollments?.dangKy ?? []).map((e) => e.maMonHoc),
        ...requests.filter(isActive).map((r) => r.maMonHoc),
      ]),
    [enrollments, requests],
  )

  /** Giờ đã bận: thời khoá biểu cơ sở nhà + yêu cầu liên cơ sở còn hiệu lực. */
  const busySlots = useMemo<BusySlot[]>(
    () => [
      ...timetable,
      ...requests
        .filter(isActive)
        .flatMap((r) => r.lichHoc.map((slot) => ({ ...slot, tenMonHoc: r.tenMonHoc }))),
    ],
    [timetable, requests],
  )

  const run = useCallback(
    async (key: string, action: () => Promise<string>) => {
      setPending(key)
      setNotice(null)
      try {
        setNotice({ tone: 'success', text: await action() })
      } catch (cause) {
        setNotice({ tone: 'error', text: cause instanceof ApiError ? cause.message : NETWORK })
      } finally {
        await refresh().catch(() => undefined)
        setPending(null)
      }
    },
    [refresh],
  )

  const request = useCallback(
    (maLopHP: string) =>
      run(maLopHP, async () => {
        const yc = await api.requestClass(host, maLopHP)
        if (yc.trangThai === 'TU_CHOI') {
          throw new ApiError(409, {
            code: 'HOST_REJECTED',
            message: yc.lyDoTuChoi ?? 'Cơ sở mở lớp từ chối yêu cầu.',
          })
        }
        return yc.trangThai === 'DA_DANG_KY'
          ? `Đã đăng ký lớp ${yc.maLopHP} — ${yc.tenMonHoc}.`
          : `Đã ghi nhận yêu cầu ${yc.maLopHP}; cơ sở ${yc.maCoSoHost} chưa trả lời — bấm Thử lại ở bảng bên dưới.`
      }),
    [run, host],
  )

  const cancel = useCallback(
    (yc: CrossRequest) =>
      run(yc.maYeuCau, async () => {
        const out = await api.cancelRequest(yc.maYeuCau)
        return out.trangThai === 'DA_HUY'
          ? `Đã huỷ ${yc.tenMonHoc}; tín chỉ đã được trả lại.`
          : 'Đã ghi nhận yêu cầu huỷ; tín chỉ chỉ được trả khi cơ sở mở lớp xác nhận. Bấm Thử lại.'
      }),
    [run],
  )

  const retry = useCallback(
    (yc: CrossRequest) =>
      run(yc.maYeuCau, async () => {
        const out = await api.retryRequest(yc.maYeuCau)
        return `Yêu cầu ${out.maLopHP} đã xử lý xong: ${out.trangThai === 'DA_HUY' ? 'đã huỷ' : 'đã đăng ký'}.`
      }),
    [run],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await refresh()
      setTick((n) => n + 1)
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const dismiss = useCallback(() => setNotice(null), [])

  return {
    campuses,
    targets,
    homeInfo,
    host,
    setHost,
    classes,
    requests,
    loading,
    loadingClasses,
    classesError,
    pending,
    notice,
    dismiss,
    credits: { used, holding, limit },
    waiting,
    takenCourses,
    busySlots,
    request,
    cancel,
    retry,
    reload,
  }
}
