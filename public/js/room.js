// ─────────────────────────────────────────────────
// JukeSync — room.js  (v2)
// Changes:
//  1. Room rename (host only, click room name)
//  2. Add song → adds to list only, no auto-play
//  3. Light neutral theme support
// ─────────────────────────────────────────────────

const params   = new URLSearchParams(window.location.search);
const ROOM_ID  = params.get('id');
const NICKNAME = sessionStorage.getItem('nickname') || 'Guest';

let isHost      = false;
let roomState   = null;
let ytPlayer    = null;
let ytReady     = false;
let pendingPlay = null;
let addSongTargetPlaylistId = null; // null = standalone queue
let songEndedLock = false; // 중복 song-ended 방지
let moveSongData = null;
let dragSource   = null;
const collapsedPlaylists = new Set(); // tracks collapsed playlist ids

if (!ROOM_ID) window.location.href = '/';

// ── Socket ────────────────────────────────────────
const socket = io();

socket.on('connect', () => {
  if (!roomState) {
    socket.emit('join-room', { roomId: ROOM_ID, nickname: NICKNAME });
  } else {
    socket.emit('rejoin-room', { roomId: ROOM_ID, nickname: NICKNAME });
  }
});
socket.on('error', msg => toast(msg, 'error'));

socket.on('room-state', state => {
  initMiniPlayer();
  roomState = state;
  isHost    = state.isHost;

  document.getElementById('room-name').textContent = state.name;
  document.getElementById('room-code').textContent = state.code;
  document.getElementById('my-nickname').textContent = NICKNAME;
  document.title = `${state.name} — JukeSync`;

  if (isHost) {
    document.getElementById('host-badge').style.display = '';
    document.getElementById('player-bar').style.display = 'flex';
    const pbg2 = document.getElementById('player-bar-guest'); if (pbg2) pbg2.style.display = 'none';
    document.getElementById('room-name-hint').style.display = '';
    document.getElementById('room-name').title = '클릭하여 이름 변경';
    document.getElementById('delete-room-btn').style.display = '';
    document.getElementById('sidebar').style.display = '';
    document.getElementById('chat-section').style.display = '';
  } else {
    document.getElementById('player-bar').style.display = 'none';
    const pbg = document.getElementById('player-bar-guest'); if (pbg) pbg.style.display = 'flex';
    document.getElementById('room-name').style.cursor = 'default';
    document.getElementById('room-name').title = '';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('guest-main').style.display = '';
    document.querySelector('.room-layout').classList.add('guest-mode');
  }

  applyVolume(state.volume);
  const volSliderEl = document.getElementById('volume-slider');
  if (volSliderEl) volSliderEl.value = state.volume;
  updateShuffleBtn(state.shuffle);
  updateRepeatBtn(state.repeat);
  // 첫 로드 시 모든 플레이리스트를 접힌 상태로 초기화
  state.playlists.forEach(pl => collapsedPlaylists.add(pl.id));
  renderPlaylists(state.playlists);
  renderQueue(state.queue);
  if (state.currentSong) {
    updateNowPlaying(state.currentSong);
    if (state.isPlaying) playYT(state.currentSong.videoId, state.currentTime);
  }
  // isHost 확정 후 처리
  if (isHost) {
    // 호스트: ytReady 상태면 즉시 unMute (mute:1 초기화 상태 해제)
    if (ytReady) {
      ytPlayer.unMute();
      ytPlayer.setVolume(state.volume ?? 80);
    }
    // ytReady 전이면 onReady에서 처리됨
  } else {
    if (ytReady) showUnlockBanner();
    else pendingBanner = true; // ytReady 되면 onReady에서 표시
    // 게스트: chat-section이 숨겨지므로 테마 피커를 body로 이동 후 fixed 적용
    const tp = document.getElementById('theme-picker');
    if (tp && tp.parentElement && tp.parentElement !== document.body) {
      document.body.appendChild(tp);
      tp.style.position = 'fixed';
      tp.style.bottom   = '1.5rem';
      tp.style.right    = '1.5rem';
      tp.style.zIndex   = '3000';
    }
    // 게스트: 미니 플레이어를 body로 이동 후 fixed 배치
    const mp = document.getElementById('mini-player-wrap');
    if (mp && mp.parentElement !== document.body) {
      document.body.appendChild(mp);
    }
    updateMiniPlayerPosition();
    // 게스트 입장 공지 모달 (오늘 하루 보지 않기)
    const GUEST_NOTICE_KEY = 'jukesync-guest-notice-date';
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(GUEST_NOTICE_KEY) !== today) {
      const noticeModal = document.getElementById('guest-notice-modal');
      if (noticeModal) noticeModal.classList.remove('hidden');
    }
    const noticeClose = document.getElementById('guest-notice-close');
    if (noticeClose) {
      noticeClose.onclick = () => {
        if (document.getElementById('guest-notice-no-show')?.checked) {
          localStorage.setItem(GUEST_NOTICE_KEY, today);
        }
        document.getElementById('guest-notice-modal').classList.add('hidden');
      };
    }
    const noticeModal2 = document.getElementById('guest-notice-modal');
    if (noticeModal2) {
      noticeModal2.onclick = e => {
        if (e.target === noticeModal2) noticeModal2.classList.add('hidden');
      };
    }
  }
  log(`"${state.name}" 방에 입장했습니다. 코드: ${state.code}`, 'system');
});

socket.on('room-renamed', ({ name }) => {
  if (roomState) roomState.name = name;
  document.getElementById('room-name').textContent = name;
  document.title = `${name} — JukeSync`;
  log(`방 이름이 "${name}"(으)로 변경되었습니다.`, 'system');
});

// became-host: 서버에서 닉네임 기반으로 호스트를 결정하므로 이 이벤트는 사용하지 않음

socket.on('user-joined', ({ nickname }) => log(`${nickname}님이 입장했습니다.`, 'system'));
socket.on('user-left',   ({ nickname }) => log(`${nickname}님이 퇴장했습니다.`, 'system'));
socket.on('host-changed', () => { /* 호스트 변경 — 게스트 권한 유지 */ });

socket.on('play-song', ({ song }) => {
  updateNowPlaying(song);
  if (roomState) { roomState.currentSong = song; roomState.isPlaying = true; }
  songEndedLock = false; // 새 곡 시작 시 lock 해제
  playYT(song.videoId, 0);
  updatePlayBtn(true);
  const gIcon = document.getElementById('guest-playing-icon'); if (gIcon) gIcon.textContent = '▶';
  log(`▶ "${song.title}" 재생 중`, 'play');
  highlightCurrentSong(song.id);
  // Reset timeline
  if (timelineSlider) { timelineSlider.value = 0; updateTimelineFill(0); }
  document.getElementById('time-current').textContent = '0:00';
  document.getElementById('time-duration').textContent = '0:00';
});

socket.on('play', ({ videoId, time }) => {
  if (roomState) roomState.isPlaying = true;
  if (ytPlayer && ytReady) {
    if (videoId) ytPlayer.loadVideoById(videoId, time || 0);
    else { ytPlayer.seekTo(time || 0, true); ytPlayer.playVideo(); }
    if (isHost) {
      // loadVideoById 후 명시적으로 unMute — 호출 시마다 음소거 상태가 리셋될 수 있음
      ytPlayer.unMute();
      ytPlayer.setVolume(roomState?.volume ?? 80);
    } else {
      if (audioUnlocked) { ytPlayer.unMute(); ytPlayer.setVolume(calcGuestVolume()); }
      else { ytPlayer.mute(); showUnlockBanner(); }
    }
  }
  updatePlayBtn(true);
  const gIcon = document.getElementById('guest-playing-icon'); if (gIcon) gIcon.textContent = '▶';
});

socket.on('pause', ({ time }) => {
  if (roomState) roomState.isPlaying = false;
  // 페이드아웃 진행 중이었다면 타이머 정리
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
    const fb = document.getElementById('btn-fadeout');
    if (fb) { fb.style.opacity = ''; fb.style.pointerEvents = ''; }
  }
  if (ytPlayer && ytReady) { ytPlayer.pauseVideo(); if (time !== undefined) ytPlayer.seekTo(time, true); }
  updatePlayBtn(false);
  const gIcon2 = document.getElementById('guest-playing-icon'); if (gIcon2) gIcon2.textContent = '⏸';
});

socket.on('seek', ({ time }) => { if (ytPlayer && ytReady) ytPlayer.seekTo(time, true); });
socket.on('volume', ({ volume }) => {
  if (roomState) roomState.volume = volume; // 마스터 먼저 반영
  applyVolume(volume);
});

socket.on('stop', () => {
  if (ytPlayer && ytReady) ytPlayer.stopVideo();
  updatePlayBtn(false);
  updateNowPlaying(null);
  const gIcon2 = document.getElementById('guest-playing-icon'); if (gIcon2) gIcon2.textContent = '⏸';
  highlightCurrentSong(null);
  log('재생 종료', 'system');
});

socket.on('state-update', patch => {
  if (!roomState) return;
  Object.assign(roomState, patch);
  if (patch.shuffle !== undefined) updateShuffleBtn(patch.shuffle);
  if (patch.repeat  !== undefined) updateRepeatBtn(patch.repeat);
});

socket.on('playlists-update', playlists => {
  if (roomState) {
    // 새로 추가된 플레이리스트는 접힌 상태로 시작
    playlists.forEach(pl => {
      const isNew = !roomState.playlists.some(p => p.id === pl.id);
      if (isNew) collapsedPlaylists.add(pl.id);
    });
    roomState.playlists = playlists;
  }
  renderPlaylists(playlists);
});

socket.on('queue-update', queue => {
  if (roomState) roomState.queue = queue;
  renderQueue(queue);
});

// ── YouTube API ───────────────────────────────────
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-player', {
    height: '1', width: '1',
    playerVars: { autoplay: 0, controls: 0, mute: 1 },
    events: {
      onReady: () => {
        ytReady = true;
        // 호스트: 초기화 즉시 unMute — mute:1로 시작한 플레이어가 재생 시 소리 안 나는 현상 방지
        if (isHost) {
          ytPlayer.unMute();
          ytPlayer.setVolume(roomState?.volume ?? 80);
        }
        if (pendingPlay) { playYT(pendingPlay.videoId, pendingPlay.time); pendingPlay = null; }
        // 배너는 room-state 수신 후 isHost 확정 시점에 표시 (pendingBanner 방식)
        if (pendingBanner) { showUnlockBanner(); pendingBanner = false; }
      },
      onError: e => {
        let msg;
        if (e.data === 101 || e.data === 150) {
          msg = '⚠️ 이 영상은 외부 재생이 차단되어 있습니다. (업로더 설정)';
        } else if (e.data === 100) {
          msg = '⚠️ 영상을 찾을 수 없습니다. (삭제되었거나 비공개)';
        } else {
          msg = `⚠️ 재생 오류가 발생했습니다. (코드: ${e.data})`;
        }
        toast(msg, 'error', true); // true = 크게 표시
        log(msg, 'error');
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED && isHost) {
          // 반복 재생 시 loadVideoById 과정에서 ENDED가 중복 발생하는 것을 방지
          if (!songEndedLock) {
            songEndedLock = true;
            socket.emit('song-ended');
            setTimeout(() => { songEndedLock = false; }, 3000);
          }
        }
        if (e.data === YT.PlayerState.PLAYING) {
          updatePlayBtn(true);
          // 버그 1: 일시정지 상태인데 YouTube가 자동 재생을 재개한 경우 강제 정지
          if (isHost && roomState && !roomState.isPlaying) {
            ytPlayer.pauseVideo();
          }
        }
        if (e.data === YT.PlayerState.PAUSED)  updatePlayBtn(false);
      }
    }
  });
};

const ytScript = document.createElement('script');
ytScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(ytScript);

let audioUnlocked = false;
let pendingBanner  = false; // ytReady 전에 room-state가 먼저 도착한 경우를 위한 플래그

function playYT(videoId, time) {
  if (!ytReady) { pendingPlay = { videoId, time }; return; }
  ytPlayer.loadVideoById({ videoId, startSeconds: time || 0 });
  if (isHost) {
    ytPlayer.unMute();
    ytPlayer.setVolume(roomState?.volume ?? 80);
  } else {
    // Guests: keep muted until user clicks (browser autoplay policy)
    if (audioUnlocked) {
      ytPlayer.unMute();
      ytPlayer.setVolume(calcGuestVolume()); // 마스터 × 로컬 비율
    } else {
      ytPlayer.mute();
      showUnlockBanner();
    }
  }
}

function unlockAudio() {
  audioUnlocked = true;
  if (ytPlayer && ytReady) {
    ytPlayer.unMute();
    const vol = isHost ? (roomState?.volume ?? 80) : calcGuestVolume();
    ytPlayer.setVolume(vol);
    // 영상이 로드된 상태이고 호스트가 재생 중일 때만 재생 시도
    if (ytPlayer.getPlayerState() === YT.PlayerState.PAUSED && roomState?.isPlaying) {
      ytPlayer.playVideo();
    }
  }
  hideUnlockBanner();
}

function showUnlockBanner() {
  if (isHost || audioUnlocked) return; // 호스트에게는 절대 표시하지 않음
  let banner = document.getElementById('unlock-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'unlock-banner';
    banner.className = 'unlock-banner';
    banner.innerHTML = '<span>🔇 소리를 활성화하려면 클릭하세요</span>';
    banner.addEventListener('click', unlockAudio);
    document.body.appendChild(banner);
  }
  banner.style.display = 'flex';
}

function hideUnlockBanner() {
  const banner = document.getElementById('unlock-banner');
  if (banner) banner.style.display = 'none';
}

// 게스트 실제 볼륨 = 마스터(호스트) × 로컬 비율(게스트)
// 예) 마스터 60, 로컬 50% → 실제 30 (컴퓨터 볼륨 × 스피커 볼륨 개념)
function calcGuestVolume() {
  const masterVol   = roomState?.volume ?? 100;
  const guestSlider = document.getElementById('guest-volume-slider');
  const localVol    = guestSlider ? parseInt(guestSlider.value) : 100;
  return Math.round((masterVol / 100) * localVol);
}

function applyVolume(vol) {
  // 호스트 슬라이더 UI 업데이트
  const volLabel  = document.getElementById('vol-label');
  const volSlider = document.getElementById('volume-slider');
  if (volLabel)  volLabel.textContent = vol;
  if (volSlider) volSlider.value = vol;

  if (isHost) {
    if (ytPlayer && ytReady) ytPlayer.setVolume(vol);
  } else {
    // 게스트: 마스터가 바뀌어도 자신의 로컬 비율 유지
    if (ytPlayer && ytReady) ytPlayer.setVolume(calcGuestVolume());
  }
}

// ── Room name inline edit ─────────────────────────
const roomNameEl = document.getElementById('room-name');

function bindRoomNameClick(el) {
  el.addEventListener('click', function handler() {
    if (!isHost) return;
    const current = el.textContent;
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'room-name-input';
    input.value = current; input.maxLength = 30;
    el.replaceWith(input);
    input.focus(); input.select();
    function commit() {
      const newName = input.value.trim();
      const span = document.createElement('span');
      span.id = 'room-name'; span.className = 'room-name';
      span.title = '클릭하여 이름 변경';
      span.textContent = newName || current;
      input.replaceWith(span);
      bindRoomNameClick(span);
      if (newName && newName !== current) socket.emit('rename-room', { name: newName });
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = current; input.blur(); }
    });
  });
}

bindRoomNameClick(roomNameEl);

// ── Host Controls ─────────────────────────────────
document.getElementById('btn-playpause').onclick = () => {
  if (!isHost) return;
  const playing = ytPlayer && ytReady && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
  const t = ytPlayer && ytReady ? ytPlayer.getCurrentTime() : 0;
  if (playing) socket.emit('pause', { time: t });
  else socket.emit('play', { time: t });
};

document.getElementById('btn-next').onclick = () => isHost && socket.emit('next-song');
document.getElementById('btn-prev').onclick = () => {
  if (!isHost) return;
  const t = ytPlayer && ytReady ? ytPlayer.getCurrentTime() : 0;
  if (t > 5) socket.emit('seek', { time: 0 });
  else socket.emit('prev-song');
};

document.getElementById('btn-shuffle').onclick = () => isHost && socket.emit('toggle-shuffle');
document.getElementById('btn-repeat').onclick  = () => isHost && socket.emit('toggle-repeat');

// 페이드아웃 정지 (3초)
let fadeTimer = null;
document.getElementById('btn-fadeout').addEventListener('click', () => {
  if (!isHost || !ytPlayer || !ytReady) return;
  if (ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) return;
  if (fadeTimer) return; // 이미 페이드 중

  const DURATION = 3000; // 3초
  const INTERVAL = 50;   // 50ms 간격
  const steps = DURATION / INTERVAL;
  const startVol = ytPlayer.getVolume();
  let step = 0;

  const btn = document.getElementById('btn-fadeout');
  btn.style.opacity = '0.5';
  btn.style.pointerEvents = 'none';
  const volSlider = document.getElementById('volume-slider');
  if (volSlider) volSlider.disabled = true;

  fadeTimer = setInterval(() => {
    step++;
    const vol = Math.max(0, Math.round(startVol * (1 - step / steps)));
    ytPlayer.setVolume(vol);
    if (step >= steps) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      const t = ytPlayer.getCurrentTime();
      socket.emit('pause', { time: t });
      // 볼륨 원상복구
      setTimeout(() => {
        ytPlayer.setVolume(startVol);
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        const vs = document.getElementById('volume-slider');
        if (vs) vs.disabled = false;
      }, 100);
    }
  }, INTERVAL);
});

document.getElementById('volume-slider').oninput = e => {
  if (!isHost) return;
  socket.emit('volume', { volume: parseInt(e.target.value) });
  applyVolume(parseInt(e.target.value));
};

// Guest local volume (does NOT emit to server — local only)
// 실제 볼륨 = 마스터(호스트) × 로컬 비율(게스트) / 100
const guestVolSlider = document.getElementById('guest-volume-slider');
if (guestVolSlider) {
  guestVolSlider.oninput = e => {
    const label = document.getElementById('guest-vol-label');
    if (label) label.textContent = e.target.value;
    if (ytPlayer && ytReady) ytPlayer.setVolume(calcGuestVolume());
  };
}

// ── Timeline (seek bar) ───────────────────────────
let timelineIsSeeking = false;
const timelineSlider = document.getElementById('timeline-slider');

timelineSlider.addEventListener('mousedown', () => { timelineIsSeeking = true; });
timelineSlider.addEventListener('touchstart', () => { timelineIsSeeking = true; }, { passive: true });

timelineSlider.addEventListener('input', () => {
  const pct  = parseFloat(timelineSlider.value);
  const frac = pct / 100;
  const dur  = (ytPlayer && ytReady) ? (ytPlayer.getDuration() || 0) : 0;
  document.getElementById('time-current').textContent = formatTime(frac * dur);
  updateTimelineFill(pct);
});

timelineSlider.addEventListener('change', () => {
  if (!isHost) return;
  const frac = parseFloat(timelineSlider.value) / 100;
  const dur  = (ytPlayer && ytReady) ? (ytPlayer.getDuration() || 0) : 0;
  const seekTo = frac * dur;
  socket.emit('seek', { time: seekTo });
  timelineIsSeeking = false;
});

function updateTimelineFill(pct) {
  // CSS gradient to show played portion in accent color
  timelineSlider.style.background =
    `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
}

// Poll playback position every second
setInterval(() => {
  if (!isHost || !ytPlayer || !ytReady) return;
  const state = ytPlayer.getPlayerState();
  if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.PAUSED) return;
  const cur = ytPlayer.getCurrentTime() || 0;
  const dur = ytPlayer.getDuration() || 0;
  if (!timelineIsSeeking && dur > 0) {
    const pct = (cur / dur) * 100;
    timelineSlider.value = pct;
    updateTimelineFill(pct);
  }
  document.getElementById('time-current').textContent = formatTime(cur);
  document.getElementById('time-duration').textContent = formatTime(dur);
}, 1000);

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function updatePlayBtn(playing) {
  document.getElementById('btn-playpause').textContent = playing ? '⏸' : '▶';
}
function updateShuffleBtn(on) {
  const btn = document.getElementById('btn-shuffle');
  btn.classList.toggle('active', on);
  btn.title = on ? '셔플 켜짐 (클릭해서 끄기)' : '셔플 (클릭해서 켜기)';
}
function updateRepeatBtn(mode) {
  const btn = document.getElementById('btn-repeat');
  btn.classList.toggle('active', mode !== 'none');
  btn.textContent = mode === 'one' ? '↻¹' : '↻';
  btn.title = { none: '반복 없음', all: '전체 반복', one: '한 곡 반복' }[mode];
}

function updateNowPlaying(song) {
  const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setArt = (id, videoId) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = videoId ? `<img src="https://img.youtube.com/vi/${videoId}/default.jpg" alt="" />` : '♪';
  };
  setEl('now-playing-title', song ? song.title : '재생 중인 곡 없음');
  setEl('now-playing-sub',   song ? (song.channelTitle || '—') : '—');
  setArt('now-playing-art',  song?.videoId);

  // Update guest big card
  const bigTitle = document.getElementById('guest-big-title');
  const bigCh    = document.getElementById('guest-big-ch');
  const bigArt   = document.getElementById('guest-big-art');
  const anim     = document.getElementById('guest-anim');
  if (bigTitle) bigTitle.innerHTML = song
    ? `<a class="song-yt-link guest-title-link" href="https://www.youtube.com/watch?v=${song.videoId}" target="_blank" rel="noopener" title="YouTube에서 열기">${esc(song.title)}</a>`
    : '재생 중인 곡 없음';
  if (bigCh)    bigCh.textContent    = song ? (song.channelTitle || '—') : '—';
  if (bigArt)   bigArt.innerHTML     = song
    ? `<img src="https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg" alt="" />`
    : '♪';
  if (anim) anim.style.display = song ? '' : 'none';
}

function highlightCurrentSong(songId) {
  document.querySelectorAll('.song-item').forEach(el => {
    el.classList.toggle('playing-now', !!songId && el.dataset.id === songId);
  });
}

// ── Playlist UI ────────────────────────────────────
function renderPlaylists(playlists) {
  const el = document.getElementById('playlist-list');
  el.innerHTML = '';
  playlists.forEach((pl, plIdx) => {
    const section = document.createElement('div');
    section.className = 'playlist-section';
    section.dataset.id = pl.id;
    section.dataset.idx = plIdx;
    const isCollapsed = collapsedPlaylists.has(pl.id);
    section.innerHTML = `
      <div class="playlist-header">
        <div class="playlist-drag-handle" title="드래그해서 순서 변경">⠿</div>
        <button class="playlist-collapse-btn js-collapse${isCollapsed ? ' collapsed' : ''}" title="${isCollapsed ? '펼치기' : '접기'}">▼</button>
        <span class="playlist-name">${esc(pl.name)}</span>
        <button class="btn btn--icon playlist-rename-btn js-rename-pl" title="이름 변경">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <div class="playlist-actions">
          <button class="btn btn--icon js-add-song" title="곡 추가">＋</button>
          ${isHost ? '<button class="btn btn--icon btn--play-pl js-play-pl" title="첫 곡 재생">▶</button>' : ''}
          <button class="btn btn--icon js-export-pl" title="플레이리스트 공유 코드 생성">⤴</button>
          <button class="btn btn--icon btn--del js-del-pl" title="삭제">✕</button>
        </div>
      </div>
      <div class="song-list" id="songs-${pl.id}" style="${isCollapsed ? 'display:none' : ''}"></div>
    `;
    // Attach event listeners
    section.querySelector('.js-add-song').addEventListener('click', () => openAddSong(pl.id));
    if (isHost) section.querySelector('.js-play-pl').addEventListener('click', () => playPlaylist(pl.id));
    section.querySelector('.js-del-pl').addEventListener('click', () => deletePlaylist(pl.id));
    section.querySelector('.js-export-pl').addEventListener('click', () => exportPlaylist(pl));
    section.querySelector('.js-rename-pl').addEventListener('click', (e) => {
      e.stopPropagation();
      const nameEl = section.querySelector('.playlist-name');
      const current = pl.name;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = current;
      input.className = 'playlist-rename-input';
      nameEl.replaceWith(input);
      input.focus(); input.select();
      section.querySelector('.playlist-rename-btn').style.opacity = '0';
      function commit() {
        const val = input.value.trim();
        const newName = document.createElement('span');
        newName.className = 'playlist-name';
        newName.textContent = val || current;
        input.replaceWith(newName);
        section.querySelector('.playlist-rename-btn').style.opacity = '';
        if (val && val !== current) {
          socket.emit('rename-playlist', { playlistId: pl.id, name: val });
        }
      }
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { input.value = current; input.blur(); }
      });
    });
    section.querySelector('.js-collapse').addEventListener('click', () => {
      const songList = document.getElementById('songs-' + pl.id);
      const btn = section.querySelector('.js-collapse');
      if (collapsedPlaylists.has(pl.id)) {
        collapsedPlaylists.delete(pl.id);
        songList.style.display = '';
        btn.classList.remove('collapsed');
        btn.title = '접기';
      } else {
        collapsedPlaylists.add(pl.id);
        songList.style.display = 'none';
        btn.classList.add('collapsed');
        btn.title = '펼치기';
      }
    });

    el.appendChild(section);
    renderSongs(pl.songs, pl.id, `songs-${pl.id}`);
    setupPlaylistDrag(section, plIdx);
  });

  const cur = roomState?.currentSong?.id;
  if (cur) highlightCurrentSong(cur);
}

function renderSongs(songs, playlistId, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (songs.length === 0) {
    el.innerHTML = '<p class="empty-hint" style="padding:0.4rem 0.8rem;font-size:0.77rem;">곡이 없습니다.</p>';
    return;
  }
  songs.forEach((song, idx) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.dataset.id  = song.id;
    item.dataset.idx = idx;
    item.draggable   = true;

    item.innerHTML = `
      <div class="song-drag-handle">⠿</div>
      <img class="song-thumb" src="https://img.youtube.com/vi/${song.videoId}/default.jpg" alt="" loading="lazy" />
      <div class="song-info">
        <p class="song-title"><a class="song-yt-link" href="https://www.youtube.com/watch?v=${song.videoId}" target="_blank" rel="noopener" title="YouTube에서 열기">${esc(song.title)}</a></p>
        <p class="song-ch">${esc(song.channelTitle || '')}</p>
        ${song.memo ? `<p class="song-memo">${esc(song.memo)}</p>` : ''}
      </div>
      <div class="song-actions">
        ${isHost ? `<button class="btn btn--icon btn--play-song js-play-song" title="재생">▶</button>` : ''}
        ${isHost ? `<button class="btn btn--icon js-loop-song${song.loop ? ' loop-active' : ''}" title="${song.loop ? '반복 켜짐 (클릭해서 끄기)' : '반복 끄기 (클릭해서 켜기)'}">↻</button>` : ''}
        <button class="btn btn--icon js-move-song" title="플레이리스트 이동">⇅</button>
        <button class="btn btn--icon btn--del js-remove-song" title="삭제">✕</button>
      </div>
    `;

    // ★ Use event listeners with closure — no JSON in HTML attributes
    if (isHost) {
      item.querySelector('.js-play-song').addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('play-song', { song, playMode: 'single' });
      });
      item.querySelector('.js-loop-song').addEventListener('click', (e) => {
        e.stopPropagation();
        socket.emit('toggle-song-loop', { playlistId: playlistId || null, songId: song.id });
      });
    }
    item.querySelector('.js-move-song').addEventListener('click', (e) => {
      e.stopPropagation();
      openMoveSong(song.id, playlistId || '');
    });
    item.querySelector('.js-remove-song').addEventListener('click', (e) => {
      e.stopPropagation();
      socket.emit('remove-song', { playlistId: playlistId || null, songId: song.id });
    });

    setupSongDrag(item, idx, playlistId);
    el.appendChild(item);
  });
}

function renderQueue(queue) {
  renderSongs(queue, null, 'queue-list');
  const cur = roomState?.currentSong?.id;
  if (cur) highlightCurrentSong(cur);
}

function playPlaylist(playlistId) {
  if (!isHost || !roomState) return;
  const pl = roomState.playlists.find(p => p.id === playlistId);
  if (!pl || pl.songs.length === 0) return;
  const firstSong = (roomState.shuffle && pl.songs.length > 1)
    ? pl.songs[Math.floor(Math.random() * pl.songs.length)]
    : pl.songs[0];
  socket.emit('play-song', { song: firstSong, playMode: 'playlist' });
}

function deletePlaylist(id) {
  if (confirm('플레이리스트를 삭제할까요?')) socket.emit('delete-playlist', { playlistId: id });
}

function removeSong(songId, playlistId) {
  socket.emit('remove-song', { playlistId: playlistId || null, songId });
}

// ── Add Song Modal ────────────────────────────────
function openAddSong(playlistId) {
  addSongTargetPlaylistId = playlistId || null;
  const pl = addSongTargetPlaylistId && roomState?.playlists.find(p => p.id === addSongTargetPlaylistId);
  document.getElementById('add-song-modal-title').textContent = pl ? `곡 추가 — ${pl.name}` : '곡 추가 — 개별 대기열';
  document.getElementById('yt-url-input').value = '';
  document.getElementById('custom-title-input').value = '';
  document.getElementById('custom-memo-input').value = '';
  document.getElementById('song-title-wrap').classList.add('hidden');
  document.getElementById('add-song-preview').classList.add('hidden');
  document.getElementById('add-song-modal').classList.remove('hidden');
  document.getElementById('yt-url-input').focus();
}

document.getElementById('add-queue-song-btn').onclick = () => openAddSong(null);
document.getElementById('add-song-cancel').onclick = () => document.getElementById('add-song-modal').classList.add('hidden');

document.getElementById('yt-url-input').oninput = debounce(async e => {
  const videoId = extractVideoId(e.target.value);
  const preview = document.getElementById('add-song-preview');
  const titleWrap = document.getElementById('song-title-wrap');
  const customInput = document.getElementById('custom-title-input');
  if (!videoId) {
    preview.classList.add('hidden');
    titleWrap.classList.add('hidden');
    customInput.value = '';
    return;
  }
  preview.classList.remove('hidden');
  preview.innerHTML = `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" style="width:100%;display:block;" />`;
  // Fetch YouTube title and prefill the input value
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const d = await r.json();
    customInput.value = d.title || '';
    customInput._ytChannel = d.author_name || '';
  } catch {
    customInput.value = '';
    customInput._ytChannel = '';
  }
  titleWrap.classList.remove('hidden');
  customInput.focus();
  customInput.select();
}, 400);

document.getElementById('add-song-confirm').onclick = async () => {
  const url = document.getElementById('yt-url-input').value.trim();
  const videoId = extractVideoId(url);
  if (!videoId) { toast('올바른 YouTube 링크를 입력해주세요.', 'error'); return; }

  const customInput = document.getElementById('custom-title-input');
  const title = customInput.value.trim() || '(제목 없음)';
  const channelTitle = customInput._ytChannel || '';
  const memo = document.getElementById('custom-memo-input').value.trim();

  socket.emit('add-song', { playlistId: addSongTargetPlaylistId, song: { videoId, title, channelTitle, memo } });
  document.getElementById('add-song-modal').classList.add('hidden');

  // 같은 플레이리스트(또는 같은 대기열) 내 중복 체크 — 추가는 이미 됐으므로 경고만 표시
  let isDuplicate = false;
  if (addSongTargetPlaylistId) {
    const pl = roomState?.playlists.find(p => p.id === addSongTargetPlaylistId);
    // 방금 추가된 곡이 이미 1개 이상 있으면 중복 (추가 전 기준이므로 1개 이상)
    if (pl && pl.songs.filter(s => s.videoId === videoId).length >= 1) {
      isDuplicate = true;
    }
  } else {
    if (roomState?.queue.filter(s => s.videoId === videoId).length >= 1) {
      isDuplicate = true;
    }
  }

  if (isDuplicate) {
    toast(`"${title}" 추가됨 (⚠️ 이미 있는 곡)`, 'info');
  } else {
    toast(`"${title}" 추가됨`, 'success');
  }
};

// ── Add Playlist Modal ────────────────────────────
document.getElementById('add-playlist-btn').onclick = () => {
  document.getElementById('new-playlist-name').value = '';
  document.getElementById('add-playlist-modal').classList.remove('hidden');
  document.getElementById('new-playlist-name').focus();
};
document.getElementById('create-playlist-cancel').onclick = () => document.getElementById('add-playlist-modal').classList.add('hidden');
document.getElementById('create-playlist-confirm').onclick = () => {
  const name = document.getElementById('new-playlist-name').value.trim();
  if (!name) { toast('이름을 입력해주세요.', 'error'); return; }
  socket.emit('create-playlist', { name });
  document.getElementById('add-playlist-modal').classList.add('hidden');
};
document.getElementById('new-playlist-name').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('create-playlist-confirm').click(); });

// ── Move Song Modal ───────────────────────────────
function openMoveSong(songId, fromPlaylistId) {
  moveSongData = { songId, fromPlaylistId: fromPlaylistId || null };
  const list = document.getElementById('move-target-list');
  list.innerHTML = '';

  if (fromPlaylistId) {
    const btn = document.createElement('button');
    btn.className = 'move-target-btn';
    btn.textContent = '📋 개별 대기열';
    btn.onclick = () => { socket.emit('move-song-to-playlist', { ...moveSongData, toPlaylistId: null }); document.getElementById('move-song-modal').classList.add('hidden'); };
    list.appendChild(btn);
  }

  (roomState?.playlists || []).forEach(pl => {
    if (pl.id === fromPlaylistId) return;
    const btn = document.createElement('button');
    btn.className = 'move-target-btn';
    btn.textContent = `🎵 ${pl.name}`;
    btn.onclick = () => { socket.emit('move-song-to-playlist', { ...moveSongData, toPlaylistId: pl.id }); document.getElementById('move-song-modal').classList.add('hidden'); };
    list.appendChild(btn);
  });

  if (list.children.length === 0) list.innerHTML = '<p style="color:var(--text-muted);font-size:0.87rem;">이동할 수 있는 위치가 없습니다.</p>';
  document.getElementById('move-song-modal').classList.remove('hidden');
}

document.getElementById('move-song-cancel').onclick = () => document.getElementById('move-song-modal').classList.add('hidden');

// ── Drag & Drop ───────────────────────────────────
function setupPlaylistDrag(section, idx) {
  const handle = section.querySelector('.playlist-drag-handle');
  handle.addEventListener('mousedown', () => { section.draggable = true; });
  section.addEventListener('dragstart', e => { dragSource = { type: 'playlist', idx }; e.dataTransfer.effectAllowed = 'move'; });
  section.addEventListener('dragend', () => { section.draggable = false; document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); });
  section.addEventListener('dragover', e => { if (!dragSource || dragSource.type !== 'playlist') return; e.preventDefault(); section.classList.add('drag-over'); });
  section.addEventListener('dragleave', () => section.classList.remove('drag-over'));
  section.addEventListener('drop', e => {
    e.preventDefault(); section.classList.remove('drag-over');
    if (!dragSource || dragSource.type !== 'playlist') return;
    const toIdx = parseInt(section.dataset.idx);
    if (dragSource.idx !== toIdx) socket.emit('reorder-playlists', { fromIndex: dragSource.idx, toIndex: toIdx });
    dragSource = null;
  });
}

function setupSongDrag(item, idx, playlistId) {
  item.addEventListener('dragstart', e => { dragSource = { type: 'song', idx, playlistId }; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); });
  item.addEventListener('dragover', e => { if (!dragSource || dragSource.type !== 'song' || dragSource.playlistId !== playlistId) return; e.preventDefault(); e.stopPropagation(); item.classList.add('drag-over'); });
  item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
  item.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation(); item.classList.remove('drag-over');
    if (!dragSource || dragSource.type !== 'song' || dragSource.playlistId !== playlistId) return;
    const toIdx = parseInt(item.dataset.idx);
    if (dragSource.idx !== toIdx) socket.emit('reorder-songs', { playlistId: playlistId || null, fromIndex: dragSource.idx, toIndex: toIdx });
    dragSource = null;
  });
}

// ── Copy buttons & Room controls ──────────────────
document.getElementById('copy-code').onclick = () => navigator.clipboard.writeText(document.getElementById('room-code').textContent).then(() => toast('코드 복사됨!', 'success'));
document.getElementById('copy-link-btn').onclick = () => navigator.clipboard.writeText(window.location.href).then(() => toast('링크 복사됨!', 'success'));

document.getElementById('delete-room-btn').onclick = () => {
  if (!isHost) return;
  if (!confirm('방을 삭제하면 모든 참가자가 퇴장됩니다. 계속할까요?')) return;
  socket.emit('delete-room');
};

socket.on('room-deleted', () => {
  alert('방이 삭제되었습니다.');
  window.location.href = '/';
});

// ── Activity log ──────────────────────────────────
function log(msg, type = 'system') {
  const el = document.getElementById('chat-log');
  const item = document.createElement('p');
  item.className = `log-item log-item--${type}`;
  const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  item.textContent = `[${time}] ${msg}`;
  el.appendChild(item);
  el.scrollTop = el.scrollHeight;
}

// ── Toast ─────────────────────────────────────────

// ── 미니 플레이어 ──────────────────────────────────────
const MINI_PLAYER_KEY = 'jukesync-mini-player-open';

function initMiniPlayer() {
  const toggle = document.getElementById('mini-player-toggle');
  const body   = document.getElementById('mini-player-body');
  const icon   = document.getElementById('mini-player-toggle-icon');
  if (!toggle || !body) return;

  // 저장된 상태 복원 (기본값: 닫힘)
  const isOpen = localStorage.getItem(MINI_PLAYER_KEY) === '1';
  if (isOpen) {
    body.classList.add('open');
    icon.textContent = '▼ 영상 숨기기';
  } else {
    icon.textContent = '▶ 영상 보기';
  }

  toggle.addEventListener('click', () => {
    const opening = !body.classList.contains('open');
    body.classList.toggle('open');
    icon.textContent = opening ? '▼ 영상 숨기기' : '▶ 영상 보기';
    localStorage.setItem(MINI_PLAYER_KEY, opening ? '1' : '0');
  });
}

function updateMiniPlayerPosition() {
  const wrap = document.getElementById('mini-player-wrap');
  if (!wrap) return;
  if (isHost) {
    wrap.classList.remove('mini-player-fixed');
    return;
  }
  // 게스트: fixed 배치, 화면 우측 하단
  wrap.classList.add('mini-player-fixed');
  const searchSection = document.getElementById('search-section');
  if (searchSection && !searchSection.classList.contains('collapsed')) {
    const w = searchSection.getBoundingClientRect().width;
    wrap.style.right = (w + 24) + 'px';
  } else {
    wrap.style.right = '1.5rem';
  }
}

function toast(msg, type = 'info', large = false) {
  const t = document.createElement('div');
  t.className = `toast toast--${type}${large ? ' toast--large' : ''}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('visible'), 10);
  // 에러는 4초, 일반은 2.5초 표시
  const duration = (type === 'error') ? 4000 : 2500;
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 250); }, duration);
}

// ── Utilities ─────────────────────────────────────
function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function debounce(fn, delay) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
}

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));

// Enter key shortcuts
document.getElementById('yt-url-input').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('add-song-confirm').click(); });
document.getElementById('custom-title-input').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('add-song-confirm').click(); });
document.getElementById('custom-memo-input').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('add-song-confirm').click(); });

// ── Playlist Export / Import ──────────────────────

async function exportPlaylist(pl) {
  const btn = document.getElementById('share-code-value');
  const hint = document.getElementById('share-code-hint');
  btn.textContent = '생성 중...';
  hint.textContent = '클릭하면 복사됩니다';
  document.getElementById('share-code-modal').classList.remove('hidden');

  try {
    const res = await fetch('/api/share/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist: { name: pl.name, songs: pl.songs } }),
    });
    const data = await res.json();
    if (data.error) { toast(data.error, 'error'); document.getElementById('share-code-modal').classList.add('hidden'); return; }
    btn.textContent = data.code;
  } catch (e) {
    toast('코드 생성에 실패했습니다.', 'error');
    document.getElementById('share-code-modal').classList.add('hidden');
  }
}

document.getElementById('share-code-value').addEventListener('click', () => {
  const code = document.getElementById('share-code-value').textContent;
  if (!code || code === '생성 중...') return;
  navigator.clipboard.writeText(code).then(() => {
    document.getElementById('share-code-hint').textContent = '✅ 복사되었습니다!';
    setTimeout(() => { document.getElementById('share-code-hint').textContent = '클릭하면 복사됩니다'; }, 2000);
  });
});

document.getElementById('share-code-close').addEventListener('click', () => {
  document.getElementById('share-code-modal').classList.add('hidden');
});

// 불러오기 버튼
document.getElementById('import-playlist-btn').addEventListener('click', () => {
  document.getElementById('import-code-input').value = '';
  document.getElementById('import-error').classList.add('hidden');
  document.getElementById('import-playlist-modal').classList.remove('hidden');
  document.getElementById('import-code-input').focus();
});

document.getElementById('import-playlist-cancel').addEventListener('click', () => {
  document.getElementById('import-playlist-modal').classList.add('hidden');
});

document.getElementById('import-playlist-confirm').addEventListener('click', async () => {
  const code = document.getElementById('import-code-input').value.trim().toUpperCase();
  const errEl = document.getElementById('import-error');
  if (!code) { errEl.textContent = '코드를 입력해주세요.'; errEl.classList.remove('hidden'); return; }

  let addSongs = null;
  try {
    const res = await fetch(`/api/share/playlist/${code}`);
    const data = await res.json();
    if (data.error) { errEl.textContent = data.error; errEl.classList.remove('hidden'); return; }

    // create 전 기존 플레이리스트 id 스냅샷 → 새로 생긴 것을 정확히 특정
    const existingIds = new Set((roomState?.playlists || []).map(p => p.id));
    socket.emit('create-playlist', { name: data.playlist.name });

    // playlists-update 이벤트에서 새 플레이리스트를 id 기준으로 찾아 곡 추가
    addSongs = (playlists) => {
      const newPl = playlists.find(p => !existingIds.has(p.id));
      if (!newPl) return;
      socket.off('playlists-update', addSongs);
      data.playlist.songs.forEach(song => {
        socket.emit('add-song', { playlistId: newPl.id, song: { videoId: song.videoId, title: song.title, channelTitle: song.channelTitle || '', memo: song.memo || '' } });
      });
      toast(`"${data.playlist.name}" 불러오기 완료 (${data.playlist.songs.length}곡)`, 'success');
    };
    socket.on('playlists-update', addSongs);

    document.getElementById('import-playlist-modal').classList.add('hidden');
  } catch (e) {
    if (addSongs) socket.off('playlists-update', addSongs); // 리스너 누수 방지
    errEl.textContent = '불러오기에 실패했습니다.';
    errEl.classList.remove('hidden');
  }
});

document.getElementById('import-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('import-playlist-confirm').click();
});

// ── Sidebar Resize ───────────────────────────
(function() {
  const sidebar = document.getElementById('sidebar');
  const handle  = document.getElementById('sidebar-resize-handle');
  if (!sidebar || !handle) return;

  const SIDEBAR_WIDTH_KEY = 'jukesync-sidebar-width';
  const MIN_WIDTH = 260;
  const MAX_WIDTH = 800;

  const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  if (saved) {
    sidebar.style.width = saved + 'px';
    const layout = document.querySelector('.room-layout');
    if (layout) layout.style.gridTemplateColumns = `${saved}px 1fr auto`;
  }

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    handle.classList.add('dragging');
    const startX     = e.clientX;
    const startWidth = sidebar.getBoundingClientRect().width;

    function onMouseMove(e) {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
      sidebar.style.width = newWidth + 'px';
      const layout = document.querySelector('.room-layout');
      if (layout) layout.style.gridTemplateColumns = `${newWidth}px 1fr auto`;
    }

    function onMouseUp() {
      handle.classList.remove('dragging');
      const w = parseInt(sidebar.style.width);
      if (w) localStorage.setItem(SIDEBAR_WIDTH_KEY, w);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
})();

// ── YouTube Search ────────────────────────────
(function() {
  const section     = document.getElementById('search-section');
  const collapseBtn = document.getElementById('search-collapse-btn');
  const resizeHandle = document.getElementById('search-resize-handle');
  const input       = document.getElementById('yt-search-input');
  const searchBtn   = document.getElementById('yt-search-btn');
  const results     = document.getElementById('yt-search-results');

  if (!section) return; // 게스트 화면엔 없음

  const COLLAPSED_KEY = 'jukesync-search-collapsed';
  const WIDTH_KEY     = 'jukesync-search-width';

  // 너비 복원
  const savedWidth = localStorage.getItem(WIDTH_KEY);
  if (savedWidth) section.style.width = savedWidth + 'px';

  // 접기 상태 복원
  if (localStorage.getItem(COLLAPSED_KEY) === '1') {
    section.classList.add('collapsed');
    collapseBtn.textContent = '›';
  } else {
    collapseBtn.textContent = '‹';
  }

  collapseBtn.addEventListener('click', () => {
    const isCollapsed = section.classList.toggle('collapsed');
    collapseBtn.textContent = isCollapsed ? '›' : '‹';
    localStorage.setItem(COLLAPSED_KEY, isCollapsed ? '1' : '0');
    // 접힌 상태에서는 너비 저장 안 함
    if (!isCollapsed) {
      const savedWidth = localStorage.getItem('jukesync-search-width');
      if (savedWidth) section.style.width = savedWidth + 'px';
    }
    updateMiniPlayerPosition();
  });

  // ── 드래그 리사이즈 ──
  resizeHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = section.offsetWidth;
    resizeHandle.classList.add('dragging');
    section.classList.add('resizing');

    function onMove(e) {
      const delta    = startX - e.clientX; // 왼쪽으로 드래그 = 넓어짐
      const newWidth = Math.min(700, Math.max(200, startWidth + delta));
      section.style.width = newWidth + 'px';
    }
    function onUp() {
      resizeHandle.classList.remove('dragging');
      section.classList.remove('resizing');
      localStorage.setItem(WIDTH_KEY, parseInt(section.style.width));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // 검색 실행
  async function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    results.innerHTML = '<p class="search-hint">검색 중...</p>';
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error === 'quota') {
        results.innerHTML = '<p class="search-hint">오늘의 검색 한도에 도달했습니다.<br/>URL을 직접 붙여넣어 곡을 추가해주세요.</p>';
        return;
      }
      if (data.error) {
        results.innerHTML = `<p class="search-hint">오류: ${data.error}</p>`;
        return;
      }
      if (!data.items || data.items.length === 0) {
        results.innerHTML = '<p class="search-hint">검색 결과가 없습니다.</p>';
        return;
      }
      results.innerHTML = '';
      data.items.forEach(item => {
        const url = `https://www.youtube.com/watch?v=${item.videoId}`;
        const el = document.createElement('div');
        el.className = 'search-result-item';
        el.innerHTML = `
          <img class="search-result-thumb" src="${item.thumb}" alt="" loading="lazy" />
          <div class="search-result-info">
            <p class="search-result-title"></p>
            <p class="search-result-ch"></p>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
            <button class="search-copy-btn" title="URL 복사">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button class="search-add-btn" title="플레이리스트에 추가">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        `;
        // textContent로 직접 삽입 (이중 인코딩 방지)
        const titleEl = el.querySelector('.search-result-title');
        const chEl    = el.querySelector('.search-result-ch');
        titleEl.textContent = item.title;
        titleEl.title       = item.title;
        chEl.textContent    = item.channel;
        el.querySelector('.search-copy-btn').addEventListener('click', () => {
          navigator.clipboard.writeText(url).then(() => toast('URL 복사됨! 플레이리스트에 붙여넣으세요.', 'success'));
        });
        el.querySelector('.search-add-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openSearchAddDropdown(e.currentTarget, url, item.title, item.channel);
        });
        results.appendChild(el);
      });
    } catch(e) {
      results.innerHTML = '<p class="search-hint">검색 중 오류가 발생했습니다.</p>';
    }
  }

  searchBtn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // ── 플레이리스트 선택 드롭다운 ──
  function openSearchAddDropdown(btn, url, ytTitle, ytChannel) {
    // 기존 드롭다운 제거
    document.querySelectorAll('.search-add-dropdown').forEach(d => d.remove());

    const dropdown = document.createElement('div');
    dropdown.className = 'search-add-dropdown';

    // 플레이리스트 목록 + 개별 대기열 생성
    const playlists = roomState?.playlists || [];
    const items = [
      ...playlists.map(pl => ({ label: pl.name, id: pl.id })),
      { label: '개별 대기열', id: null, divider: playlists.length > 0 },
    ];

    items.forEach(item => {
      if (item.divider) {
        const hr = document.createElement('hr');
        hr.style.cssText = 'border:none;border-top:1px solid var(--border);margin:3px 0;';
        dropdown.appendChild(hr);
      }
      const opt = document.createElement('button');
      opt.className = 'search-add-dropdown-item';
      opt.textContent = item.label;
      opt.addEventListener('click', () => {
        dropdown.remove();
        // 기존 모달 열기 (URL 자동 입력 + oembed로 제목 채우기)
        openAddSong(item.id);
        // URL 입력 후 oninput 트리거
        const urlInput = document.getElementById('yt-url-input');
        urlInput.value = url;
        urlInput.dispatchEvent(new Event('input'));
      });
      dropdown.appendChild(opt);
    });

    // 버튼 위치 기준으로 드롭다운 위치 결정 (공간 부족 시 위쪽으로 펼침)
    document.body.appendChild(dropdown);
    const rect   = btn.getBoundingClientRect();
    const ddRect = dropdown.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top, left;
    left = rect.left + window.scrollX - ddRect.width + rect.width;
    if (left < 4) left = 4;
    if (spaceBelow >= ddRect.height + 8 || spaceBelow >= spaceAbove) {
      // 아래 공간이 충분하거나 위보다 아래가 더 넓으면 아래로
      top = rect.bottom + window.scrollY + 4;
    } else {
      // 위로 펼침
      top = rect.top + window.scrollY - ddRect.height - 4;
    }
    dropdown.style.top  = top + 'px';
    dropdown.style.left = left + 'px';

    // 바깥 클릭 시 닫기
    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 0);
  }
})();
