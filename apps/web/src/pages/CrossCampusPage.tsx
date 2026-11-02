import { useAuth } from '@/features/auth'
import { currentTerm } from '@/features/dang-ky'
import { CrossCampusBoard } from '@/features/lien-co-so'
import { useAsyncData } from '@/shared/lib'
import { Panel } from '@/shared/ui'

import { StudentShell } from './StudentShell'

/** Học liên cơ sở: chuyển sang cơ sở khác và đăng ký lớp trực tuyến ở đó. */
export function CrossCampusPage() {
  const { user } = useAuth()
  const { data: term, loading, error } = useAsyncData(currentTerm)

  return (
    <StudentShell>
      <Panel title="CHUYỂN CƠ SỞ · ĐĂNG KÝ TÍN CHỈ CƠ SỞ KHÁC" icon="book">
        {loading ? <p>Đang tải đợt đăng ký…</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {term ? <CrossCampusBoard maHocKy={term.maHocKy} homeCampus={user?.homeCampus ?? null} /> : null}
      </Panel>
    </StudentShell>
  )
}
