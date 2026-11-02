import { ApiError } from '@/shared/api'
import type { ScheduleSlot } from '@/features/dang-ky'

import type { Campus, ClassOffer, CrossRequest } from '../types'

/**
 * Đăng ký liên cơ sở GIẢ — sinh viên `B26DCCN001`, cơ sở nhà HCM. Mỗi lớp thử
 * một nhánh của saga:
 *
 * | Lớp (đuôi)  | Gửi yêu cầu sẽ ra                                   |
 * |-------------|-----------------------------------------------------|
 * | HN01, HN02  | `DA_DANG_KY`                                        |
 * | HN03        | `TU_CHOI` — hết chỗ                                 |
 * | DN01        | `DANG_XU_LY` — Host mất mạng; bấm Thử lại để xong   |
 * | HN04 (trực tiếp) | 403 — chỉ lớp trực tuyến                       |
 */

const LATENCY_MS = 350
const HOC_KY = '2026-2027-HK1'

const CAMPUSES: readonly Campus[] = [
  { maCoSo: 'HCM', tenCoSo: 'Cơ sở TP. Hồ Chí Minh', thanhPho: 'TP. Hồ Chí Minh' },
  { maCoSo: 'HN', tenCoSo: 'Cơ sở Hà Nội', thanhPho: 'Hà Nội' },
  { maCoSo: 'DN', tenCoSo: 'Cơ sở Đà Nẵng', thanhPho: 'Đà Nẵng' },
]

function offer(
  maCoSo: string,
  nhom: string,
  maMonHoc: string,
  tenMonHoc: string,
  soTinChi: number,
  tenGiangVien: string,
  daDangKy: number,
  toiDa: number,
  lich: readonly ScheduleSlot[],
  hinhThucHoc = 'TRUC_TUYEN',
): ClassOffer {
  return {
    maLopHP: `${maMonHoc}-2026-1-${maCoSo}${nhom}`,
    maMonHoc,
    tenMonHoc,
    soTinChi,
    maHocKy: HOC_KY,
    maCoSoHost: maCoSo,
    maGiangVien: null,
    tenGiangVien,
    soLuongToiDa: toiDa,
    soLuongDaDangKy: daDangKy,
    trangThai: 'MO',
    choPhepLienCoSo: hinhThucHoc === 'TRUC_TUYEN',
    hinhThucHoc,
    phienBanLich: 1,
    lich,
  }
}

/** Giờ trống của thời khoá biểu mẫu — lớp HN01 đăng ký được thật. */
const RANH: readonly ScheduleSlot[] = [
  { thu: 4, tietBatDau: 7, soTiet: 3, phongHoc: null, tuanBatDau: 1, tuanKetThuc: 15 },
  { thu: 7, tietBatDau: 5, soTiet: 3, phongHoc: null, tuanBatDau: 1, tuanKetThuc: 15 },
]

/** Giờ đã bận — dùng để màn hình hiện được nhánh "trùng giờ". */
const TRUNG: readonly ScheduleSlot[] = [
  { thu: 3, tietBatDau: 1, soTiet: 3, phongHoc: null, tuanBatDau: 1, tuanKetThuc: 15 },
  { thu: 6, tietBatDau: 7, soTiet: 3, phongHoc: null, tuanBatDau: 1, tuanKetThuc: 15 },
]

const CLASSES: readonly ClassOffer[] = [
  offer('HN', '01', 'INT1306', 'Cấu trúc dữ liệu và giải thuật', 3, 'Nguyễn Hữu Tâm', 18, 60, RANH),
  offer('HN', '02', 'INT1319', 'Hệ điều hành', 3, 'Trần Thị Lan', 41, 60, TRUNG),
  offer('HN', '03', 'INT1342', 'Mạng máy tính', 3, 'Lê Quang Huy', 60, 60, RANH),
  offer('HN', '04', 'MAR1322', 'Marketing căn bản', 2, 'Phạm Minh Châu', 10, 50, RANH, 'TRUC_TIEP'),
  offer('DN', '01', 'INT1332', 'Lập trình Web', 3, 'Võ Thanh Sơn', 22, 55, RANH),
]

let seq = 0
const requests: (CrossRequest & { offline: boolean })[] = []

const wait = () => new Promise<void>((done) => setTimeout(done, LATENCY_MS))
const strip = ({ offline, ...rest }: CrossRequest & { offline: boolean }): CrossRequest => {
  void offline
  return rest
}
const find = (maYeuCau: string) => {
  const found = requests.find((r) => r.maYeuCau === maYeuCau)
  if (!found) {
    throw new ApiError(404, {
      code: 'CROSS_CAMPUS_REQUEST_NOT_FOUND',
      message: `Không tìm thấy yêu cầu ${maYeuCau}.`,
    })
  }
  return found
}

export async function listCampuses(): Promise<Campus[]> {
  await wait()
  return [...CAMPUSES]
}

export async function listHostClasses(maCoSo: string, maHocKy: string): Promise<ClassOffer[]> {
  await wait()
  return CLASSES.filter(
    (c) =>
      c.maCoSoHost === maCoSo &&
      c.maHocKy === maHocKy &&
      c.choPhepLienCoSo &&
      c.hinhThucHoc === 'TRUC_TUYEN',
  )
}

export async function myRequests(maHocKy: string): Promise<CrossRequest[]> {
  await wait()
  return requests.filter((r) => r.maHocKy === maHocKy).map(strip)
}

export async function requestClass(maCoSoHost: string, maLopHP: string): Promise<CrossRequest> {
  await wait()
  const lop = CLASSES.find((c) => c.maLopHP === maLopHP && c.maCoSoHost === maCoSoHost)
  if (!lop) {
    throw new ApiError(404, {
      code: 'CLASS_NOT_FOUND',
      message: `Không tìm thấy lớp ${maLopHP} ở cơ sở ${maCoSoHost}.`,
    })
  }
  if (lop.hinhThucHoc !== 'TRUC_TUYEN') {
    throw new ApiError(403, {
      code: 'CROSS_CAMPUS_ONLINE_ONLY',
      message: 'Chỉ đăng ký được lớp trực tuyến ở cơ sở khác.',
    })
  }
  const duplicate = requests.some(
    (r) =>
      r.maMonHoc === lop.maMonHoc &&
      ['DANG_XU_LY', 'DA_DANG_KY', 'DANG_HUY'].includes(r.trangThai),
  )
  if (duplicate) {
    throw new ApiError(409, {
      code: 'ENROLLMENT_DUPLICATE_COURSE',
      message: `Bạn đã đăng ký môn ${lop.tenMonHoc}.`,
    })
  }

  const full = lop.soLuongDaDangKy >= lop.soLuongToiDa
  const offline = lop.maLopHP.endsWith('DN01')
  const row: CrossRequest & { offline: boolean } = {
    maYeuCau: `YC-${String(++seq).padStart(4, '0')}`,
    maSinhVien: 'B26DCCN001',
    maLopHP: lop.maLopHP,
    maCoSoHost,
    trangThai: offline ? 'DANG_XU_LY' : full ? 'TU_CHOI' : 'DA_DANG_KY',
    lyDoTuChoi: full && !offline ? `Lớp ${lop.maLopHP} đã hết chỗ.` : null,
    maHocKy: lop.maHocKy,
    maMonHoc: lop.maMonHoc,
    tenMonHoc: lop.tenMonHoc,
    soTinChi: lop.soTinChi,
    hinhThucHoc: lop.hinhThucHoc,
    phongHoc: null,
    phienBanLich: lop.phienBanLich,
    lichHoc: lop.lich,
    thoiDiemDongBo: new Date().toISOString(),
    offline,
  }
  requests.unshift(row)
  return strip(row)
}

export async function cancelRequest(maYeuCau: string): Promise<CrossRequest> {
  await wait()
  const row = find(maYeuCau)
  if (!['DANG_XU_LY', 'DA_DANG_KY'].includes(row.trangThai)) {
    throw new ApiError(409, {
      code: 'CROSS_CAMPUS_ALREADY_CLOSED',
      message: 'Yêu cầu đã có kết luận.',
    })
  }
  // Host chưa trả lời thì tín chỉ vẫn bị giữ: DANG_HUY, chưa phải DA_HUY.
  row.trangThai = row.offline ? 'DANG_HUY' : 'DA_HUY'
  return strip(row)
}

export async function retryRequest(maYeuCau: string): Promise<CrossRequest> {
  await wait()
  const row = find(maYeuCau)
  if (!['DANG_XU_LY', 'DANG_HUY'].includes(row.trangThai)) {
    throw new ApiError(409, {
      code: 'CROSS_CAMPUS_ALREADY_CLOSED',
      message: 'Yêu cầu đã có kết luận.',
    })
  }
  row.offline = false
  row.trangThai = row.trangThai === 'DANG_HUY' ? 'DA_HUY' : 'DA_DANG_KY'
  return strip(row)
}
