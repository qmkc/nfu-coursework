@extends('main')

@section('content')
  <div class="week-hero">
    <div class="crumb"><a href="/">首頁</a> / <a href="/source/">原始碼瀏覽</a> / {{ $file['label'] ?? $slug }}</div>
    <h1>{{ $file['label'] ?? '找不到檔案' }}</h1>
    @if($file !== null)
      <p class="theme">{{ $file['path'] }}</p>
    @endif
  </div>

  @if($file !== null && $code !== null)
    <div class="section-card">
      <pre><code>{{ $code }}</code></pre>
    </div>
  @else
    <div class="section-card">
      <p class="placeholder mb-0">找不到這個原始碼檔案，回<a href="/source/">原始碼瀏覽頁</a>看看其他檔案吧。</p>
    </div>
  @endif

  <div class="week-nav justify-content-start">
    <a class="btn" href="/source/">← 原始碼列表</a>
    <a class="btn btn-home" href="/">返回首頁</a>
  </div>
@endsection
