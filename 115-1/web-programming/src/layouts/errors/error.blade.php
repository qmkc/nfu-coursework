@extends('main')

@section('content')
  <div class="week-hero">
    <div class="crumb"><a href="/">首頁</a> / {{ $statusCode }}</div>
    <h1>發生了 {{ $statusCode }} 錯誤</h1>
    <p class="theme">{{ $errorMessage }}</p>
  </div>
  <div class="week-nav justify-content-start">
    <a class="btn btn-home" href="/">返回首頁</a>
  </div>
@endsection
