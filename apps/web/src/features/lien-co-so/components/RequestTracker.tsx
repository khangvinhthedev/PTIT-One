import { Icon } from '@/shared/ui'

import { formatLich, nhomLop } from '../lib/schedule'
import type { CrossRequest } from '../types'
import styles from './RequestTracker.module.scss'

type Tone = 'ok' | 'wait' | 'bad' | 'off'

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DA_DANG_KY: { label: 'Đã đăng ký', tone: 'ok' },
  DANG_XU_LY: { label: 'Chờ cơ sở xác nhận', tone: 'wait' },
  DANG_HUY: { label: 'Đang huỷ', tone: 'wait' },
  TU_CHOI: { label: 'Bị từ chối', tone: 'bad' },
  DA_HUY: { label: 'Đã huỷ', tone: 'off' },
}

type StepState = 'done' | 'active' | 'pending' | 'fail'

interface Step {
  label: string
  state: StepState
}

/** Ba bước của saga, suy từ trạng thái Home đang giữ. */
export function stepsOf(trangThai: string): Step[] {
  switch (trangThai) {
    case 'DANG_XU_LY':
      return [
        { label: 'Đã gửi', state: 'done' },
        { label: 'Cơ sở đang xét', state: 'active' },
        { label: 'Kết quả', state: 'pending' },
      ]
    case 'DANG_HUY':
      return [
        { label: 'Đã gửi', state: 'done' },
        { label: 'Đang huỷ', state: 'active' },
        { label: 'Tín chỉ trả lại', state: 'pending' },
      ]
    case 'DA_DANG_KY':
      return [
        { label: 'Đã gửi', state: 'done' },
        { label: 'Cơ sở đồng ý', state: 'done' },
        { label: 'Đã đăng ký', state: 'done' },
      ]
    case 'DA_HUY':
      return [
        { label: 'Đã gửi', state: 'done' },
        { label: 'Đã huỷ', state: 'done' },
        { label: 'Tín chỉ trả lại', state: 'done' },
      ]
    default:
      return [
        { label: 'Đã gửi', state: 'done' },
        { label: 'Cơ sở từ chối', state: 'fail' },
        { label: 'Không đăng ký', state: 'fail' },
      ]
  }
}

export interface RequestTrackerProps {
  requests: readonly CrossRequest[]
  pending: string | null
  onCancel: (yc: CrossRequest) => void
  onRetry: (yc: CrossRequest) => void
  onReload: () => void
}

/** Bước 3: theo dõi saga — yêu cầu nào đang giữ tín chỉ, yêu cầu nào đã có kết luận. */
export function RequestTracker({ requests, pending, onCancel, onRetry, onReload }: RequestTrackerProps) {
  return (
    <section className={styles.panel} aria-labelledby="yeu-cau-lien-co-so">
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Bước 3</span>
          <h3 id="yeu-cau-lien-co-so">
            Yêu cầu của tôi <span className={styles.count}>{requests.length}</span>
          </h3>
        </div>
        <button type="button" className={styles.refresh} onClick={onReload}>
          <Icon name="list" size="13px" />
          Tải lại
        </button>
      </header>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="check" size="20px" />
          <p>Chưa có yêu cầu liên cơ sở nào trong học kỳ này.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {requests.map((yc) => {
            const st = STATUS[yc.trangThai] ?? { label: yc.trangThai, tone: 'off' as Tone }
            const canCancel = yc.trangThai === 'DA_DANG_KY' || yc.trangThai === 'DANG_XU_LY'
            const canRetry = yc.trangThai === 'DANG_XU_LY' || yc.trangThai === 'DANG_HUY'
            const busy = pending !== null
            return (
              <li key={yc.maYeuCau} className={`${styles.row} ${styles[st.tone]}`}>
                <div className={styles.rowHead}>
                  <div className={styles.subject}>
                    <span className={styles.code}>{yc.maMonHoc}</span>
                    <h4>{yc.tenMonHoc}</h4>
                  </div>
                  <span className={`${styles.badge} ${styles[st.tone]}`}>{st.label}</span>
                </div>

                <p className={styles.meta}>
                  <span title={yc.maLopHP}>Lớp {nhomLop(yc.maLopHP)}</span>
                  <span className={styles.sep} />
                  <span>Cơ sở {yc.maCoSoHost}</span>
                  <span className={styles.sep} />
                  <span>{yc.soTinChi} TC</span>
                  {yc.lichHoc.length > 0 ? (
                    <>
                      <span className={styles.sep} />
                      <span>{formatLich(yc.lichHoc)}</span>
                    </>
                  ) : null}
                </p>

                <ol className={styles.steps}>
                  {stepsOf(yc.trangThai).map((step, i) => (
                    <li key={`${step.label}-${i}`} className={`${styles.step} ${styles[step.state]}`}>
                      <span className={styles.dot} aria-hidden="true" />
                      {step.label}
                    </li>
                  ))}
                </ol>

                {yc.lyDoTuChoi ? <p className={styles.reason}>{yc.lyDoTuChoi}</p> : null}

                {canCancel || canRetry ? (
                  <div className={styles.actions}>
                    {canRetry ? (
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => onRetry(yc)}
                        disabled={busy}
                      >
                        {pending === yc.maYeuCau ? 'Đang xử lý…' : 'Thử lại'}
                      </button>
                    ) : null}
                    {canCancel ? (
                      <button type="button" className={styles.danger} onClick={() => onCancel(yc)} disabled={busy}>
                        Huỷ yêu cầu
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
