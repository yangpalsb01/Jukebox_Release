// ── JukeSync Themes ──────────────────────────────
// localStorage key: 'jukesync-theme'
// 각 테마: { id, name, dark, vars }

const THEMES = [
  // ── Light ─────────────────────────────────────
  {
    id: 'light-crimson', name: 'Crimson', dark: false,
    vars: { '--bg':'#f8f5f5','--bg2':'#efe8e8','--surface':'#ffffff','--surface2':'#fdf8f8','--surface3':'#f5eded','--border':'#e4d0d0','--border2':'#d0b8b8','--accent':'#7a0000','--accent2':'#a03030','--text':'#1e0a0a','--text-muted':'#a07878','--text-light':'#c8a8a8' }
  },
  {
    id: 'light-peach', name: 'Peach', dark: false,
    vars: { '--bg':'#fdf5f6','--bg2':'#f5e8ea','--surface':'#ffffff','--surface2':'#fef9f9','--surface3':'#f8eeef','--border':'#f0d8dc','--border2':'#dfc0c6','--accent':'#c47080','--accent2':'#e08898','--text':'#2a1216','--text-muted':'#d090a0','--text-light':'#e4b8c4' }
  },
  {
    id: 'light-cotton', name: 'Cotton Candy', dark: false,
    vars: { '--bg':'#fdf5fc','--bg2':'#f5e5f5','--surface':'#ffffff','--surface2':'#fef8fe','--surface3':'#f8eef8','--border':'#f0d8ec','--border2':'#e0c0e0','--accent':'#d070c0','--accent2':'#e890d8','--text':'#2a1a28','--text-muted':'#c890be','--text-light':'#e0b8d8' }
  },
  {
    id: 'light-sage', name: 'Sage Green', dark: false,
    vars: { '--bg':'#f4f8f0','--bg2':'#e8f0e0','--surface':'#ffffff','--surface2':'#f8fbf5','--surface3':'#eef5e8','--border':'#ccdec4','--border2':'#b0cc9e','--accent':'#6a9858','--accent2':'#88b474','--text':'#1a2416','--text-muted':'#88aa78','--text-light':'#b0cc9e' }
  },
  {
    id: 'light-teal', name: 'Teal', dark: false,
    vars: { '--bg':'#f0f8f8','--bg2':'#e0f0f0','--surface':'#ffffff','--surface2':'#f5fbfb','--surface3':'#e8f6f6','--border':'#bcdcde','--border2':'#98c8cc','--accent':'#007b7f','--accent2':'#2a9a9e','--text':'#001e20','--text-muted':'#6aaab0','--text-light':'#9cccd0' }
  },
  {
    id: 'light-lavender', name: 'Lavender', dark: false,
    vars: { '--bg':'#f6f4fc','--bg2':'#ece8f8','--surface':'#ffffff','--surface2':'#faf8fe','--surface3':'#f2eefa','--border':'#dcd6f0','--border2':'#c8c0e4','--accent':'#7060b0','--accent2':'#9080cc','--text':'#1e1830','--text-muted':'#9e92c4','--text-light':'#c0b8e0' }
  },
  {
    id: 'light-rose', name: 'Dusty Rose', dark: false,
    vars: { '--bg':'#f7f0f2','--bg2':'#ede0e4','--surface':'#ffffff','--surface2':'#fdf6f8','--surface3':'#f5eaee','--border':'#e0cdd2','--border2':'#ccb4bc','--accent':'#b06070','--accent2':'#c87888','--text':'#3a2028','--text-muted':'#b09098','--text-light':'#d0b4bc' }
  },
  {
    id: 'light-sepia', name: 'Old Paper', dark: false,
    vars: { '--bg':'#f2ead8','--bg2':'#e8dcc4','--surface':'#fdf8ec','--surface2':'#f8f0dc','--surface3':'#f0e8cc','--border':'#d9cbb0','--border2':'#c4b090','--accent':'#8b6340','--accent2':'#a87850','--text':'#3a2c1a','--text-muted':'#a0886a','--text-light':'#c4aa88' }
  },
  {
    id: 'light-neutral', name: 'Warm Neutral', dark: false,
    vars: { '--bg':'#f5f5f3','--bg2':'#eeeeed','--surface':'#ffffff','--surface2':'#f9f9f7','--surface3':'#f0f0ee','--border':'#ddddd8','--border2':'#c4c4be','--accent':'#2b2b2b','--accent2':'#555550','--text':'#1c1c1c','--text-muted':'#888885','--text-light':'#b4b4ae' }
  },

  // ── Dark ──────────────────────────────────────
  {
    id: 'dark-hotpink', name: 'Hot Pink', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f80189','--accent2':'#ff40a8','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-yellow', name: 'Yellow', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f8d301','--accent2':'#fce040','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-mint', name: 'Mint', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#83f1e9','--accent2':'#a8f8f0','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-forest', name: 'Forest Night', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#5a9e6f','--accent2':'#78b888','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-navy', name: 'Midnight Blue', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#4a7fc1','--accent2':'#6898d8','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-obsidian', name: 'Obsidian', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f0f0ee','--accent2':'#d0d0ce','--text':'#f0f0ee','--text-muted':'#6a6a6a','--text-light':'#484848' }
  },
];

// 현재 테마 적용
function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES.find(t => t.id === 'light-neutral');
  const root = document.documentElement;
  // 그림자는 다크/라이트에 따라 자동 조정
  if (theme.dark) {
    root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)');
    root.style.setProperty('--shadow-md', '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)');
    root.style.setProperty('--shadow-lg', '0 12px 32px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)');
  } else {
    root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)');
    root.style.setProperty('--shadow-md', '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)');
    root.style.setProperty('--shadow-lg', '0 12px 32px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)');
  }
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  localStorage.setItem('jukesync-theme', id);
  // 현재 선택 표시 갱신
  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.themeId === id);
  });
}

// 저장된 테마 로드 (페이지 로드 시 즉시 실행)
(function () {
  const saved = localStorage.getItem('jukesync-theme');
  if (saved) applyTheme(saved);
})();
