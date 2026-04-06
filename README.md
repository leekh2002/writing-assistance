# AI 글쓰기 피드백 웹 서비스

사용자가 주제별 글쓰기 문제를 선택해 글을 작성하고, AI 피드백과 점수를 확인하며, 누적 기록과 콘테스트까지 이용할 수 있는 웹 프로젝트입니다.

## 프로젝트 개요

이 프로젝트는 Express 기반 서버와 정적 HTML/CSS/JavaScript 프론트엔드로 구성되어 있습니다.  
회원가입과 로그인 후 글쓰기 문제를 선택할 수 있고, 작성한 글에 대해 AI 피드백을 받은 뒤 히스토리 페이지에서 누적 결과를 확인할 수 있습니다.  
또한 주기적으로 생성되는 콘테스트 문제를 통해 제한 시간 안에 글을 제출하는 기능도 포함되어 있습니다.

## 주요 기능

- 회원가입 및 로그인
- 카테고리별 글쓰기 문제 제공
- 하나의 문제에 대해 여러 개의 글 초안 작성 및 저장
- AI 기반 피드백 및 점수 확인
- 작성 기록 통계 시각화
- 주간 글쓰기 콘테스트 진행

## 기술 스택

- Backend: Node.js, Express
- Frontend: HTML, CSS, JavaScript
- Database: MySQL
- Libraries: `express-session`, `mysql2`, `chart.js`, `echarts`, `suneditor`, `node-cron`, `openai`, `socket.io`

## 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 데이터베이스 설정 확인

현재 프로젝트는 [`config/dbconfig.json`](./config/dbconfig.json)에 MySQL 접속 정보를 두고 있습니다.

```json
{
  "host": "DB_HOST",
  "user": "DB_USER",
  "password": "DB_PASSWORD",
  "database": "DB_NAME"
}
```

### 3. 서버 실행

```bash
node svr.js
```

### 4. 브라우저 접속

```text
http://localhost:3000/public/index.html
```

## 주요 화면

### 글 작성 페이지

문제 제목과 안내문을 확인한 뒤 에디터에서 글을 작성하고 제출할 수 있습니다.

<img width="999" height="548" alt="Image" src="https://github.com/user-attachments/assets/8176d85b-edc8-466a-b000-15c10b7582d0" />

### 피드백 결과 페이지

제출한 글에 대한 종합 점수와 항목별 AI 피드백을 확인할 수 있습니다.


<img width="988" height="557" alt="Image" src="https://github.com/user-attachments/assets/24a42fb5-8e29-4dae-9ff8-09d6d36f60ce" />

### 히스토리 페이지

카테고리별 작성 기록과 평균 점수, 전체 작성 수를 차트로 확인할 수 있습니다.


<img width="808" height="637" alt="Image" src="https://github.com/user-attachments/assets/cb076495-5eee-411c-b381-dff2053c83b8" />

## 디렉터리 구조

```text
.
├─ config/
│  └─ dbconfig.json
├─ public/
│  ├─ css/
│  ├─ images/
│  ├─ js/
│  ├─ index.html
│  ├─ home.html
│  ├─ writing.html
│  ├─ feedback.html
│  ├─ history.html
│  └─ contest.html
├─ svr.js
├─ package.json
└─ README.md
```

## 페이지 구성

- `index.html`: 로그인 페이지
- `signup.html`: 회원가입 페이지
- `home.html`: 메인 홈 화면
- `select_category.html`: 문제 카테고리 선택
- `writing.html`: 글 작성 페이지
- `feedback.html`: 피드백 결과 페이지
- `history.html`: 작성 기록 및 통계 페이지
- `contest.html`, `contest_home.html`: 콘테스트 페이지

## 참고 사항

- 서버 코드 기준으로 OpenAI API를 사용해 글쓰기 문제 생성 및 피드백 기능을 수행합니다.
- 콘테스트 문제와 일반 문제는 서버의 스케줄러(`node-cron`)를 통해 갱신됩니다.
- 실행을 위해서는 MySQL 데이터베이스와 관련 테이블이 미리 준비되어 있어야 합니다.
