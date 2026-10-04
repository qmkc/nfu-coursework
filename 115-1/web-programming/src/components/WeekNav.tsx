import Link from 'next/link';

interface WeekNavProps {
  weekNo: number;
  weekCount: number;
  /** Matches week-nav.blade.php's default alignment; the source-detail page passes false to left-align. */
  justifyBetween?: boolean;
}

export function WeekNav({ weekNo, weekCount, justifyBetween = true }: WeekNavProps) {
  const prevWeek = weekNo - 1;
  const nextWeek = weekNo + 1;

  return (
    <div className={`week-nav${justifyBetween ? '' : ' justify-content-start'}`}>
      {prevWeek >= 1 ? (
        <Link className="btn" href={`/weekly/${String(prevWeek).padStart(2, '0')}/`}>
          ← 上一週
        </Link>
      ) : (
        <span className="btn disabled">← 上一週</span>
      )}
      <Link className="btn btn-home" href="/">
        返回首頁
      </Link>
      {nextWeek <= weekCount ? (
        <Link className="btn" href={`/weekly/${String(nextWeek).padStart(2, '0')}/`}>
          下一週 →
        </Link>
      ) : (
        <span className="btn disabled">下一週 →</span>
      )}
    </div>
  );
}
