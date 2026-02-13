# 배포 가이드

이 문서는 OLLI 프로젝트를 Railway에 배포하는 방법을 안내합니다.

## 1. GitHub 저장소 준비

### 1-1. 불필요한 파일 정리

배포 전에 다음 파일/폴더를 제거하거나 `.gitignore`에 추가하세요:

- `.config/`, `.local/` (환경 의존 파일)
- `attached_assets/*.zip` (대용량 파일, 코드에서 import하는 파일만 남기기)
- `.git/` (Replit 내부 git이 있으면 충돌 가능)

### 1-2. .gitignore 확인

`.gitignore`에 다음이 포함되어 있는지 확인하세요:

```
# replit / local
.config/
.local/
replit*
*.tar.gz

# build
dist/
node_modules/

# large assets
attached_assets/*.zip

# environment variables
.env
.env.local
.env.*.local
```

### 1-3. GitHub 저장소 생성 및 업로드

1. GitHub에서 새 저장소 생성 (Private 권장)
2. 로컬에서 다음 명령 실행:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

## 2. 환경변수 설정

### 2-1. 서버 환경변수 (Railway Secrets)

Railway의 **Secrets** 탭에 다음을 설정하세요:

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `DATABASE_URL` | Supabase Postgres 연결 문자열 | ✅ 필수 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `SUPABASE_KEY` | Supabase 서비스 역할 키 (서버 전용) | ✅ 필수 |
| `PORTONE_API_KEY` | PortOne API 키 | ✅ 필수 (결제 사용 시) |
| `PORTONE_API_SECRET` | PortOne API 시크릿 | ✅ 필수 (결제 사용 시) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API 키 | 선택 |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini API 베이스 URL | 선택 |
| `PORT` | 서버 포트 (기본값: 5000) | 선택 |
| `NODE_ENV` | 환경 모드 (production) | 선택 |

### 2-2. 클라이언트 환경변수 (Railway Variables)

Railway의 **Variables** 탭에 다음을 설정하세요:

⚠️ **주의**: `VITE_` 접두사가 붙은 값은 클라이언트 번들에 포함되므로 **공개값만** 사용하세요!

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL (공개값) | ✅ 필수 |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon 키 (공개값) | ✅ 필수 |
| `VITE_PORTONE_MERCHANT_ID` | PortOne 가맹점 ID (공개값) | 선택 (결제 사용 시) |

## 3. 데이터베이스 설정 (Supabase)

### 3-1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 키 확인:
   - **Project URL**: `SUPABASE_URL`, `VITE_SUPABASE_URL`에 사용
   - **Anon Key**: `VITE_SUPABASE_ANON_KEY`에 사용
   - **Service Role Key**: `SUPABASE_KEY`에 사용 (서버 전용)

### 3-2. DATABASE_URL 확보

1. Supabase 대시보드 → **Database** → **Connection string**
2. **URI** 형식 선택
3. 연결 문자열을 `DATABASE_URL`로 Railway에 설정

### 3-3. 스키마 반영

로컬 또는 Railway 쉘에서 실행:

```bash
npm run db:push
```

## 4. Railway 배포

### 4-1. 프로젝트 생성

1. [Railway](https://railway.app) 로그인
2. **New Project** 클릭
3. **Deploy from GitHub Repo** 선택
4. 저장소 선택 → 자동 빌드 감지 (Node.js)

### 4-2. 빌드/시작 명령 확인

Railway 설정에서:

- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

### 4-3. 환경변수 설정

위의 **2. 환경변수 설정** 섹션을 참고하여 Variables와 Secrets를 설정하세요.

### 4-4. 항상 켜짐 설정

⚠️ **중요**: Serverless/App Sleeping 기능이 **꺼져 있는지** 확인하세요.

- Railway 대시보드에서 **Settings** → **Deploy** 확인
- **App Sleeping** 또는 **Serverless** 옵션이 켜져 있으면 끄기
- 배포 후 URL 접속하여 새로고침 여러 번 테스트

### 4-5. 비용 폭주 방지

1. Railway 대시보드 → **Workspace** → **Usage Limits**
2. **Hard limit** 설정 (예: 월 $10~20)
3. 75%/90%/100% 알림 설정

## 5. 헬스체크 엔드포인트

배포 후 다음 엔드포인트로 서버 상태 확인:

```
GET /api/health
```

응답:
```json
{
  "ok": true,
  "timestamp": "2026-02-13T12:00:00.000Z"
}
```

## 6. 결제 설정 (PortOne)

### 6-1. PortOne 계정 설정

1. [PortOne](https://portone.io) 가입 및 가맹점 등록
2. **가맹점 식별자** 확인 → `VITE_PORTONE_MERCHANT_ID`에 설정
3. **API 키/시크릿** 확인 → `PORTONE_API_KEY`, `PORTONE_API_SECRET`에 설정

### 6-2. 웹훅 설정 (선택사항)

PortOne 대시보드에서 웹훅 URL 설정:

```
https://your-domain.railway.app/api/payment/webhook
```

웹훅은 결제 상태 변경 알림을 받기 위한 것이며, 실제 결제 처리는 `/api/payment/complete`에서 수행됩니다.

### 6-3. 결제 금액 검증

서버에서 다음 금액을 검증합니다:

- **Pro 멤버십**: 19,900원
- **크레딧 50개**: 4,900원

금액이 일치하지 않으면 결제가 거부됩니다.

## 7. 모니터링

### 7-1. Uptime 모니터링

[UptimeRobot](https://uptimerobot.com) 또는 [BetterStack](https://betterstack.com) 설정:

- URL: `https://your-domain.railway.app/api/health`
- 간격: 1~5분
- 알림: 이메일/슬랙

### 7-2. 로그 확인

Railway 대시보드 → **Deployments** → **Logs**에서 확인:

- 500 에러
- 타임아웃
- 급증 트래픽
- AI 호출 폭증

## 8. 배포 후 체크리스트

- [ ] 환경변수 모두 설정 완료
- [ ] 데이터베이스 스키마 반영 (`npm run db:push`)
- [ ] 헬스체크 엔드포인트 동작 확인 (`/api/health`)
- [ ] 로그인/인증 플로우 테스트
- [ ] 결제 플로우 테스트 (테스트 모드)
- [ ] 이미지 생성 플로우 테스트
- [ ] Railway Hard limit 설정 완료
- [ ] Uptime 모니터링 설정 완료

## 9. 트러블슈팅

### 서버가 시작되지 않음

- `DATABASE_URL`이 설정되었는지 확인
- Railway 로그에서 에러 메시지 확인
- 빌드가 성공했는지 확인 (`npm run build` 로컬 테스트)

### 결제 검증 실패

- `PORTONE_API_KEY`, `PORTONE_API_SECRET` 확인
- PortOne 대시보드에서 API 키 상태 확인
- 결제 금액이 정확한지 확인 (19,900원 또는 4,900원)

### 클라이언트에서 환경변수 미적용

- `VITE_` 접두사 확인
- Railway Variables에 설정했는지 확인 (Secrets가 아님)
- 빌드 후 재배포 필요

## 10. 릴리즈 프로세스

### 개발 → 운영 배포

1. `main` 브랜치에 푸시
2. Railway 자동 배포 트리거
3. 배포 완료 후 핵심 플로우 수동 테스트
4. 문제 발생 시 Railway에서 롤백

### DB 스키마 변경 시

1. 로컬에서 스키마 수정
2. `npm run db:push` 실행하여 변경사항 확인
3. Railway 쉘에서 `npm run db:push` 실행
4. 또는 Railway에서 직접 SQL 실행

## 참고 자료

- [Railway 문서](https://docs.railway.app)
- [Supabase 문서](https://supabase.com/docs)
- [PortOne 문서](https://developers.portone.io)
- [Drizzle ORM 문서](https://orm.drizzle.team)
