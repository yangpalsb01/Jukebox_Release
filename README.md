# 🎵 JukeSync — 개인 동기화 주크박스

여러 명이 함께 같은 음악을 실시간으로 들을 수 있는 웹 서비스입니다.  
YouTube 링크로 곡을 추가하고, 방을 만들어 친구들과 공유하세요.

---

## 주요 기능

- 방 생성 / 코드로 입장 / 링크 공유
- 플레이리스트 생성·이름 변경·삭제
- YouTube 링크로 곡 추가
- 드래그 앤 드롭으로 플레이리스트·곡 순서 변경
- 셔플 / 반복(전체·한 곡) 기능
- **호스트만** 재생·일시정지·볼륨 제어 가능
- 영상 없이 BGM만 재생 (YouTube IFrame API)
- 실시간 동기화 (Socket.io)
- 플레이리스트 코드 내보내기 / 불러오기
- 관리자 패널 (방 강제 삭제, 호스트·방 이름 변경)

---

## 설치 방법 (GitHub 웹 업로드 + Render.com 기준)

### 1단계 — GitHub에 올리기

1. [github.com](https://github.com) 에서 새 저장소(Repository)를 만드세요.
2. 이 zip 파일의 압축을 풀면 나오는 **파일과 폴더들을 전부** 저장소에 업로드하세요.


---

### 2단계 — MongoDB Atlas 설정 (데이터베이스)

방 목록과 플레이리스트를 저장하는 데이터베이스입니다. 무료로 사용할 수 있습니다.

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) 에 접속해서 무료 계정을 만드세요.
2. 계정을 만든 뒤에 Free 요금제 선택 후 클러스터의 이름 설정, **Create Deployment**를 클릭해 클러스터를 생성하세요.
3. 생성 중에 **Username**과 **Password**를 설정하라고 나옵니다. 기억해두세요. **Create Database User**를 클릭해주세요.
4. 아래와 같이 생긴 연결 문자열을 복사하세요. (해당 문자열이 적힌 창이 뜨지 않는다면 **Connect** 버튼 클릭 → **Drivers** 선택)
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. `<username>`과 `<password>` 부분이 개인 설정값으로 교체되어있을겁니다. **Done**을 눌러주세요.
7. 왼쪽 메뉴 **Database & Network Access** → **IP Access List** → **Add IP Address** → **Access List Entry**에 **0.0.0.0/0** 입력 후 저장하세요.

> 이 연결 문자열은 다음 단계에서 사용합니다.

---

### 3단계 — Render.com 배포

1. [render.com](https://render.com) 에 접속해서 GitHub 계정으로 로그인하세요.
2. **New** → **Web Service** 클릭
3. 1단계에서 만든 GitHub 저장소를 선택하세요.
4. 아래와 같이 설정하세요:

   | 항목 | 값 |
   |------|-----|
   | **Language** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |

5. 아래로 스크롤해서 **Environment Variables** 항목을 찾으세요.  
   **Add Environment Variable** 버튼으로 아래 항목들을 추가하세요:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | 2단계에서 복사한 연결 문자열 |
   | `ADMIN_PASSWORD` | 원하는 관리자 비밀번호 (설정 안 하면 기본값 `0000`) |
   | `YOUTUBE_API_KEY` | YouTube 검색 기능을 쓸 경우 입력 (없어도 됨) |

6. **Deploy Web Service** 클릭하면 배포가 시작됩니다.
7. 배포 완료 후 표시되는 주소로 접속하세요. 시간이 몇분정도 걸릴 수 있습니다.

---

### YouTube API 키 발급 방법 (선택)

방 안에서 YouTube 검색 기능을 쓰고 싶을 때만 필요합니다.  
설정하지 않아도 YouTube 링크를 직접 붙여넣는 방식으로 곡 추가는 가능합니다.

1. [console.cloud.google.com](https://console.cloud.google.com) 에 접속 (Google 계정 필요)
2. 새 프로젝트 만들기
3. **API 및 서비스 → 라이브러리** 검색창에 `YouTube Data API v3` 입력 후 **사용** 클릭
4. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키** 클릭
5. 생성된 키를 복사해서 Render.com 환경변수 `YOUTUBE_API_KEY`에 붙여넣기

---

## 개인화 설정

### 관리자 비밀번호 변경

Render.com 대시보드 → 해당 서비스 → **Environment** 탭에서  
`ADMIN_PASSWORD` 값을 원하는 비밀번호로 수정 후 저장하면 자동으로 재배포됩니다.

> 기본값 `0000`은 반드시 변경하는 것을 권장합니다.

### 게스트 공지 문구 수정

방에 입장한 게스트에게 보이는 안내 문구입니다.  
`public/room.html` 파일을 GitHub에서 직접 열어 183번 줄 근처를 수정하세요.

```html
<!-- 이 부분을 원하는 내용으로 수정하세요 -->
<h3 style="text-align:center;">Welcome!</h3>
<ul class="tip-list">
  <li>원하는 안내 문구를 여기에 작성하세요.</li>
</ul>
```

---

## 파일 구조

```
jukesync/
├── server.js          ← 서버 코드 (수정 불필요)
├── package.json       ← 의존성 목록 (수정 불필요)
├── .gitignore         ← Git 제외 목록 (수정 불필요)
├── public/
│   ├── index.html     ← 로비 화면
│   ├── room.html      ← 방 화면 (게스트 공지 수정 가능)
│   ├── favicon.svg    ← 브라우저 탭 아이콘
│   ├── robots.txt
│   ├── css/
│   │   └── style.css  ← 디자인 (수정 불필요)
│   └── js/
│       ├── room.js    ← 방 동작 코드 (수정 불필요)
│       └── themes.js  ← 테마 코드 (수정 불필요)
└── README.md
```

---

## 주의사항

- Render.com 무료 플랜은 15분간 접속이 없으면 서버가 잠시 잠듭니다.  
  서버가 항상 깨어있도록 셀프 핑 기능을 넣어놨습니다만, 가끔 접속 시 30초~1분 정도 로딩이 필요할수도 있습니다.
- 호스트 권한은 닉네임으로 구분됩니다. 방을 만들 때 쓴 닉네임을 기억해두세요.
