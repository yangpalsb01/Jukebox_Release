// ── JukeSync Themes ──────────────────────────────
// localStorage key: 'jukesync-theme'
// 각 테마: { id, name, dark, vars }

const THEMES = [
  // ── Light ─────────────────────────────────────
  {
    id: 'light-crimson', name: 'Crimson', dark: false,
    vars: { '--bg':'#faf5f5','--bg2':'#f1e4e4','--surface':'#ffffff','--surface2':'#fbf9f9','--surface3':'#f6eeee','--border':'#ddbbbb','--border2':'#cc9999','--accent':'#7a0000','--accent2':'#973838','--text':'#210808','--text-muted':'#aa6e6e','--text-light':'#d2acac' }
  },
  {
    id: 'light-umber', name: 'Umber Brown', dark: false,
    vars: { '--bg':'#faf5f5','--bg2':'#f1e5e4','--surface':'#ffffff','--surface2':'#fbf9f9','--surface3':'#f6efee','--border':'#ddbdbb','--border2':'#cc9d99','--accent':'#5d4240','--accent2':'#816c6a','--text':'#210a08','--text-muted':'#aa736e','--text-light':'#d2afac' }
  },
  {
    id: 'light-orange', name: 'Orange', dark: false,
    vars: { '--bg':'#faf7f5','--bg2':'#f1eae4','--surface':'#ffffff','--surface2':'#fbfaf9','--surface3':'#f6f2ee','--border':'#ddcabb','--border2':'#ccb099','--accent':'#fe943e','--accent2':'#feac68','--text':'#211308','--text-muted':'#aa896e','--text-light':'#d2bdac' }
  },
  {
    id: 'light-sepia', name: 'Old Paper', dark: false,
    vars: { '--bg':'#faf7f5','--bg2':'#f1eae4','--surface':'#ffffff','--surface2':'#fbfaf9','--surface3':'#f6f2ee','--border':'#ddcbbb','--border2':'#ccb199','--accent':'#8b6340','--accent2':'#a5856a','--text':'#211408','--text-muted':'#aa8a6e','--text-light':'#d2beac' }
  },
  {
    id: 'light-gold', name: 'Gold', dark: false,
    vars: { '--bg':'#faf9f5','--bg2':'#f1eee4','--surface':'#ffffff','--surface2':'#fbfaf9','--surface3':'#f6f4ee','--border':'#ddd4bb','--border2':'#ccbe99','--accent':'#f8b601','--accent2':'#fac639','--text':'#211a08','--text-muted':'#aa9a6e','--text-light':'#d2c8ac' }
  },
  {
    id: 'light-lime', name: 'Lime', dark: false,
    vars: { '--bg':'#f9faf5','--bg2':'#eef1e4','--surface':'#ffffff','--surface2':'#fbfbf9','--surface3':'#f4f6ee','--border':'#d5ddbb','--border2':'#c0cc99','--accent':'#bddd54','--accent2':'#cce47a','--text':'#1b2108','--text-muted':'#9caa6e','--text-light':'#c9d2ac' }
  },
  {
    id: 'light-sage', name: 'Sage Green', dark: false,
    vars: { '--bg':'#f6faf5','--bg2':'#e8f1e4','--surface':'#ffffff','--surface2':'#f9fbf9','--surface3':'#f0f6ee','--border':'#c5ddbb','--border2':'#a7cc99','--accent':'#6a9858','--accent2':'#8baf7d','--text':'#0f2108','--text-muted':'#7faa6e','--text-light':'#b7d2ac' }
  },
  {
    id: 'light-teal', name: 'Teal', dark: false,
    vars: { '--bg':'#f5fafa','--bg2':'#e4f1f1','--surface':'#ffffff','--surface2':'#f9fbfb','--surface3':'#eef6f6','--border':'#bbdcdd','--border2':'#99cacc','--accent':'#007b7f','--accent2':'#38989b','--text':'#082021','--text-muted':'#6ea8aa','--text-light':'#acd1d2' }
  },
  {
    id: 'light-deepteal', name: 'Deep Teal', dark: false,
    vars: { '--bg':'#f5f9fa','--bg2':'#e4eff1','--surface':'#ffffff','--surface2':'#f9fbfb','--surface3':'#eef5f6','--border':'#bbd7dd','--border2':'#99c2cc','--accent':'#045d71','--accent2':'#3b8190','--text':'#081c21','--text-muted':'#6e9faa','--text-light':'#accbd2' }
  },
  {
    id: 'light-ocean', name: 'Ocean Blue', dark: false,
    vars: { '--bg':'#f5f8fa','--bg2':'#e4edf1','--surface':'#ffffff','--surface2':'#f9fafb','--surface3':'#eef4f6','--border':'#bbd1dd','--border2':'#99bacc','--accent':'#0f628e','--accent2':'#4485a7','--text':'#081821','--text-muted':'#6e95aa','--text-light':'#acc5d2' }
  },
  {
    id: 'light-skyblue', name: 'Sky Blue', dark: false,
    vars: { '--bg':'#f5f8fa','--bg2':'#e4ebf1','--surface':'#ffffff','--surface2':'#f9fafb','--surface3':'#eef3f6','--border':'#bbcddd','--border2':'#99b4cc','--accent':'#5eadf1','--accent2':'#81bff4','--text':'#081521','--text-muted':'#6e8eaa','--text-light':'#acc1d2' }
  },
  {
    id: 'light-navy', name: 'Navy', dark: false,
    vars: { '--bg':'#f5f6fa','--bg2':'#e4e7f1','--surface':'#ffffff','--surface2':'#f9f9fb','--surface3':'#eef0f6','--border':'#bbc3dd','--border2':'#99a5cc','--accent':'#213163','--accent2':'#525e85','--text':'#080e21','--text-muted':'#6e7daa','--text-light':'#acb5d2' }
  },
  {
    id: 'light-lavender', name: 'Lavender', dark: false,
    vars: { '--bg':'#f6f5fa','--bg2':'#e7e4f1','--surface':'#ffffff','--surface2':'#f9f9fb','--surface3':'#f0eef6','--border':'#c2bbdd','--border2':'#a399cc','--accent':'#7060b0','--accent2':'#8f83c1','--text':'#0d0821','--text-muted':'#7a6eaa','--text-light':'#b4acd2' }
  },
  {
    id: 'light-violet', name: 'Violet', dark: false,
    vars: { '--bg':'#f6f5fa','--bg2':'#e8e4f1','--surface':'#ffffff','--surface2':'#f9f9fb','--surface3':'#f0eef6','--border':'#c5bbdd','--border2':'#a899cc','--accent':'#403068','--accent2':'#6a5e89','--text':'#0f0821','--text-muted':'#7f6eaa','--text-light':'#b7acd2' }
  },
  {
    id: 'light-cotton', name: 'Cotton Candy', dark: false,
    vars: { '--bg':'#faf5f9','--bg2':'#f1e4ef','--surface':'#ffffff','--surface2':'#fbf9fb','--surface3':'#f6eef5','--border':'#ddbbd7','--border2':'#cc99c3','--accent':'#d070c0','--accent2':'#da8fce','--text':'#21081d','--text-muted':'#aa6ea0','--text-light':'#d2accc' }
  },
  {
    id: 'light-hotpink-l', name: 'Hot Pink', dark: false,
    vars: { '--bg':'#faf5f7','--bg2':'#f1e4e9','--surface':'#ffffff','--surface2':'#fbf9fa','--surface3':'#f6eef2','--border':'#ddbbc9','--border2':'#cc99ae','--accent':'#ff1475','--accent2':'#ff4893','--text':'#210812','--text-muted':'#aa6e87','--text-light':'#d2acbc' }
  },
  {
    id: 'light-raspberry', name: 'Raspberry', dark: false,
    vars: { '--bg':'#faf5f7','--bg2':'#f1e4e9','--surface':'#ffffff','--surface2':'#fbf9fa','--surface3':'#f6eef1','--border':'#ddbbc8','--border2':'#cc99ad','--accent':'#c6004c','--accent2':'#d33873','--text':'#210812','--text-muted':'#aa6e85','--text-light':'#d2acbb' }
  },
  {
    id: 'light-rose', name: 'Dusty Rose', dark: false,
    vars: { '--bg':'#faf5f6','--bg2':'#f1e4e7','--surface':'#ffffff','--surface2':'#fbf9f9','--surface3':'#f6eef0','--border':'#ddbbc2','--border2':'#cc99a3','--accent':'#b06070','--accent2':'#c1838f','--text':'#21080d','--text-muted':'#aa6e7a','--text-light':'#d2acb4' }
  },
  {
    id: 'light-coral', name: 'Coral', dark: false,
    vars: { '--bg':'#faf5f6','--bg2':'#f1e4e6','--surface':'#ffffff','--surface2':'#fbf9f9','--surface3':'#f6eeef','--border':'#ddbbc0','--border2':'#cc99a1','--accent':'#fa657b','--accent2':'#fb8798','--text':'#21080c','--text-muted':'#aa6e77','--text-light':'#d2acb2' }
  },
  {
    id: 'light-neutral', name: 'Warm Neutral', dark: false,
    vars: { '--bg':'#f5f5f3','--bg2':'#eeeeed','--surface':'#ffffff','--surface2':'#f9f9f7','--surface3':'#f0f0ee','--border':'#ddddd8','--border2':'#c4c4be','--accent':'#2b2b2b','--accent2':'#555550','--text':'#1c1c1c','--text-muted':'#888885','--text-light':'#b4b4ae' }
  },

  // ── Dark ──────────────────────────────────────
  {
    id: 'dark-scarlet', name: 'Scarlet', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#fc2525','--accent2':'#fd5959','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-amber', name: 'Amber', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f49c38','--accent2':'#f7b468','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-yellow', name: 'Yellow', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f8d301','--accent2':'#fade3e','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-lime', name: 'Lime', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#b2da01','--accent2':'#c4e33e','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-forest', name: 'Forest Night', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#5a9e6f','--accent2':'#82b592','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-mint', name: 'Mint', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#83f1e9','--accent2':'#a1f4ee','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-cyan', name: 'Cyan', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#00b1c1','--accent2':'#3dc4d0','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-aqua', name: 'Aqua', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#3ecefe','--accent2':'#6cdafe','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-navy', name: 'Midnight Blue', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#4a7fc1','--accent2':'#759ed0','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-periwinkle', name: 'Periwinkle', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#9381fd','--accent2':'#ad9ffd','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
  },
  {
    id: 'dark-hotpink', name: 'Hot Pink', dark: true,
    vars: { '--bg':'#141414','--bg2':'#1c1c1c','--surface':'#1a1a1a','--surface2':'#202020','--surface3':'#282828','--border':'#2e2e2e','--border2':'#3a3a3a','--accent':'#f80189','--accent2':'#fa3ea5','--text':'#f5f5f5','--text-muted':'#686868','--text-light':'#484848' }
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
  // 요청한 id가 아니라 "실제로 적용된" 테마의 id를 저장한다.
  // 삭제된 테마가 저장돼 있던 경우, 대체 테마로 한 번 넘어간 뒤 그대로 정리된다.
  localStorage.setItem('jukesync-theme', theme.id);
  // 현재 선택 표시 갱신
  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.themeId === theme.id);
  });
}

// 저장된 테마 로드 (페이지 로드 시 즉시 실행)
(function () {
  const saved = localStorage.getItem('jukesync-theme');
  if (saved) applyTheme(saved);
})();
