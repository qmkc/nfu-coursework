@extends('main')

@section('content')
  <div class="week-hero">
    <div class="crumb"><a href="/">首頁</a> / Week {{ sprintf('%02d', $weekNo) }}</div>
    <div class="big-num">WEEK {{ sprintf('%02d', $weekNo) }} / {{ $weekCount }}</div>
    <h1>第 {{ sprintf('%02d', $weekNo) }} 週學習成果</h1>
    <p class="theme"><strong>本週主題：</strong>{{ $weekTheme ?? '請填寫' }}</p>
  </div>

  <div class="section-card">
    <h3><span class="tick">＃01</span>學習目標</h3>
    @if($weekDetail['objectives'] ?? null)
      <ul class="mb-0">
        @foreach($weekDetail['objectives'] as $objective)
          <li>{{ $objective }}</li>
        @endforeach
      </ul>
    @else
      <p class="placeholder mb-0">請填寫本週的學習目標...</p>
    @endif
  </div>

  <div class="section-card">
    <h3><span class="tick">＃02</span>成果展示</h3>
    @if($weekDetail['showcase'] ?? null)
      <p class="{{ ($weekDetail['links'] ?? null) ? '' : 'mb-0' }}">{{ $weekDetail['showcase'] }}</p>
    @else
      <p class="placeholder mb-0">放置圖片、影片、Demo 連結。</p>
    @endif
    @if($weekDetail['links'] ?? null)
      <ul class="mb-0">
        @foreach($weekDetail['links'] as $link)
          <li><a href="{{ $link['url'] }}" target="_blank" rel="noopener">{{ $link['label'] }}</a></li>
        @endforeach
      </ul>
    @endif
  </div>

  <div class="section-card">
    <h3><span class="tick">＃03</span>程式碼</h3>
    @if($weekDetail['code']['snippet'] ?? null)
      @if($weekDetail['code']['filename'] ?? null)
        <p class="mb-0">{{ $weekDetail['code']['filename'] }}</p>
      @endif
      @if(str_starts_with($weekDetail['code']['snippet'], 'http'))
        <p class="mb-0"><a href="{{ $weekDetail['code']['snippet'] }}" target="_blank" rel="noopener">{{ $weekDetail['code']['snippet'] }}</a></p>
      @else
        <pre><code>{{ $weekDetail['code']['snippet'] }}</code></pre>
      @endif
    @else
      <pre><code>// 請貼上本週重點程式碼片段</code></pre>
    @endif
  </div>

  <div class="section-card">
    <h3><span class="tick">＃04</span>學習心得</h3>
    @if($weekDetail['reflection'] ?? null)
      <p class="mb-0">{{ $weekDetail['reflection'] }}</p>
    @else
      <p class="placeholder mb-0">請填寫本週的學習心得...</p>
    @endif
  </div>

  @include('partials.week-nav', ['weekNo' => $weekNo, 'weekCount' => $weekCount])
@endsection
