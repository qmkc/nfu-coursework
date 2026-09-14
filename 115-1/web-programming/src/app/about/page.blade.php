@extends('main')

@section('content')
  <div class="hero">
    <p class="kicker">About Me</p>
    <h1>{{ $about['name'] }}</h1>
    <p class="lead">{{ $about['tagline'] }}</p>
    <p class="lead mb-0">{{ $about['bio'] }}</p>
    <div class="meta-row">
      <span><span class="m-label">所在地</span>{{ $about['location'] }}</span>
      <span><span class="m-label">Email</span><a href="mailto:{{ $about['email'] }}">{{ $about['email'] }}</a></span>
      @foreach($about['links'] as $link)
        <span><a href="{{ $link['url'] }}" target="_blank" rel="noopener">{{ $link['label'] }} ↗</a></span>
      @endforeach
    </div>
  </div>

  <div id="skills" class="section-head">
    <span class="num">01</span>
    <h2>技能</h2>
  </div>
  @foreach($about['skills'] as $category => $items)
    <div class="skill-group">
      <div class="skill-cat">{{ $category }}</div>
      <div class="tag-list">
        @foreach($items as $item)
          <span class="skill-pill">{{ $item }}</span>
        @endforeach
      </div>
    </div>
  @endforeach

  <div id="repos" class="section-head">
    <span class="num">02</span>
    <h2>Pinned Repositories</h2>
    <span class="sub">github.com/{{ $site['github_user'] }}</span>
  </div>
  @foreach($about['projects'] as $index => $project)
    <div class="project-row">
      <div class="idx">{{ sprintf('%02d', $index + 1) }}</div>
      <div>
        <h4><a href="{{ $project['url'] }}" target="_blank" rel="noopener">{{ $project['name'] }}</a></h4>
        <p>{{ $project['description'] }}</p>
      </div>
    </div>
  @endforeach

  <div id="source" class="section-head">
    <span class="num">03</span>
    <h2>原始碼</h2>
  </div>
  <p class="intro-block">
    這個網站本身就是課程作業的一部分，想看某個頁面是怎麼寫出來的，可以到
    <a href="/source/">原始碼瀏覽頁</a>直接看程式碼。
  </p>
@endsection
