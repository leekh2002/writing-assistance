let scoreBoard; //스코어보드 저장
let contestRound; //현재 대회 회차
let contestDay; //대회 요일
let contestStartHour; //대회 시작 시간
let contestEndHour; //대회 종료 시간
let participationStatus = true; // 현재 사용자의 대회 참가 가능 여부
const userId = sessionStorage.getItem('id'); //유저 id

// 서버에서 대회 날짜 및 시간 정보를 가져옴
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
      startCountdown(); // 남은 시간 카운트다운 시작
    })
}

// 현재 시간에 따라 목표 시간(대회 시작/종료 시간) 계산
function calculateTargetTime() {
  const now = new Date(); //현재 시간
  let targetDate1 = new Date(now);
  targetDate1.setDate(now.getDate() + ((contestDay - now.getDay() + 7) % 7)); // 다음 대회 요일로 이동
  targetDate1.setHours(contestStartHour, 0, 0, 0);  // 시작 시간 설정

  let targetDate2 = new Date(targetDate1);
  targetDate2.setHours(contestEndHour, 0, 0, 0);  // 종료 시간 설정

  // 현재 시간 기준으로 목표 시간을 결정
  if (now < targetDate1) {
    return { date: targetDate1, isStart: false }; // 대회 시작 전
  } else if (now < targetDate2 && !participationStatus) {
    return { date: targetDate2, isStart: true }; // 대회 진행 중
  } else {
    // 대회가 종료되었으면 다음 주 대회로 목표 시간 설정
    targetDate1.setDate(targetDate1.getDate() + 7);
    return { date: targetDate1, isStart: false };
  }
}

// 목표 시간까지 남은 시간을 계산
function getTimeUntil(targetDate) {
  const now = new Date();
  const timeRemaining = targetDate - now; // 남은 시간 (밀리초 단위)

  const seconds = Math.floor((timeRemaining / 1000) % 60);  //초 단위 계산
  const minutes = Math.floor((timeRemaining / 1000 / 60) % 60); // 분 단위 계산
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);  // 시간 단위 계산
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24)); // 일 단위 계산

  return { days, hours, minutes, seconds }; // 남은 시간 반환
}

// 카운트다운 시작
function startCountdown() {
  function updateCountdown() {
    setBtn(participationStatus);  //참가 버튼 상태 업데이트
  }

  // 1초마다 업데이트
  setInterval(updateCountdown, 1000);

  // 즉시 초기값 표시
  updateCountdown();
}

// 점수판 데이터를 HTML 테이블에 표시
function displayScoreboard(scoreBoard) {
  const tbody = document.querySelector('table.scoreboard > tbody');
  tbody.innerHTML = ''; // 기존 테이블 내용 초기화
  for (let i = 0; i < scoreBoard.length; i++) {
    const user = scoreBoard[i].user_name; //사용자 이름
    const submitTime = scoreBoard[i].submit_time; //제출 시간
    const score = scoreBoard[i].score;  //점수
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${
      i + 1
    }</td><td>${user}</td><td>${score}</td><td>${submitTime}</td>`; //테이블 행 생성
    tbody.appendChild(tr);  //테이블에 추가
  }
}

//대회 참가 가능 여부(state)를 인자로 받아 버튼 상태 조정
function setBtn(participationStatus) {
  const { date, isStart } = calculateTargetTime(); // 목표 시간 계산
  const { days, hours, minutes, seconds } = getTimeUntil(date);
  const countdownElement = document.querySelector('.join-contest-btn');
  countdownElement.disabled = true; // 기본적으로 버튼 비활성화
  if (!isStart || participationStatus)
    countdownElement.textContent = `다음 대회까지: ${days}일 ${hours}시간 ${minutes}분 ${seconds}초`; // 남은 시간 표시
  else {  //참가 버튼 활성화
    countdownElement.textContent = '참가하기';  
    countdownElement.disabled = false;
  }
}

// 현재 사용자의 점수 정보를 업데이트
function setMyInfo(scoreBoard) {
  console.log(scoreBoard);
  for (let i = 0; i < scoreBoard.length; i++) {
    console.log(scoreBoard[i].user_name);
    if (scoreBoard[i].user_name == userId) {  // 사용자 ID와 일치하는 정보 찾기
      document.querySelector(
        'div.my-score-section > div > span'
      ).textContent = `${scoreBoard[i].score}/100`; // 점수 표시
      document.querySelector(
        'div.my-submittime-section > div > span'
      ).textContent = scoreBoard[i].submit_time;  // 제출 시간 표시
      document.querySelector(
        'div.my-ranking-section > div > span'
      ).textContent = `${i + 1}위`; // 순위 표시
      return;
    }
  }

  // 점수가 없을 경우 기본값 표시
  document.querySelector(
    'div.my-score-section > div > span'
  ).textContent = `-/100`;
  document.querySelector('div.my-submittime-section > div > span').textContent =
    '- : - : -';
  document.querySelector(
    'div.my-ranking-section > div > span'
  ).textContent = `-위`;
}

// 사용자의 대회 참가 여부를 서버에서 확인
function checkParticipation() {
  fetch('/process/checkParticipation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      participationStatus = data.result;  // 참가 가능 여부 설정
      setBtn(participationStatus);  // 버튼 상태 업데이트
    });
}

// 서버에서 점수판 데이터를 가져오고 UI를 업데이트
function setScoreboard() {
  fetch('/process/getScoreboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then((res) => res.json())
    .then((data) => {
      const round = Number(data.round); // 현재 대회 회차
      scoreBoard = new Array(round + 1);  // 회차별 점수판 배열 초기화
      console.log(data.scoreBoard);
      document.getElementById('contest-round').innerHTML = '';  // select box초기화
      for (let i = 1; i <= round; i++) {
        scoreBoard[i] = []; // 각 회차 점수판 초기화
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}회`;
        option.selected = true;
        document.getElementById('contest-round').appendChild(option); // select box에 추가
      }

      for (let element of data.scoreBoard) {
        //console.log(scoreBoard.length);
        scoreBoard[Number(element.round)].push(element);  // scoreBoard배열에 회차별로 정보 저장
      }
      console.log(scoreBoard);
      document.querySelector(
        'div.container > h1'
      ).textContent = `제 ${round}회 글쓰기 콘테스트`;  // 대회 제목 설정
      displayScoreboard(scoreBoard[round]); // 현재 회차 점수판 표시
      setMyInfo(scoreBoard[round]); // 현재 사용자 정보 업데이트
    });
}

// 참가 버튼 클릭 시 대회 페이지로 이동
document
  .querySelector('.join-contest-btn')
  .addEventListener('click', (event) => {
    window.location.href = 'contest.html';
  });

// select box에서 회차 선택 시 점수판 업데이트
document.getElementById('contest-round').addEventListener('change', (event) => {
  displayScoreboard(scoreBoard[event.target.value]);  // 선택한 회차 점수판 표시
  setMyInfo(scoreBoard[event.target.value]);  // 선택한 회차 사용자 정보 표시
});

// 초기 데이터 로드
getContestDate();
checkParticipation();
setScoreboard();