@extends('main')

@section('content')
  <div class="hero">
    <p class="kicker">Course Learning Portfolio · {{ $currentYear }}</p>
    <h1>{{ $site['title'] }}</h1>
    <p class="lead">
      {{ $weekCount }} 週學習歷程、專題作品與反思紀錄，持續更新中。
    </p>
    <div class="meta-row">
      <span><span class="m-label">學號</span>{{ $site['student_id'] }}</span>
      <span><span class="m-label">GitHub</span><a href="https://github.com/{{ $site['github_user'] }}" target="_blank"
          rel="noopener">github.com/{{ $site['github_user'] }}</a></span>
    </div>
  </div>

  <div class="intro-block">
    <strong>課程簡介　</strong>本網站記錄本學期 {{ $weekCount }}
    週課程學習成果、專題作品與學習反思，每週更新開發紀錄與心得，完整呈現學習歷程。
  </div>

  <div id="weekly" class="section-head">
    <span class="num">01</span>
    <h2>每週成果</h2>
    <span class="sub">week 01–{{ $weekCount }}</span>
  </div>
  <div class="week-list">
    @foreach($weeks as $week)
      <a class="week-row" href="/weekly/{{ sprintf('%02d', $week['no']) }}/"><span
          class="wn">{{ sprintf('%02d', $week['no']) }}</span><span class="wt">{{ $week['label'] }}</span><span
          class="ws{{ $week['summary'] === null ? ' ws-empty' : '' }}">{{ $week['summary'] ?? '尚未規劃主題' }}</span><span
          class="arrow">→</span></a>
    @endforeach
  </div>

  <div id="projects" class="section-head">
    <span class="num">02</span>
    <h2>專題作品</h2>
  </div>
  @foreach($projects as $project)
    <div class="project-row">
      <div class="idx">{{ $project['index'] }}</div>
      <div>
        <span class="tag">{{ $project['status'] }}</span>
        <h4>{{ $project['title'] }}</h4>
        <p>{{ $project['description'] }}</p>
      </div>
    </div>
  @endforeach

  <div id="reflection" class="section-head">
    <span class="num">03</span>
    <h2>學習反思</h2>
  </div>
  @foreach($reflections as $reflection)
    <div class="reflect-row">
      <div class="t">{{ $reflection['title'] }}</div>
      <div class="d">{{ $reflection['description'] }}</div>
    </div>
  @endforeach
@endsection
