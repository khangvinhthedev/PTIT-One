import { Icon } from '@/shared/ui'

import type { Campus } from '../types'
import styles from './CampusPicker.module.scss'

export interface CampusPickerProps {
  homeCampus: string | null
  homeInfo: Campus | null
  targets: readonly Campus[]
  host: string
  onPick: (maCoSo: string) => void
  credits: { used: number; holding: number; limit: number | null }
  waiting: number
  /** `null` khi chưa tải xong danh sách lớp. */
  available: number | null
}

/** Bước 1 của màn liên cơ sở: đang ở cơ sở nào, muốn học ở cơ sở nào, còn bao nhiêu hạn mức. */
export function CampusPicker({
  homeCampus,
  homeInfo,
  targets,
  host,
  onPick,
  credits,
  waiting,
  available,
}: CampusPickerProps) {
  const pct = credits.limit && credits.limit > 0 ? Math.min(100, Math.round((credits.used / credits.limit) * 100)) : 0

  return (
    <section className={styles.picker} aria-label="Chọn cơ sở muốn học">
      <div className={styles.rail}>
        <div className={styles.node}>
          <span className={styles.eyebrow}>
            <Icon name="user" size="12px" />
            Cơ sở nhà
          </span>
          <b className={styles.code}>{homeCampus ?? '—'}</b>
          <span className={styles.city}>{homeInfo?.thanhPho ?? 'Chưa xác định'}</span>
        </div>

        <div className={styles.link} aria-hidden="true">
          <span />
          <Icon name="chevronRight" size="16px" />
        </div>

        <div className={styles.targetBlock}>
          <span className={styles.eyebrow}>
            <Icon name="signIn" size="12px" />
            Muốn học tại
          </span>
          {targets.length === 0 ? (
            <p className={styles.empty}>Hệ thống chưa có cơ sở nào khác.</p>
          ) : (
            <div className={styles.chips} role="group" aria-label="Cơ sở đích">
              {targets.map((campus) => {
                const selected = campus.maCoSo === host
                return (
                  <button
                    key={campus.maCoSo}
                    type="button"
                    aria-pressed={selected}
                    className={styles.chip}
                    title={campus.tenCoSo}
                    onClick={() => onPick(campus.maCoSo)}
                  >
                    {selected ? <Icon name="check" size="14px" className={styles.tick} /> : null}
                    <b>{campus.maCoSo}</b>
                    <span>{campus.thanhPho}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Tín chỉ đã chiếm</dt>
          <dd>
            {credits.used}
            {credits.limit !== null ? <span>/{credits.limit}</span> : null}
          </dd>
          <div className={styles.track} aria-hidden="true">
            <span style={{ width: `${pct}%` }} className={pct >= 100 ? styles.full : undefined} />
          </div>
          <p className={styles.hint}>
            {credits.holding > 0
              ? `${credits.holding} TC đang chờ cơ sở xác nhận`
              : credits.limit === null
                ? 'Chưa có hạn mức của học kỳ'
                : 'Đã gồm học phần ở cơ sở nhà'}
          </p>
        </div>

        <div className={styles.stat}>
          <dt>Đang chờ xử lý</dt>
          <dd>{waiting}</dd>
          <p className={styles.hint}>Yêu cầu chưa có kết luận</p>
        </div>

        <div className={styles.stat}>
          <dt>Lớp có thể gửi</dt>
          <dd>{available ?? '—'}</dd>
          <p className={styles.hint}>Đã trừ môn trùng và trùng giờ</p>
        </div>
      </dl>
    </section>
  )
}
