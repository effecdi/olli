# 빠른 푸시 가이드

## 현재 상태
- ✅ 원격 저장소 URL 설정 완료: `https://github.com/effecdi/olli.git`
- ⚠️ 저장소를 찾을 수 없음 (아직 생성되지 않았거나 인증 필요)

## 해결 방법

### 옵션 1: GitHub에서 저장소 생성 (가장 간단)

1. **GitHub 저장소 생성**:
   - https://github.com/new 접속
   - **Repository name**: `olli`
   - **Description**: "OLLI - AI 웹툰 캐릭터 생성 서비스" (선택)
   - **Visibility**: 
     - ✅ Private (권장) - 비공개 저장소
     - 또는 Public - 공개 저장소
   - ⚠️ **"Initialize this repository with"** 체크하지 않음 (이미 로컬에 코드가 있음)
   - **Create repository** 클릭

2. **저장소 생성 후 푸시**:
   ```bash
   git push -u origin main
   ```

### 옵션 2: GitHub CLI 사용 (가장 빠름)

```bash
# GitHub CLI가 설치되어 있다면
gh repo create effecdi/olli --private --source=. --remote=origin --push
```

### 옵션 3: Personal Access Token으로 인증

저장소가 이미 존재하지만 Private인 경우:

1. **Personal Access Token 생성**:
   - GitHub → Settings → Developer settings
   - Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Note: `olli-push`
   - Expiration: 원하는 기간
   - Select scopes: `repo` 체크
   - Generate token 클릭
   - 토큰 복사 (한 번만 보임!)

2. **토큰으로 푸시**:
   ```bash
   git push -u origin main
   # Username: effecdi
   # Password: [생성한 Personal Access Token 붙여넣기]
   ```

### 옵션 4: SSH 키 사용

```bash
# SSH URL로 변경
git remote set-url origin git@github.com:effecdi/olli.git

# SSH 키가 설정되어 있다면
git push -u origin main
```

## 확인

푸시 성공 후:
- GitHub에서 확인: https://github.com/effecdi/olli
- 파일들이 업로드되었는지 확인

## 다음 단계

GitHub 푸시 완료 후:
1. Railway 배포: https://railway.app
2. GitHub 저장소 연결
3. 환경변수 설정
4. 테스트 URL 확인

자세한 내용은 `GITHUB_DEPLOY.md` 참고
