import { apiFetch } from '@/shared/api'

import type { Campus, ClassOffer, CrossRequest } from '../types'

/** Đăng ký liên cơ sở qua API thật. Cùng chữ ký với `mockCrossCampusApi`. */

export function listCampuses(): Promise<Campus[]> {
  return apiFetch<Campus[]>('/api/campuses')
}

/**
 * Lớp trực tuyến của cơ sở đích mà sinh viên được phép gửi yêu cầu.
 * `maCoSo` chỉ chọn database để đọc — cơ sở nhà vẫn do JWT quyết.
 */
export function listHostClasses(maCoSo: string, maHocKy: string): Promise<ClassOffer[]> {
  const query = new URLSearchParams({ maCoSoHost: maCoSo, maHocKy })
  return apiFetch<ClassOffer[]>(`/api/me/cross-campus/classes?${query.toString()}`)
}

export function myRequests(maHocKy: string): Promise<CrossRequest[]> {
  return apiFetch<CrossRequest[]>(`/api/me/cross-campus?maHocKy=${encodeURIComponent(maHocKy)}`)
}

/** Cơ sở nhà do server lấy từ JWT; `maCoSoHost` chỉ nói đọc lớp ở database nào. */
export function requestClass(maCoSoHost: string, maLopHP: string): Promise<CrossRequest> {
  return apiFetch<CrossRequest>('/api/me/cross-campus', {
    method: 'POST',
    json: { maCoSoHost, maLopHP },
  })
}

export function cancelRequest(maYeuCau: string): Promise<CrossRequest> {
  return apiFetch<CrossRequest>(`/api/me/cross-campus/${encodeURIComponent(maYeuCau)}/cancel`, {
    method: 'POST',
    json: {},
  })
}

/** Chạy lại bước Host cho yêu cầu còn treo (`DANG_XU_LY` / `DANG_HUY`). */
export function retryRequest(maYeuCau: string): Promise<CrossRequest> {
  return apiFetch<CrossRequest>(`/api/me/cross-campus/${encodeURIComponent(maYeuCau)}/retry`, {
    method: 'POST',
    json: {},
  })
}
