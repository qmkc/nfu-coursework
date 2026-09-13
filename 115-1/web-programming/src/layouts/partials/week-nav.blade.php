@php
  $prevWeek = $weekNo - 1;
  $nextWeek = $weekNo + 1;
@endphp
<div class="week-nav">
  @if($prevWeek >= 1)
    <a class="btn" href="/weekly/{{ sprintf('%02d', $prevWeek) }}/">← 上一週</a>
  @else
    <span class="btn disabled">← 上一週</span>
  @endif
  <a class="btn btn-home" href="/">返回首頁</a>
  @if($nextWeek <= $weekCount)
    <a class="btn" href="/weekly/{{ sprintf('%02d', $nextWeek) }}/">下一週 →</a>
  @else
    <span class="btn disabled">下一週 →</span>
  @endif
</div>
