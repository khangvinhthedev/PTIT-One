import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Icon, Select, Skeleton } from '@/shared/ui'

import { conLai, daDay } from '../lib/offer'
import { firstOverlap, formatSlot, nhomLop } from '../lib/schedule'
import type { BusySlot } from '../lib/schedule'
import type { ClassOffer } from '../types'
import styles from './ClassCatalogue.module.scss'

type SortKey = 'maMonHoc' | 'tenMonHoc' | 'conLai'

const SORTS: readonly { value: SortKey; label: string }[] = [
  { value: 'maMonHoc', label: 'Mã môn A→Z' },
  { value: 'tenMonHoc', label: 'Tên môn A→Z' },
  { value: 'conLai', label: 'Còn nhiều chỗ' },
]

export interface ClassCatalogueProps {
  hostCode: string
  hostName: string | null
  classes: readonly ClassOffer[]
  takenCourses: ReadonlySet<string>
  busySlots: readonly BusySlot[]
  loading: boolean
  error: string | null
  /** `maLopHP` đang chờ server trả lời. */
  pending: string | null
  onRequest: (maLopHP: string) => void
  onReload: () => void
}

/** Bước 2: lớp trực tuyến cơ sở đích mở cho sinh viên cơ sở khác. */
export function ClassCatalogue({
  hostCode,
  hostName,
  classes,
  takenCourses,
  busySlots,
  loading,
  error,
  pending,
  onRequest,
  onReload,
}: ClassCatalogueProps) {
  const [q, setQ] = useState('')
  const [onlyFree, setOnlyFree] = useState(false)
  const [sort, setSort] = useState<SortKey>('maMonHoc')
  const [code, setCode] = useState('')

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rows = classes.filter((lop) => {
      if (onlyFree && daDay(lop)) return false
      if (!needle) return true
      return [lop.maMonHoc, lop.tenMonHoc, lop.maLopHP, lop.tenGiangVien ?? ''].some((field) =>
        field.toLowerCase().includes(needle),
      )
    })
    return [...rows].sort((a, b) => {
      if (sort === 'conLai') return conLai(b) - conLai(a) || a.maMonHoc.localeCompare(b.maMonHoc)
      return a[sort].localeCompare(b[sort])
    })
  }, [classes, onlyFree, q, sort])

  function submitManual(e: FormEvent) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    onRequest(value)
    setCode('')
  }

  const title = hostName ?? (hostCode || 'cơ sở đích')

  return (
    <section className={styles.panel} aria-labelledby="lop-lien-co-so">
      <header className={styles.head}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>Bước 2</span>
          <h3 id="lop-lien-co-so">
            Lớp trực tuyến tại <span className={styles.accent}>{title}</span>
          </h3>
          <p className={styles.sub}>Tín chỉ được giữ ngay khi gửi yêu cầu, kể cả khi cơ sở chưa trả lời.</p>
        </div>

        <div className={styles.tools}>
          <label className={styles.search}>
            <Icon name="search" size="14px" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm môn, mã lớp, giảng viên"
              aria-label="Tìm lớp ở cơ sở đích"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={onlyFree}
            onClick={() => setOnlyFree((v) => !v)}
          >
            <Icon name="check" size="12px" />
            Còn chỗ
          </button>
          <Select
            value={sort}
            options={SORTS}
            onChange={setSort}
            ariaLabel="Sắp xếp danh sách lớp"
            className={styles.sort}
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.grid} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="178px" />
          ))}
        </div>
      ) : error ? (
        <div className={styles.state} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryLoad} onClick={onReload}>
            Tải lại
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.state}>
          <Icon name="book" size="22px" className={styles.stateIcon} />
          <p>
            {classes.length === 0
              ? `${title} chưa mở lớp trực tuyến nào cho sinh viên cơ sở khác.`
              : 'Không có lớp nào khớp bộ lọc.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((lop) => (
            <OfferCard
              key={lop.maLopHP}
              lop={lop}
              disabled={pending !== null}
              waiting={pending === lop.maLopHP}
              hasCourse={takenCourses.has(lop.maMonHoc)}
              clash={firstOverlap(lop.lich, busySlots)}
              onRequest={() => onRequest(lop.maLopHP)}
            />
          ))}
        </div>
      )}

      <details className={styles.manual}>
        <summary>Đã biết mã lớp? Gửi trực tiếp</summary>
        <form onSubmit={submitManual}>
          <label htmlFor="ma-lop-lien-co-so">Mã lớp học phần</label>
          <input
            id="ma-lop-lien-co-so"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="INT1306-2026-1-HN01"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className={styles.primary} disabled={!code.trim() || !hostCode || pending !== null}>
            {pending !== null ? 'Đang gửi…' : `Gửi tới ${hostCode || 'cơ sở'}`}
          </button>
        </form>
      </details>
    </section>
  )
}

function OfferCard(props: {
  lop: ClassOffer
  disabled: boolean
  waiting: boolean
  hasCourse: boolean
  clash: BusySlot | null
  onRequest: () => void
}) {
  const { lop, clash } = props
  const conLaiValue = conLai(lop)
  const full = conLaiValue <= 0
  const tone = full ? styles.blocked : conLaiValue <= 5 ? styles.tight : styles.free
  const pct = lop.soLuongToiDa > 0 ? Math.min(100, Math.round((lop.soLuongDaDangKy / lop.soLuongToiDa) * 100)) : 0

  const label = props.waiting
    ? 'Đang gửi…'
    : props.hasCourse
      ? 'Đã có môn này'
      : full
        ? 'Hết chỗ'
        : clash
          ? 'Trùng giờ'
          : 'Gửi yêu cầu'

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.code}>{lop.maMonHoc}</span>
        <span className={styles.credits}>{lop.soTinChi} TC</span>
      </div>

      <h4 className={styles.name}>{lop.tenMonHoc}</h4>

      <p className={styles.meta}>
        <Icon name="chalkboard" size="13px" />
        {lop.tenGiangVien ?? 'Chưa phân công'}
        <span className={styles.sep} />
        <span title={lop.maLopHP}>Lớp {nhomLop(lop.maLopHP)}</span>
      </p>

      <div className={styles.capacity}>
        <div className={styles.track} aria-hidden="true">
          <span className={`${styles.fill} ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`${styles.slotsLeft} ${tone}`}>
          {full ? 'Hết chỗ' : `Còn ${conLaiValue}/${lop.soLuongToiDa}`}
        </span>
      </div>

      <ul className={styles.slots}>
        {lop.lich.length === 0 ? (
          <li className={styles.noSlot}>Chưa xếp lịch</li>
        ) : (
          lop.lich.map((slot) => (
            <li key={`${slot.thu}-${slot.tietBatDau}-${slot.tuanBatDau}`}>
              <Icon name="calendar" size="12px" />
              {formatSlot(slot)}
            </li>
          ))
        )}
      </ul>

      {clash ? (
        <p className={styles.clash}>
          <Icon name="calendar" size="12px" />
          Trùng giờ với {clash.tenMonHoc ?? 'lớp đã giữ'} ({formatSlot(clash)})
        </p>
      ) : null}

      <button
        type="button"
        className={`${styles.cta} ${props.hasCourse || full || clash ? styles.ctaBlocked : ''}`}
        onClick={props.onRequest}
        disabled={props.disabled || props.hasCourse || full || clash !== null}
      >
        {props.waiting ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {label}
      </button>
    </article>
  )
}
