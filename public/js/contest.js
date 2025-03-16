let problem = {}; // 문제 정보를 저장할 객체
let contestDay; // 대회가 진행될 요일
let contestStartHour; // 대회 시작 시간 (시)
let contestEndHour;  // 대회 종료 시간 (시)
const userId = sessionStorage.getItem('id');  // 유저 ID, 세션에서 가져옴

// 대회 날짜와 시간 정보를 서버에서 받아오는 함수
function getContestDate() {
  fetch('/process/getContestDate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then((res) => res.json())
    .then((data) => {
      contestDay=data.contestDay;
      contestStartHour=data.contestStartHour;
      contestEndHour=data.contestEndHour;
      startCountdown();
    })
}

// 목표 시간을 계산하는 함수 (대회 시작 또는 종료 시간)
function calculateTargetTime() {
  const now = new Date();
  let targetDate1 = new Date(now);
  targetDate1.setDate(now.getDate() + ((contestDay - now.getDay() + 7) % 7));
  targetDate1.setHours(contestStartHour, 0, 0, 0);

  let targetDate2 = new Date(targetDate1);
  targetDate2.setHours(contestEndHour, 0, 0, 0);

  // 현재 시간과 비교하여 대회 시작/종료 시간을 결정
  if (now < targetDate1) {
    return { date: targetDate1, isStart: false }; // 대회 시작 시간전
  } else if (now < targetDate2) {
    return { date: targetDate2, isStart: true }; // 대회 진행 중
  } else {
    // 대회가 끝났으면 다음 주 대회 시작 시간 설정
    targetDate1.setDate(targetDate1.getDate() + 7);
    return { date: targetDate1, isStart: false }; //대회 시작 전
  }
}

// 목표 시간까지 남은 시간을 계산하는 함수
function getTimeUntil(targetDate) {
  const now = new Date();
  const timeRemaining = targetDate - now; // 남은 시간 (밀리초 단위)

  const seconds = Math.floor((timeRemaining / 1000) % 60);
  const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds }; // 남은 시간 반환
}

// 카운트다운을 시작하고 주기적으로 업데이트하는 함수
function startCountdown() {
  function updateCountdown() {
    const { date, isStart } = calculateTargetTime();  // 대회 시작/종료 시간 확인
    const { days, hours, minutes, seconds } = getTimeUntil(date); // 남은 시간 계산
    if (isStart) {
       // 대회가 진행 중일 경우 남은 시간 표시
      document.querySelector('div.timer-section>span.time').textContent = `${
        hours > 0 ? hours : '0' + hours
      }:${minutes >= 10 ? minutes : '0' + minutes}:${
        seconds >= 10 ? seconds : '0' + seconds
      }`;
    } else {
      //대회 시간이 지났다면, 콘테스트 홈 페이지로 이동됨
      window.location.href='contest_home.html';
    }
  }

  // 1초마다 업데이트
  setInterval(updateCountdown, 1000);

  // 즉시 초기값 표시
  updateCountdown();
}

// 서버에서 문제 데이터를 가져오는 함수
function getProblem() {
  fetch('/process/getproblem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categories: 'contest',  // 대회 카테고리 문제 요청
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      problem = data[0];
      document.querySelector('.title').innerHTML = problem.title; // 제목 표시
      document.querySelector('.guide-section').innerHTML = problem.content; // 문제 내용 표시
    });
}

// 제출 버튼 클릭 시 대회 참가 글 작성 및 제출 처리
document.querySelector('.submit').addEventListener('click', async (event) => {
  const now = new Date();
  const baseTime = new Date();
  baseTime.setHours(contestStartHour, 0, 0, 0); // 대회 시작 시간 설정
  if (now < baseTime) {
    baseTime.setDate(baseTime.getDate() - 1); // 대회 시작 시간이 지나지 않았다면 하루 전으로 설정
  }
  const diffInMillis = now - baseTime;  // 현재 시간과 대회 시작 시간 차이 계산
  const submitHours = Math.floor(diffInMillis / (1000 * 60 * 60));
  const submitMinutes = Math.floor(
    (diffInMillis % (1000 * 60 * 60)) / (1000 * 60)
  );
  const submitSeconds = Math.floor((diffInMillis % (1000 * 60)) / 1000);
  const problemTitle = document.querySelector('.title').innerHTML;
  const problemContent = document.querySelector('.guide-section').innerHTML;
  const writing = document.querySelector('div.se-wrapper > div').innerHTML;

  // 문제정보와 작성된 글, 제출 시간 등을 서버에 전송
  fetch('/process/submitContest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problemTitle: problemTitle,
      problemContent: problemContent,
      writing: writing,
      userId: userId,
      submitTime: `${submitHours}:${submitMinutes}:${submitSeconds}`,
    }),
  })
  .then((res) => {
    window.location.href = 'contest_home.html'; // 제출 후 홈 페이지로 리디렉션
  });
});

// 서버에서 대회 정보와 문제를 가져오는 함수 호출
getContestDate()
getProblem();
