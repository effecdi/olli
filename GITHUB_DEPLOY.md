# GitHub 업로드 및 Railway 배포 가이드

## 1. GitHub 저장소 생성 및 업로드

### 1-1. GitHub에서 새 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 **+** 버튼 → **New repository** 클릭
3. 저장소 설정:
   - **Repository name**: `olli-project` (또는 원하는 이름)
   - **Description**: "OLLI - AI 웹툰 캐릭터 생성 서비스"
   - **Visibility**: Private (권장) 또는 Public
   - **Initialize this repository with**: 체크하지 않음 (이미 로컬에 코드가 있음)
4. **Create repository** 클릭

### 1-2. 로컬에서 GitHub 저장소 연결 및 푸시

터미널에서 다음 명령 실행:

```bash
cd /Users/ihyeonjeong/olli_project

# GitHub 저장소 URL을 origin으로 추가 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 또는 SSH 사용 시:
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# 현재 브랜치 확인
git branch

# GitHub에 푸시
git push -u origin main
```

**참고**: GitHub 저장소 URL은 저장소 생성 후 표시되는 페이지에서 확인할 수 있습니다.

## 2. Railway 배포 (테스트 URL 생성)

### 2-1. Railway 계정 생성 및 로그인

1. [Railway](https://railway.app) 접속
2. **Login** 클릭 → GitHub 계정으로 로그인

### 2-2. 새 프로젝트 생성

1. Railway 대시보드에서 **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. GitHub 저장소 목록에서 방금 생성한 저장소 선택
4. Railway가 자동으로 빌드 시작

### 2-3. 환경변수 설정

Railway 대시보드에서 프로젝트 선택 → **Variables** 탭 클릭

#### 서버 환경변수 (Secrets)

**Settings** → **Variables** → **New Variable** 클릭하여 다음 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Supabase에서 가져온 DB 연결 문자열 |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | `eyJ...` | Supabase Service Role Key |
| `PORTONE_API_KEY` | `...` | PortOne API 키 (결제 사용 시) |
| `PORTONE_API_SECRET` | `...` | PortOne API 시크릿 (결제 사용 시) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | `...` | Gemini API 키 (선택) |
| `NODE_ENV` | `production` | 환경 모드 |

#### 클라이언트 환경변수 (Variables)

**Settings** → **Variables** → **New Variable** 클릭하여 다음 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL (공개값) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Anon Key (공개값) |
| `VITE_PORTONE_MERCHANT_ID` | `imp00000000` | PortOne 가맹점 ID (공개값) |

### 2-4. 빌드 설정 확인

**Settings** → **Deploy**에서 확인:

- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

### 2-5. 배포 완료 및 테스트 URL 확인

1. 배포가 완료되면 Railway 대시보드에서 **Settings** → **Domains** 확인
2. 자동 생성된 URL 예시: `https://your-project-name.up.railway.app`
3. 테스트:
   ```bash
   curl https://your-project-name.up.railway.app/api/health
   ```
   응답: `{"ok":true,"timestamp":"..."}`

### 2-6. 커스텀 도메인 설정 (선택사항)

**Settings** → **Domains** → **Generate Domain** 클릭하여 더 읽기 쉬운 URL 생성 가능

## 3. Supabase 데이터베이스 설정

### 3-1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `olli-project`
   - **Database Password**: 강력한 비밀번호 설정 (기록해두기)
   - **Region**: 가장 가까운 지역 선택
4. **Create new project** 클릭 (생성에 몇 분 소요)

### 3-2. DATABASE_URL 확보

1. Supabase 대시보드 → **Project Settings** → **Database**
2. **Connection string** 섹션에서 **URI** 탭 선택
3. 연결 문자열 복사 (예: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
4. Railway의 `DATABASE_URL`에 붙여넣기

### 3-3. Supabase 키 확인

1. **Project Settings** → **API**
2. **Project URL** → Railway의 `SUPABASE_URL` 및 `VITE_SUPABASE_URL`에 설정
3. **anon public** 키 → Railway의 `VITE_SUPABASE_ANON_KEY`에 설정
4. **service_role** 키 → Railway의 `SUPABASE_KEY`에 설정 (서버 전용, 절대 공개하지 말 것!)

### 3-4. 데이터베이스 스키마 반영

Railway 대시보드에서:

1. 프로젝트 선택 → **Deployments** → 최신 배포 클릭
2. **View Logs** 클릭
3. **Connect via Railway CLI** 또는 **Shell** 탭에서:

```bash
npm run db:push
```

또는 로컬에서 실행 (DATABASE_URL 설정 후):

```bash
DATABASE_URL="your-database-url" npm run db:push
```

## 4. 배포 확인 체크리스트

- [ ] GitHub 저장소에 코드 업로드 완료
- [ ] Railway 프로젝트 생성 및 GitHub 연결 완료
- [ ] 모든 환경변수 설정 완료
- [ ] 배포 성공 확인 (Railway 로그 확인)
- [ ] 헬스체크 엔드포인트 동작 확인 (`/api/health`)
- [ ] 데이터베이스 스키마 반영 완료 (`npm run db:push`)
- [ ] 브라우저에서 테스트 URL 접속 확인

## 5. 트러블슈팅

### 배포 실패 시

1. Railway 로그 확인: **Deployments** → 최신 배포 → **View Logs**
2. 빌드 에러 확인: `npm ci && npm run build` 로컬에서 테스트
3. 환경변수 누락 확인: `.env.example` 참고

### 데이터베이스 연결 실패 시

1. `DATABASE_URL` 형식 확인 (URI 형식이어야 함)
2. Supabase에서 연결 문자열 재확인
3. Railway에서 `DATABASE_URL` 재설정

### 헬스체크는 되지만 다른 API가 안 될 때

1. 데이터베이스 스키마 반영 확인 (`npm run db:push`)
2. 환경변수 누락 확인 (특히 `SUPABASE_URL`, `SUPABASE_KEY`)

## 6. 다음 단계

배포 완료 후:

1. **모니터링 설정**: UptimeRobot으로 `/api/health` 모니터링
2. **비용 관리**: Railway Hard limit 설정 (월 $10~20 권장)
3. **도메인 연결**: 커스텀 도메인 설정 (선택사항)
4. **SSL 인증서**: Railway가 자동으로 처리

## 참고 링크

- [Railway 문서](https://docs.railway.app)
- [Supabase 문서](https://supabase.com/docs)
- [GitHub 문서](https://docs.github.com)
