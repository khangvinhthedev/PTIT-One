import type { ClassOffer } from '../types'

import { firstOverlap } from './schedule'
import type { BusySlot } from './schedule'

export function conLai(lop: ClassOffer): number {
  return lop.soLuongToiDa - lop.soLuongDaDangKy
}

export function daDay(lop: ClassOffer): boolean {
  return conLai(lop) <= 0
}

/**
 * Gửi được ngay không: còn chỗ, chưa có môn, không trùng giờ với lớp đang giữ.
 * Ba điều kiện này trùng với ba phép kiểm của Home — hiện trước để sinh viên
 * không gửi một yêu cầu chắc chắn bị từ chối.
 */
export function guiDuoc(lop: ClassOffer, taken: ReadonlySet<string>, busy: readonly BusySlot[]): boolean {
  return !daDay(lop) && !taken.has(lop.maMonHoc) && firstOverlap(lop.lich, busy) === null
}
