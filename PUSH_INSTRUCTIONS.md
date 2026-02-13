# GitHub 푸시 가이드

## 현재 상태
- ✅ 커밋 완료: 모든 변경사항이 로컬에 커밋됨
- ⚠️ 원격 저장소 URL이 플레이스홀더로 설정됨

## GitHub 푸시 방법

### 방법 1: 실제 GitHub 저장소 URL로 변경 후 푸시

1. **GitHub에서 저장소 생성** (아직 안 했다면):
   - https://github.com/new 접속
   - 저장소 이름 입력 (예: `olli-project`)
   - Private 또는 Public 선택
   - "Initialize this repository" 체크하지 않음
   - Create repository 클릭

2. **원격 저장소 URL 변경**:
   ```bash
   # 기존 origin 제거
   git remote remove origin
   
   # 실제 GitHub 저장소 URL로 추가 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   
   # 또는 SSH 사용 시:
   git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

3. **GitHub 인증 설정**:
   
   **옵션 A: Personal Access Token 사용 (HTTPS)**
   ```bash
   # 푸시 시 사용자명과 토큰 입력 요청됨
   git push -u origin main
   # Username: YOUR_GITHUB_USERNAME
   # Password: YOUR_PERSONAL_ACCESS_TOKEN (비밀번호 아님!)
   ```
   
   Personal Access Token 생성:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token → `repo` 권한 선택 → 생성
   
   **옵션 B: SSH 키 사용**
   ```bash
   # SSH 키가 설정되어 있다면
   git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 방법 2: GitHub CLI 사용 (가장 간단)

```bash
# GitHub CLI 설치되어 있다면
gh repo create olli-project --private --source=. --remote=origin --push
```

### 방법 3: GitHub Desktop 사용

1. GitHub Desktop 앱 열기
2. File → Add Local Repository
3. 프로젝트 폴더 선택
4. Publish repository 클릭

## 확인

푸시 성공 후:
```bash
git remote -v
# origin이 올바른 GitHub URL을 가리키는지 확인

# GitHub 웹사이트에서 저장소 확인
# https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
```

## 다음 단계

GitHub 푸시 완료 후:
1. Railway 배포: https://railway.app
2. GitHub 저장소 연결
3. 환경변수 설정
4. 테스트 URL 확인

자세한 내용은 `GITHUB_DEPLOY.md` 참고
