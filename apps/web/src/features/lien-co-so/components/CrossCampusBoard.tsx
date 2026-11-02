import { useEffect, useMemo } from 'react'

import { Icon } from '@/shared/ui'

import { useCrossCampus } from '../hooks/useCrossCampus'
import { guiDuoc } from '../lib/offer'
import { CampusPicker } from './CampusPicker'
import { ClassCatalogue } from './ClassCatalogue'
import { RequestTracker } from './RequestTracker'
import styles from './CrossCampusBoard.module.scss'

const SUCCESS_MS = 6000

export interface CrossCampusBoardProps {
  maHocKy: string
  /** Cơ sở nhà — lấy từ phiên đăng nhập, chỉ để ẩn khỏi danh sách cơ sở đích. */
  homeCampus: string | null
}

/** Học liên cơ sở (F08 · Phần 2): chọn cơ sở · chọn lớp trực tuyến · theo dõi saga. */
export function CrossCampusBoard({ maHocKy, homeCampus }: CrossCampusBoardProps) {
  const c = useCrossCampus(maHocKy, homeCampus)

  useEffect(() => {
    if (c.notice?.tone !== 'success') return
    const timer = window.setTimeout(c.dismiss, SUCCESS_MS)
    return () => window.clearTimeout(timer)
  }, [c.notice, c.dismiss])

  const available = useMemo(
    () => c.classes.filter((lop) => guiDuoc(lop, c.takenCourses, c.busySlots)).length,
    [c.classes, c.takenCourses, c.busySlots],
  )
  const hostName = c.targets.find((x) => x.maCoSo === c.host)?.tenCoSo ?? null

  if (c.loading && c.campuses.length === 0) return <p className={styles.muted}>Đang tải cơ sở và yêu cầu…</p>

  return (
    <div className={styles.board}>
      <CampusPicker
        homeCampus={homeCampus}
        homeInfo={c.homeInfo}
        targets={c.targets}
        host={c.host}
        onPick={c.setHost}
        credits={c.credits}
        waiting={c.waiting}
        available={c.loadingClasses ? null : available}
      />

      <p className={styles.rule}>
        <Icon name="lock" size="14px" />
        <span>
          Chỉ lớp <b>trực tuyến</b> do cơ sở mở lớp bật <b>ChoPhepLienCoSo</b> mới đăng ký được. Tín chỉ
          bị giữ ngay khi gửi yêu cầu và chỉ trả lại khi cơ sở mở lớp xác nhận huỷ — cơ sở nhà không tự
          quyết thay.
        </span>
      </p>

      {c.notice ? (
        <div
          className={`${styles.notice} ${styles[c.notice.tone]}`}
          role={c.notice.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{c.notice.text}</span>
          <button type="button" onClick={c.dismiss} aria-label="Đóng thông báo">
            <Icon name="close" size="14px" />
          </button>
        </div>
      ) : null}

      <ClassCatalogue
        hostCode={c.host}
        hostName={hostName}
        classes={c.classes}
        takenCourses={c.takenCourses}
        busySlots={c.busySlots}
        loading={c.loadingClasses}
        error={c.classesError}
        pending={c.pending}
        onRequest={(maLopHP) => void c.request(maLopHP)}
        onReload={() => void c.reload()}
      />

      <RequestTracker
        requests={c.requests}
        pending={c.pending}
        onCancel={(yc) => void c.cancel(yc)}
        onRetry={(yc) => void c.retry(yc)}
        onReload={() => void c.reload()}
      />
    </div>
  )
}
