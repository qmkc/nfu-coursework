@extends('main')

@section('content')
  <div class="week-hero">
    <div class="crumb"><a href="/">首頁</a> / 原始碼瀏覽</div>
    <h1>原始碼瀏覽</h1>
    <p class="theme">收錄本站幾個關鍵頁面與腳本的原始碼，點進去可以看實際的程式碼內容。</p>
  </div>

  <div class="week-list">
    @foreach($files as $slug => $file)
      <a class="week-row" href="/source/{{ $slug }}/">
        <span class="wn">{{ strtoupper($file['lang']) }}</span>
        <span class="wt">{{ $file['label'] }}</span>
        <span class="ws">{{ $file['path'] }}</span>
        <span class="arrow">→</span>
      </a>
    @endforeach
  </div>
@endsection
