import type { ClassOffer, ScheduleSlot } from '@/features/dang-ky'

export type { ClassOffer }

/** Khớp `Campus` của `GET /api/campuses`. */
export interface Campus {
  maCoSo: string
  tenCoSo: string
  thanhPho: string
}

/** Khớp `CrossSiteRequest` của `GET /api/me/cross-campus?maHocKy=`. */
export interface CrossRequest {
  maYeuCau: string
  maSinhVien: string
  maLopHP: string
  maCoSoHost: string
  /** `DANG_XU_LY` · `DA_DANG_KY` · `TU_CHOI` · `DANG_HUY` · `DA_HUY` */
  trangThai: string
  /** Chỉ có nghĩa khi `TU_CHOI`. */
  lyDoTuChoi: string | null
  maHocKy: string
  maMonHoc: string
  tenMonHoc: string
  soTinChi: number
  hinhThucHoc: string
  phongHoc: string | null
  phienBanLich: number
  lichHoc: readonly ScheduleSlot[]
  thoiDiemDongBo: string | null
}
