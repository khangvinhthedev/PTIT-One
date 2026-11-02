import type { ScheduleSlot } from '@/features/dang-ky'

/** Chỉ cần phần thời gian — buổi trong thời khoá biểu cũng thoả hình dạng này. */
export interface BusySlot {
  thu: number
  tietBatDau: number
  soTiet: number
  tuanBatDau: number
  tuanKetThuc: number
  tenMonHoc?: string
}

/** `T3 (1–3)`; Chủ nhật là `CN`. */
export function formatSlot(slot: BusySlot): string {
  return `${slot.thu === 8 ? 'CN' : `T${slot.thu}`} (${slot.tietBatDau}–${slot.tietBatDau + slot.soTiet - 1})`
}

export function formatLich(lich: readonly BusySlot[]): string {
  return lich.length === 0 ? 'Chưa xếp lịch' : lich.map(formatSlot).join(' · ')
}

/** `INT1339-2026-1-HCM01` → `HCM01`; mã đầy đủ để ở tooltip. */
export function nhomLop(maLopHP: string): string {
  return maLopHP.slice(maLopHP.lastIndexOf('-') + 1)
}

/**
 * Buổi đầu tiên của `lich` chồng giờ với một buổi đã có — cùng định nghĩa trùng
 * lịch mà backend dùng: trùng thứ, chồng tiết VÀ chồng tuần.
 */
export function firstOverlap(lich: readonly ScheduleSlot[], busy: readonly BusySlot[]): BusySlot | null {
  for (const slot of lich) {
    for (const other of busy) {
      const trungTiet =
        slot.thu === other.thu &&
        slot.tietBatDau <= other.tietBatDau + other.soTiet - 1 &&
        other.tietBatDau <= slot.tietBatDau + slot.soTiet - 1
      const trungTuan =
        slot.tuanBatDau <= other.tuanKetThuc && other.tuanBatDau <= slot.tuanKetThuc
      if (trungTiet && trungTuan) return other
    }
  }
  return null
}
