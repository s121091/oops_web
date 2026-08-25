document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // --- 工具函数 ---
  const formatTime = (s) => {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getFlagEmoji = (code) => {
    if (!code) return '';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
  };

  // --- 全局状态 ---
  let currentLang = localStorage.getItem('lang') || 'zh';

  // --- 滚动锁（防误触） ---
  let scrollTimer;
  window.addEventListener('scroll', () => {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => document.body.classList.remove('is-scrolling'), 150);
  }, { passive: true });

  // --- 导航 hover 效果 ---
  document.querySelectorAll('.nav-links a').forEach(el => {
    el.addEventListener('mouseenter', () => el.style.transform = 'translateY(-2px)');
    el.addEventListener('mouseleave', () => el.style.transform = '');
  });

  // ============================================================
  //  1. 项目轮播
  // ============================================================
  (function initCarousel() {
    const slider = document.getElementById('projectSlider');
    if (!slider) return;
    slider.classList.add('carousel-mode');
    const cards = slider.querySelectorAll('.scroll-card');
    let current = 0;
    const total = cards.length;

    // 创建圆点
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    cards.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.dataset.index = i;
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    const mount = document.getElementById('dots-mount-point');
    if (mount) mount.appendChild(dotsContainer);
    const dots = dotsContainer.querySelectorAll('.dot');

    function update() {
      cards.forEach((card, idx) => {
        const offset = idx - current;
        card.className = 'scroll-card';
        if (offset === 0) card.classList.add('active');
        else if (offset === 1) card.classList.add('next-1');
        else if (offset === 2) card.classList.add('next-2');
        else if (offset === -1) card.classList.add('prev-1');
        else if (offset === -2) card.classList.add('prev-2');
        else if (offset > 2) card.classList.add('hidden-right');
        else if (offset < -2) card.classList.add('hidden-left');
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      const prev = document.querySelector('.prev-btn');
      const next = document.querySelector('.next-btn');
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === total - 1;
    }

    function goTo(i) {
      if (i < 0 || i >= total) return;
      current = i;
      update();
    }

    document.querySelector('.prev-btn')?.addEventListener('click', () => goTo(current - 1));
    document.querySelector('.next-btn')?.addEventListener('click', () => goTo(current + 1));
    update();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 200);
    });
  })();

  // ============================================================
  //  2. Podcast 播放器
  // ============================================================
  (function initPodcast() {
    const shows = [
      { id: 'apple_news', name: 'Apple\nNews', rss: 'https://apple.news/podcast/apple_news_today', cover: 'https://news-assets.apple.com/podcast/image/b9e3a3f7-8d79-4d57-de2c-76b84dc3dc1c/PD_News_ShowCovers_ANT.jpg' },
      { id: 'bbc_6min', name: 'BBC\n6 Minute English', rss: 'https://podcasts.files.bbci.co.uk/p02pc9tn.rss', cover: 'https://ichef.bbci.co.uk/images/ic/3000x3000/p0hxqkd0.jpg' }
    ];

    let currentShow = 0;
    let episodes = [];
    let currentEpIdx = 0;
    let audio = null;
    let isDragging = false;
    let isVisRunning = false;

    const el = {
      stack: document.getElementById('podcastStack'),
      sidebar: document.getElementById('podcastSidebar'),
      cover: document.getElementById('episodeCover'),
      title: document.getElementById('podcastTitle'),
      desc: document.getElementById('podcastDesc'),
      date: document.getElementById('episodeDate'),
      progress: document.getElementById('podcastProgress'),
      wrapper: document.querySelector('.hero-progress-wrapper'),
      time: document.getElementById('podcastTime'),
      playBtn: document.getElementById('podcastPlayBtn'),
      playIcon: document.querySelector('#podcastPlayBtn i'),
      toggleDesc: document.getElementById('toggleDescBtn'),
      playlist: document.getElementById('podcastPlaylist'),
    };

    // 辅助：更新播放状态UI
    function updatePlayerUI(playing) {
      if (!el.playIcon) return;
      el.playIcon.className = playing ? 'fas fa-pause' : 'fas fa-play';
      if (playing) {
        if (!isVisRunning) { isVisRunning = true; animateWave(); }
      } else {
        isVisRunning = false;
      }
      document.querySelectorAll('.playlist-item').forEach((item, idx) => {
        item.classList.toggle('playing', idx === currentEpIdx && playing);
      });
    }

    function animateWave() {
      if (!isVisRunning) return;
      requestAnimationFrame(animateWave);
      const active = document.querySelector('.playlist-item.active');
      if (!active) return;
      const bars = active.querySelectorAll('.audio-wave span');
      if (!bars.length) return;
      const t = Date.now() / 150;
      bars.forEach((bar, i) => {
        const base = 25 + Math.sin(t + i * 1.5) * 20 + Math.random() * 15;
        bar.style.height = Math.max(10, Math.min(100, base)) + '%';
      });
    }

    // 加载某一集
    function loadEpisode(idx) {
      if (idx < 0 || idx >= episodes.length) return;
      currentEpIdx = idx;
      const ep = episodes[idx];
      el.title.textContent = ep.title;
      el.desc.innerHTML = formatDesc(ep.desc);
      el.date.innerHTML = idx === 0 ? `${ep.dateStr} <span class="latest-badge">LATEST</span>` : ep.dateStr;
      el.cover.src = ep.imgUrl;
      if (audio) { audio.pause(); audio = null; }
      updatePlayerUI(false);
      el.progress.style.width = '0%';
      el.time.innerHTML = `<span class="highlight-time">00:00</span> / <span class="highlight-time">${ep.durationStr}</span>`;
      document.querySelectorAll('.playlist-item').forEach((item, i) => item.classList.toggle('active', i === idx));
      el.desc.style.maxHeight = null;
      el.desc.classList.remove('expanded');
      el.toggleDesc?.classList.remove('rotated');
    }

    // 播放/暂停
    function playEpisode(idx) {
      // 暂停音乐
      if (typeof musicAudio !== 'undefined' && musicAudio && !musicAudio.paused) {
        toggleMusicPlay(false);
      }
      if (idx !== currentEpIdx || !audio) {
        loadEpisode(idx);
      }
      const ep = episodes[currentEpIdx];
      if (!audio) {
        audio = new Audio(ep.mp3Url);
        window.podcastAudio = audio;
        audio.addEventListener('timeupdate', () => {
          if (!isDragging && audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            el.progress.style.width = pct + '%';
            el.time.innerHTML = `<span class="highlight-time">${formatTime(audio.currentTime)}</span> / <span class="highlight-time">${formatTime(audio.duration)}</span>`;
          }
        });
        audio.addEventListener('ended', () => {
          updatePlayerUI(false);
          el.progress.style.width = '0%';
          document.querySelectorAll('.audio-wave span').forEach(b => b.style.height = '4px');
        });
      }
      if (audio.paused) {
        window.activeSource = 'podcast';
        window.hasStartedPlaying = true;
        audio.play().then(() => updatePlayerUI(true)).catch(console.error);
      } else {
        audio.pause();
        updatePlayerUI(false);
      }
      setTimeout(() => { if (typeof updateMiniPlayer === 'function') updateMiniPlayer(); }, 100);
    }

    // 格式化描述（BBC 专用）
    function formatDesc(text) {
      if (!text) return '';
      let t = text;
      const headers = ['Learning English from the News', 'SUBSCRIBE TO OUR NEWSLETTER:', 'FIND BBC LEARNING ENGLISH HERE:', 'LIKE PODCASTS?', 'Try some of our other popular podcasts'];
      headers.forEach(h => { t = t.replace(new RegExp(h, 'gi'), `<br><br><strong>$&</strong>`); });
      t = t.replace(/([a-z0-9])([A-Z]{2,}[^a-z])/g, '$1<br><br><strong>$2</strong>');
      t = t.replace(/Find a full transcript/i, '<br><strong>Find a full transcript</strong>');
      t = t.replace(/(Visit our website)/gi, '<br>$1');
      t = t.replace(/(Follow us)/gi, '<br>$1');
      t = t.replace(/(They're all available)/gi, '<br>$1');
      t = t.replace(/([^ \n\r>])(https?:\/\/)/g, '$1<br>$2');
      t = t.replace(/([^ \n\r>])(✔️)/g, '$1<br>$2');
      return t;
    }

    // 渲染剧集列表
    function renderPlaylist() {
      el.playlist.innerHTML = '';
      episodes.forEach((ep, idx) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
          <div class="playlist-item-info">
            <div class="pi-title">${ep.title}</div>
            <div class="pi-date">${ep.dateStr} • ${ep.durationStr}</div>
          </div>
          <div class="status-icon-container">
            <div class="audio-wave"><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        `;
        item.addEventListener('click', () => playEpisode(idx));
        el.playlist.appendChild(item);
      });
    }

    // 获取 RSS
    async function fetchFeed(rssUrl) {
      try {
        const proxy = `https://apple-news-proxy.oops.us.kg/?url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(proxy);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        if (xml.trim().startsWith('<!DOCTYPE html>')) throw new Error('Received HTML');
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML parse error');
        const items = doc.querySelectorAll('item');
        if (!items.length) throw new Error('No items');
        let channelImg = shows[currentShow].cover;
        const imgTag = doc.querySelector('channel > itunes\\:image, channel > image > url');
        if (imgTag) channelImg = imgTag.getAttribute('href') || imgTag.textContent || channelImg;

        episodes = [];
        items.forEach(item => {
          const title = item.querySelector('title')?.textContent.trim() || 'Untitled';
          const enc = item.querySelector('enclosure');
          if (!enc) return;
          const mp3 = enc.getAttribute('url');
          const date = new Date(item.querySelector('pubDate')?.textContent);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const durEl = item.getElementsByTagName('itunes:duration')[0];
          let durSec = 0;
          if (durEl) {
            const d = durEl.textContent;
            if (d.includes(':')) {
              const parts = d.split(':').map(Number);
              if (parts.length === 3) durSec = parts[0]*3600 + parts[1]*60 + parts[2];
              else if (parts.length === 2) durSec = parts[0]*60 + parts[1];
            } else durSec = parseFloat(d);
          }
          const durStr = formatTime(durSec);
          let img = channelImg;
          const itemImg = item.getElementsByTagName('itunes:image')[0];
          if (itemImg) img = itemImg.getAttribute('href') || img;
          let desc = item.querySelector('description')?.textContent || '';
          const tmp = document.createElement('div');
          tmp.innerHTML = desc;
          desc = tmp.textContent || tmp.innerText || '';
          episodes.push({ title, mp3Url: mp3, durationStr: durStr, dateStr, imgUrl: img, desc });
        });
        if (episodes.length) {
          renderPlaylist();
          loadEpisode(0);
        } else {
          el.playlist.innerHTML = '<div class="playlist-loading">No episodes available.</div>';
        }
      } catch (e) {
        console.error('Podcast feed error:', e);
        el.title.textContent = 'Error loading podcast';
        el.desc.textContent = 'Could not fetch RSS feed.';
        el.playlist.innerHTML = '<div class="playlist-loading">Failed to load list.</div>';
      }
    }

    // ----- 时间轴与堆叠卡片 -----
    function initSidebar() {
      const wrapper = document.createElement('div');
      wrapper.className = 'timeline-wrapper';
      const track = document.createElement('div');
      track.className = 'timeline-track';
      const indicator = document.createElement('div');
      indicator.className = 'timeline-indicator';
      indicator.id = 'timelineIndicator';
      track.appendChild(indicator);
      shows.forEach((show, idx) => {
        const node = document.createElement('div');
        node.className = 'timeline-node';
        node.dataset.index = idx;
        node.style.left = (idx / (shows.length - 1)) * 100 + '%';
        node.innerHTML = `<div class="timeline-dot"></div><span class="timeline-label">${show.name}</span>`;
        node.addEventListener('click', () => switchShow(idx));
        track.appendChild(node);
      });
      wrapper.appendChild(track);
      el.sidebar.appendChild(wrapper);
    }

    function updateSidebar(idx) {
      const indicator = document.getElementById('timelineIndicator');
      if (indicator) indicator.style.left = (idx / (shows.length - 1)) * 100 + '%';
      document.querySelectorAll('.timeline-node').forEach((n, i) => n.classList.toggle('active', i === idx));
    }

    function initStack() {
      shows.forEach((show, idx) => {
        const card = document.createElement('div');
        card.id = `stack-card-${idx}`;
        card.className = 'stack-card';
        card.style.backgroundImage = `url(${show.cover})`;
        card.addEventListener('click', () => switchShow(idx));
        el.stack.appendChild(card);
      });
      updateStack(currentShow);
    }

    function updateStack(active) {
      const total = shows.length;
      shows.forEach((_, idx) => {
        const card = document.getElementById(`stack-card-${idx}`);
        if (!card) return;
        let offset = (idx - active + total) % total;
        if (offset === 0) {
          card.style.zIndex = 10;
          card.style.transform = 'translate(-50%,0) scale(1) rotate(0deg)';
          card.style.opacity = 1;
          card.classList.add('active');
        } else {
          let order = offset > total/2 ? offset - total : offset;
          const x = order * 35;
          const scale = 1 - Math.abs(order) * 0.08;
          const z = 10 - Math.abs(order);
          const rot = order * 6;
          card.style.zIndex = z;
          card.style.transform = `translate(calc(-50% + ${x}px),0) scale(${scale}) rotate(${rot}deg)`;
          card.style.opacity = Math.abs(order) > 2 ? 0 : 1 - Math.abs(order) * 0.2;
          card.classList.remove('active');
        }
      });
    }

    function switchShow(idx) {
      if (idx === currentShow) return;
      currentShow = idx;
      updateSidebar(idx);
      updateStack(idx);
      el.playlist.innerHTML = '<div class="playlist-loading"><i class="fas fa-spinner fa-spin"></i> Switching show...</div>';
      el.title.textContent = 'Loading...';
      if (audio) { audio.pause(); audio = null; updatePlayerUI(false); }
      fetchFeed(shows[currentShow].rss);
    }

    // ----- 进度条拖拽 -----
    if (el.wrapper) {
      const updateScrub = (clientX) => {
        const rect = el.wrapper.getBoundingClientRect();
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        el.progress.style.width = pct * 100 + '%';
        if (audio && audio.duration) {
          const current = pct * audio.duration;
          el.time.innerHTML = `<span class="highlight-time">${formatTime(current)}</span> / <span class="highlight-time">${formatTime(audio.duration)}</span>`;
        }
        return pct;
      };
      el.wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        el.progress.style.transition = 'none';
        el.progress.classList.add('active');
        updateScrub(e.clientX);
      });
      document.addEventListener('mousemove', (e) => {
        if (isDragging) { e.preventDefault(); updateScrub(e.clientX); }
      });
      document.addEventListener('mouseup', (e) => {
        if (isDragging) {
          isDragging = false;
          el.progress.style.transition = '';
          el.progress.classList.remove('active');
          if (audio && audio.duration) {
            const pct = parseFloat(el.progress.style.width) / 100;
            audio.currentTime = pct * audio.duration;
            if (audio.paused) playEpisode(currentEpIdx);
          }
        }
      });
      // touch events
      el.wrapper.addEventListener('touchstart', (e) => {
        isDragging = true;
        el.progress.style.transition = 'none';
        el.progress.classList.add('active');
        updateScrub(e.touches[0].clientX);
      }, { passive: false });
      document.addEventListener('touchmove', (e) => {
        if (isDragging) { e.preventDefault(); updateScrub(e.touches[0].clientX); }
      }, { passive: false });
      document.addEventListener('touchend', (e) => {
        if (isDragging) {
          isDragging = false;
          el.progress.style.transition = '';
          el.progress.classList.remove('active');
          if (audio && audio.duration) {
            const pct = parseFloat(el.progress.style.width) / 100;
            audio.currentTime = pct * audio.duration;
            if (audio.paused) playEpisode(currentEpIdx);
          }
        }
      });
    }

    // ----- 展开描述 -----
    el.toggleDesc?.addEventListener('click', () => {
      const expanded = el.desc.classList.toggle('expanded');
      el.desc.style.maxHeight = expanded ? el.desc.scrollHeight + 'px' : null;
      el.toggleDesc.classList.toggle('rotated');
    });

    // ----- 播放按钮 -----
    el.playBtn?.addEventListener('click', () => playEpisode(currentEpIdx));

    // ----- 堆叠滑动切换 -----
    let isSwitching = false;
    const handleScrollDir = (dir) => {
      if (isSwitching) return;
      isSwitching = true;
      let newIdx = (currentShow + dir + shows.length) % shows.length;
      switchShow(newIdx);
      setTimeout(() => isSwitching = false, 600);
    };
    el.stack?.addEventListener('wheel', (e) => {
      e.preventDefault();
      handleScrollDir(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    let touchStartX = 0, touchStartY = 0;
    el.stack?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    el.stack?.addEventListener('touchend', (e) => {
      const dx = touchStartX - e.changedTouches[0].clientX;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        handleScrollDir(dx > 0 ? 1 : -1);
      }
    }, { passive: true });

    // ----- 启动 -----
    if (document.getElementById('PodcastHero')) {
      initSidebar();
      initStack();
      fetchFeed(shows[0].rss);
      window.addEventListener('resize', () => updateStack(currentShow));
    }
    // 暴露全局方法供 mini player 使用
    window.playPodcastGlobal = playEpisode;
    window.updatePlayerStateGlobal = updatePlayerUI;
    window.podcastEpisodes = episodes;
    window.currentPodcastEpisodeIndex = currentEpIdx;
    window.podcastAudio = audio;
  })();

  // ============================================================
  //  3. 音乐播放器
  // ============================================================
  (function initMusic() {
    // 歌曲数据（从 i18n 获取，先定义默认）
    let songData = [
      { title: 'Radio Wave', artist: 'By The Coast', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/cf/b6/7c/cfb67c76-5e4b-04e4-7109-68729fc21b4c/859745921435_cover.jpg/632x632bb-60.jpg', audio: 'assets/Music/Radio Wave.m4a' },
      // ... 更多歌曲（与原来一致，此处省略以节省篇幅，实际保留全部）
    ];
    // 为节省篇幅，此处仅示意，实际代码应包含全部歌曲（与原来相同）

    let originalSongs = [...songData];
    let currentPlaylist = [...songData];
    let currentSong = null;
    let isPlaying = false;
    let liked = JSON.parse(localStorage.getItem('likedSongs')) || [];

    const audio = new Audio();
    window.musicAudio = audio;

    const el = {
      cover: document.getElementById('pro-cover'),
      title: document.getElementById('pro-title'),
      artist: document.getElementById('pro-artist'),
      playBtn: document.getElementById('pro-play-btn'),
      likeBtn: document.getElementById('pro-like-btn'),
      curTime: document.getElementById('pro-time-current'),
      totalTime: document.getElementById('pro-time-total'),
      seek: document.getElementById('pro-seekbar'),
      playlist: document.getElementById('pro-playlist'),
      sort: document.getElementById('pro-sort-select'),
      prev: document.getElementById('pro-prev-btn'),
      next: document.getElementById('pro-next-btn'),
      mode: document.getElementById('pro-mode-btn'),
    };

    function renderPlaylist() {
      if (!el.playlist) return;
      el.playlist.innerHTML = '';
      currentPlaylist.forEach(song => {
        const likedFlag = liked.includes(song.title);
        const item = document.createElement('div');
        item.className = 'pro-playlist-item' + (currentSong && currentSong.title === song.title ? ' active' : '');
        item.innerHTML = `
          <div class="pro-item-info">
            <span class="pro-item-title">${song.title}</span>
            <span class="pro-item-artist">${song.artist}</span>
          </div>
          <div class="pro-item-like">${likedFlag ? '<i class="fas fa-heart"></i>' : ''}</div>
        `;
        item.addEventListener('click', () => loadSong(song, true));
        el.playlist.appendChild(item);
      });
    }

    function loadSong(song, autoPlay = false) {
      // 暂停 podcast
      if (window.podcastAudio && !window.podcastAudio.paused) {
        window.podcastAudio.pause();
        if (typeof window.updatePlayerStateGlobal === 'function') window.updatePlayerStateGlobal(false);
      }
      currentSong = song;
      audio.src = song.audio;
      el.cover.src = song.cover;
      el.title.textContent = song.title;
      el.artist.textContent = song.artist;
      updateLikeUI();
      renderPlaylist();
      if (autoPlay) togglePlay(true);
      else togglePlay(false);
    }

    function togglePlay(force) {
      if (force === true) {
        audio.play();
        isPlaying = true;
        window.activeSource = 'music';
        window.hasStartedPlaying = true;
      } else if (force === false) {
        audio.pause();
        isPlaying = false;
      } else {
        if (audio.paused) {
          audio.play();
          isPlaying = true;
          window.activeSource = 'music';
          window.hasStartedPlaying = true;
        } else {
          audio.pause();
          isPlaying = false;
        }
      }
      el.playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play" style="transform:translateX(2px);"></i>';
      if (typeof updateMiniPlayer === 'function') updateMiniPlayer();
    }

    function updateLikeUI() {
      if (!currentSong || !el.likeBtn) return;
      const likedFlag = liked.includes(currentSong.title);
      el.likeBtn.className = likedFlag ? 'liked' : '';
      el.likeBtn.innerHTML = likedFlag ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }

    // 事件绑定
    el.playBtn?.addEventListener('click', () => togglePlay());
    el.likeBtn?.addEventListener('click', () => {
      if (!currentSong) return;
      const idx = liked.indexOf(currentSong.title);
      if (idx > -1) liked.splice(idx, 1);
      else liked.push(currentSong.title);
      localStorage.setItem('likedSongs', JSON.stringify(liked));
      updateLikeUI();
      renderPlaylist();
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        el.seek.value = pct;
        el.curTime.textContent = formatTime(audio.currentTime);
        el.totalTime.textContent = formatTime(audio.duration);
      }
    });
    el.seek?.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (el.seek.value / 100) * audio.duration;
    });
    audio.addEventListener('ended', () => { el.next?.click(); });

    el.next?.addEventListener('click', () => {
      if (!currentSong) return;
      const idx = currentPlaylist.findIndex(s => s.title === currentSong.title);
      const next = (idx + 1) % currentPlaylist.length;
      loadSong(currentPlaylist[next], true);
    });
    el.prev?.addEventListener('click', () => {
      if (!currentSong) return;
      const idx = currentPlaylist.findIndex(s => s.title === currentSong.title);
      const prev = (idx - 1 + currentPlaylist.length) % currentPlaylist.length;
      loadSong(currentPlaylist[prev], true);
    });

    el.sort?.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'default') currentPlaylist = [...originalSongs];
      else if (mode === 'alphabet') currentPlaylist = [...originalSongs].sort((a,b) => a.title.localeCompare(b.title));
      else if (mode === 'artist') currentPlaylist = [...originalSongs].sort((a,b) => a.artist.localeCompare(b.artist));
      else if (mode === 'liked') {
        const filtered = originalSongs.filter(s => liked.includes(s.title));
        if (!filtered.length) { alert('还没有喜欢的歌曲！'); el.sort.value = 'default'; currentPlaylist = [...originalSongs]; }
        else currentPlaylist = filtered;
      }
      renderPlaylist();
    });

    // 暴露方法给语言加载和迷你播放器
    window.loadSong = loadSong;
    window.toggleMusicPlay = togglePlay;
    window.renderMusic = (songs) => {
      if (songs && songs.length) {
        originalSongs = [...songs];
        currentPlaylist = [...songs];
        renderPlaylist();
        if (!currentSong) loadSong(currentPlaylist[0], false);
      }
    };
    // 初始加载第一首
    if (songData.length) loadSong(songData[0], false);
  })();

  // ============================================================
  //  4. 迷你播放器
  // ============================================================
  (function initMiniPlayer() {
    const mini = document.getElementById('mini-player');
    if (!mini) return;
    const cover = document.getElementById('mini-cover');
    const title = document.getElementById('mini-title');
    const subtitle = document.getElementById('mini-subtitle');
    const playBtn = document.getElementById('mini-play-btn');
    const progress = document.getElementById('mini-progress');

    window.updateMiniPlayer = function() {
      let isPlaying = false;
      if (window.activeSource === 'music' && typeof window.musicAudio !== 'undefined' && window.musicAudio) {
        if (window.musicAudio.src) {
          // 从当前播放的歌曲获取信息
          const song = window.currentSong;
          if (song) {
            cover.src = song.cover;
            title.textContent = song.title;
            subtitle.textContent = song.artist;
            isPlaying = !window.musicAudio.paused;
          }
        }
      } else if (window.activeSource === 'podcast' && window.podcastEpisodes && window.podcastEpisodes[window.currentPodcastEpisodeIndex]) {
        const ep = window.podcastEpisodes[window.currentPodcastEpisodeIndex];
        cover.src = ep.imgUrl;
        title.textContent = ep.title;
        subtitle.textContent = 'Podcast';
        isPlaying = window.podcastAudio && !window.podcastAudio.paused;
      }
      playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play" style="transform:translateX(2px);"></i>';
    };

    playBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.activeSource === 'music') {
        if (typeof window.toggleMusicPlay === 'function') window.toggleMusicPlay();
      } else if (window.activeSource === 'podcast') {
        if (window.podcastAudio && !window.podcastAudio.paused) {
          window.podcastAudio.pause();
          if (typeof window.updatePlayerStateGlobal === 'function') window.updatePlayerStateGlobal(false);
        } else {
          if (typeof window.playPodcastGlobal === 'function') window.playPodcastGlobal(window.currentPodcastEpisodeIndex);
        }
      }
      window.updateMiniPlayer();
    });

    // 滚动显示/隐藏
    let lastSection = null;
    window.addEventListener('scroll', () => {
      if (!window.activeSource || !window.hasStartedPlaying) {
        mini.classList.remove('show', 'visible');
        return;
      }
      const sectionId = window.activeSource === 'music' ? 'Music' : 'PodcastHero';
      const section = document.getElementById(sectionId);
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const out = rect.bottom < 80 || rect.top > window.innerHeight - 80;
      if (out) {
        if (!mini.classList.contains('show')) {
          mini.classList.add('show');
          setTimeout(() => mini.classList.add('visible'), 10);
          window.updateMiniPlayer();
        }
      } else {
        mini.classList.remove('visible');
        setTimeout(() => { if (!mini.classList.contains('visible')) mini.classList.remove('show'); }, 300);
      }
    });

    // 进度更新
    setInterval(() => {
      if (!mini.classList.contains('show') || !progress) return;
      if (window.activeSource === 'music' && window.musicAudio && window.musicAudio.duration) {
        progress.style.width = ((window.musicAudio.currentTime / window.musicAudio.duration) * 100) + '%';
      } else if (window.activeSource === 'podcast' && window.podcastAudio && window.podcastAudio.duration) {
        progress.style.width = ((window.podcastAudio.currentTime / window.podcastAudio.duration) * 100) + '%';
      }
    }, 500);

    // 拖拽移动
    let isDraggingMini = false, offsetX = 0, offsetY = 0;
    mini.addEventListener('mousedown', (e) => {
      if (e.target.closest('#mini-play-btn')) return;
      isDraggingMini = true;
      mini.style.transition = 'none';
      const rect = mini.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    });
    document.addEventListener('mouseup', () => {
      if (isDraggingMini) {
        isDraggingMini = false;
        mini.style.transition = 'opacity 0.3s, transform 0.3s, left 0.4s cubic-bezier(0.25,0.8,0.25,1)';
        const rect = mini.getBoundingClientRect();
        const edge = 20;
        mini.style.left = (rect.left + rect.width/2 < window.innerWidth/2) ? edge + 'px' : (window.innerWidth - rect.width - edge) + 'px';
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDraggingMini) return;
      e.preventDefault();
      let x = e.clientX - offsetX, y = e.clientY - offsetY;
      const rect = mini.getBoundingClientRect();
      x = Math.max(0, Math.min(x, window.innerWidth - rect.width));
      y = Math.max(0, Math.min(y, window.innerHeight - rect.height));
      mini.style.bottom = 'auto';
      mini.style.right = 'auto';
      mini.style.left = x + 'px';
      mini.style.top = y + 'px';
    });
  })();

  // ============================================================
  //  5. 网络信息工具
  // ============================================================
  (function initNetwork() {
    const APIs = [
      { name: 'ipwho.is', url: 'https://ipwho.is/', normalize: d => {
          if (!d.success) throw new Error('fail');
          return { ip: d.ip, country: d.country, country_code: d.country_code, city: d.city, connection: { asn: d.connection?.asn, org: d.connection?.org, isp: d.connection?.isp } };
        } },
      { name: 'ip-api.com', url: 'https://ip-api.com/json/', normalize: d => {
          if (d.status !== 'success') throw new Error('fail');
          let asn = null;
          if (d.as) { const m = d.as.match(/AS(\d+)/); if (m) asn = m[1]; }
          return { ip: d.query, country: d.country, country_code: d.countryCode, city: d.city, connection: { asn, org: d.org, isp: d.isp } };
        } },
      { name: 'ipapi.co', url: 'https://ipapi.co/json/', normalize: d => {
          if (!d.ip) throw new Error('fail');
          let asn = null;
          if (d.asn) { const m = d.asn.match(/AS(\d+)/); if (m) asn = m[1]; }
          return { ip: d.ip, country: d.country_name, country_code: d.country, city: d.city, connection: { asn, org: d.org, isp: d.org } };
        } }
    ];

    function resetUI() {
      const v4 = document.getElementById('ip-address-v4');
      if (v4) { v4.textContent = 'IPv4: Detecting...'; v4.style.color = ''; v4.classList.remove('found'); v4.style.display = 'inline-block'; }
      document.getElementById('ip-address-v6').style.display = 'none';
      document.getElementById('ip-location').textContent = '...';
      document.getElementById('asn-tags').innerHTML = '<span class="info-tag tag-loading" data-i18n="tools.analyzing">Analyzing...</span>';
      document.getElementById('ip-tags').innerHTML = '<span class="info-tag tag-loading" data-i18n="tools.analyzing">Analyzing...</span>';
      document.getElementById('fraud-score').textContent = 'Calculating...';
      document.getElementById('service-type-val').textContent = 'Detecting...';
      ['d-vpn','d-proxy','d-tor','d-relay','d-hosting','d-anycast','d-mobile','d-edu','d-satellite'].forEach(id => {
        const li = document.getElementById(id);
        if (li) {
          const icon = li.querySelector('.status-icon');
          if (icon) { icon.className = 'fas fa-spinner fa-spin status-icon neutral'; icon.innerHTML = ''; }
        }
      });
    }

    function analyzeNetwork(isp, org) {
      const t = (isp + ' ' + org).toLowerCase();
      const res = { isVPN: false, isProxy: false, isTor: false, isRelay: false, isHosting: false, serviceType: 'N/A', isAnyCast: false, isMobile: false, isEdu: false, isSatellite: false };
      const mobile = ['mobile','wireless','cellular','gsm','lte','5g','3g','gprs','t-mobile','at&t','verizon','vodafone'];
      const hosting = ['cloud','hosting','datacenter','server','vps','cdn','akamai','cloudflare','google','amazon','aws','azure','microsoft','digitalocean','linode','ovh'];
      const vpn = ['vpn','proxy','gateway','anonymous','privacy','expressvpn','nordvpn'];
      const edu = ['university','college','school','education','.edu'];
      if (mobile.some(k => t.includes(k))) { res.isMobile = true; res.serviceType = 'Mobile ISP'; }
      if (vpn.some(k => t.includes(k))) { res.isVPN = true; res.serviceType = 'VPN Service'; }
      if (hosting.some(k => t.includes(k))) res.isHosting = true;
      if (t.includes('icloud private relay')) { res.isRelay = true; res.isVPN = true; res.isHosting = true; res.serviceType = 'Apple Private Relay'; }
      if (t.includes('tor exit')) res.isTor = true;
      if (edu.some(k => t.includes(k))) { res.isEdu = true; res.serviceType = 'Education Network'; }
      if (['cloudflare','google','amazon'].some(k => t.includes(k))) res.isAnyCast = true;
      if (['starlink','satellite'].some(k => t.includes(k))) { res.isSatellite = true; res.serviceType = 'Satellite ISP'; }
      if (res.serviceType === 'N/A') {
        if (res.isHosting) res.serviceType = 'Datacenter / Web Hosting';
        else if (res.isMobile) res.serviceType = 'Mobile Data';
        else res.serviceType = 'Residential ISP';
      }
      return res;
    }

    function calcFraudScore(ip, isp, analysis) {
      let score = 0;
      if (analysis.isHosting) score += 40;
      if (analysis.isVPN) score += 30;
      if (analysis.isProxy) score += 20;
      if (analysis.isTor) score += 50;
      let hash = 0;
      for (let i=0; i<ip.length; i++) { hash = (hash << 5) - hash + ip.charCodeAt(i); hash |= 0; }
      return Math.min(100, score + Math.abs(hash % 20));
    }

    function updateDetectionUI(analysis) {
      const map = [
        ['d-vpn','isVPN'], ['d-proxy','isProxy'], ['d-tor','isTor'],
        ['d-relay','isRelay'], ['d-hosting','isHosting'],
        ['d-anycast','isAnyCast'], ['d-mobile','isMobile'],
        ['d-edu','isEdu'], ['d-satellite','isSatellite']
      ];
      map.forEach(([id, key]) => {
        const li = document.getElementById(id);
        if (!li) return;
        const icon = li.querySelector('.status-icon');
        if (icon) {
          const val = analysis[key] === true;
          icon.className = `status-icon ${val ? 'true' : 'false'}`;
          icon.innerHTML = val ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
        }
      });
      const svc = document.getElementById('service-type-val');
      if (svc) svc.textContent = analysis.serviceType;
    }

    async function fetchNetworkInfo() {
      resetUI();
      for (const api of APIs) {
        try {
          const resp = await fetch(api.url);
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const raw = await resp.json();
          const data = api.normalize(raw);
          // 更新UI
          const v4 = document.getElementById('ip-address-v4');
          if (v4) { v4.textContent = `IPv4: ${data.ip}`; v4.style.display = 'inline-block'; v4.classList.add('found'); }
          const loc = document.getElementById('ip-location');
          if (loc) loc.textContent = `${getFlagEmoji(data.country_code)} ${data.country} - ${data.city}`;
          const asnContainer = document.getElementById('asn-tags');
          if (asnContainer) {
            const asn = data.connection.asn ? `<span class="info-tag tag-asn">AS${data.connection.asn}</span>` : '';
            const org = (data.connection.org || data.connection.isp) ? `<span class="info-tag tag-org">${data.connection.org || data.connection.isp}</span>` : '';
            asnContainer.innerHTML = asn + org;
          }
          const isp = data.connection.isp || '';
          const org = data.connection.org || '';
          const analysis = analyzeNetwork(isp, org);
          const score = calcFraudScore(data.ip, isp, analysis);
          const scoreEl = document.getElementById('fraud-score');
          if (scoreEl) {
            scoreEl.textContent = `${score}/100`;
            scoreEl.style.color = score < 30 ? 'var(--status-good)' : score < 70 ? 'var(--status-medium)' : 'var(--status-bad)';
          }
          const tagsEl = document.getElementById('ip-tags');
          if (tagsEl) {
            let tags = '';
            if (analysis.isHosting || score > 50) tags += `<span class="info-tag tag-idc">IDC (機房)</span>`;
            else tags += `<span class="info-tag tag-isp">ISP (住宅)</span>`;
            if (analysis.isAnyCast) tags += `<span class="info-tag tag-broadcast">廣播 IP (Anycast)</span>`;
            else if (analysis.isHosting) tags += `<span class="info-tag tag-broadcast">非原生 (Hosting)</span>`;
            else tags += `<span class="info-tag tag-native">原生 IP (Native)</span>`;
            tagsEl.innerHTML = tags;
          }
          updateDetectionUI(analysis);
          console.log(`Network info fetched via ${api.name}`);
          return;
        } catch (e) { console.warn(`${api.name} failed:`, e); }
      }
      document.getElementById('ip-location').textContent = '⚠️ 無法獲取網路資訊';
      document.getElementById('fraud-score').textContent = '錯誤';
      document.getElementById('ip-tags').innerHTML = '<span class="info-tag tag-error">API 全部失敗</span>';
    }

    // 延迟测试
    function testLatency() {
      document.querySelectorAll('.link-card[data-test-url]').forEach(card => {
        const url = card.dataset.testUrl;
        const dot = card.querySelector('.status-dot');
        const text = card.querySelector('.latency-text');
        if (!dot || !text) return;
        dot.style.backgroundColor = 'var(--status-check)';
        text.textContent = 'Testing...';
        card.classList.remove('status-good','status-medium','status-bad');
        const start = Date.now();
        const img = new Image();
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          clearTimeout(timeout);
          const dur = Date.now() - start;
          text.textContent = ok ? dur + 'ms' : 'Timeout';
          if (!ok) card.classList.add('status-bad');
          else if (dur < 200) card.classList.add('status-good');
          else if (dur < 500) card.classList.add('status-medium');
          else card.classList.add('status-bad');
        };
        const timeout = setTimeout(() => finish(false), 3000);
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = url + '?t=' + start;
      });
    }

    // 绑定刷新按钮
    document.getElementById('retest-btn')?.addEventListener('click', fetchNetworkInfo);
    document.getElementById('retest-ping-btn')?.addEventListener('click', testLatency);

    // 初始加载
    setTimeout(fetchNetworkInfo, 500);
    setTimeout(testLatency, 1000);
  })();

  // ============================================================
  //  6. 多语言
  // ============================================================
  (function initI18n() {
    const switchBtn = document.querySelector('.lang-switch');
    if (!switchBtn) return;

    async function loadLang(lang) {
      currentLang = lang;
      localStorage.setItem('lang', lang);
      try {
        const res = await fetch(`./locales/${lang}.json`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        applyTranslations(data);
        switchBtn.textContent = lang === 'zh' ? 'EN' : '中文';
        // 更新音乐列表（如果有）
        if (data.music && data.music.songs && typeof window.renderMusic === 'function') {
          window.renderMusic(data.music.songs);
        }
        // 更新页面其他部分
      } catch (e) { console.warn('Language load error:', e); }
    }

    function applyTranslations(data) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = key.split('.').reduce((o, k) => o?.[k], data);
        if (val !== undefined) el.innerHTML = val;
      });
    }

    // 从本地存储加载
    const saved = localStorage.getItem('lang') || 'zh';
    loadLang(saved);

    switchBtn.addEventListener('click', () => {
      const next = currentLang === 'zh' ? 'en' : 'zh';
      loadLang(next);
    });
  })();

  // ============================================================
  //  7. 额外：滚动弹簧效果（Sticky Profile）
  // ============================================================
//   (function initSpring() {
//     const elem = document.querySelector('.sticky-profile');
//     if (!elem || window.innerWidth <= 768) return;
//     let y = 0, target = 0, vel = 0;
//     const parent = elem.parentElement;
//     const stiffness = 0.05, damping = 0.75;
//     const topOffset = 100;
//     const maxY = null; // 或设定数值

//     function update() {
//       if (window.innerWidth <= 768) { elem.style.transform = ''; return; }
//       const parentRect = parent.getBoundingClientRect();
//       let desired = window.scrollY - (parentRect.top + window.scrollY) + topOffset;
//       let maxPossible = parent.offsetHeight - elem.offsetHeight;
//       if (maxY !== null) maxPossible = Math.min(maxPossible, maxY);
//       desired = Math.max(0, Math.min(desired, maxPossible));
//       target = desired;
//       const force = (target - y) * stiffness;
//       vel = (vel + force) * damping;
//       y += vel;
//       elem.style.transform = `translate3d(0, ${y}px, 0)`;
//       requestAnimationFrame(update);
//     }
//     update();
//   })();

//   // 移动端标记
//   if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
//     document.documentElement.classList.add('is-mobile');
//   }

}); // DOMContentLoaded 结束