interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <span className="progress-fraction">
          {value} / {max}（{percent}%）
        </span>
      </div>
      <div
        className="progress-track"
        data-reveal
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="progress-fill" style={{ '--progress-target': `${percent}%` } as React.CSSProperties} />
      </div>
    </div>
  );
}
