let userId = sessionStorage.getItem('id');  //세션스토리지에서 유저정보를 가져와 저장

// 문제 카테고리별로 문제를 저장할 객체 초기화
let problems = {
  인문학: [],
  사회과학: [],
  자연과학: [],
};

// 작성된 글을 카테고리별로 저장할 객체 초기화
let writings = {
  인문학: [],
  사회과학: [],
  자연과학: [],
};

// 해당 사용자가 푼 모든 문제를 가져와 'problems' 객체에 추가하는 함수
function setWritings() {
  fetch('/process/getAllProblems', {
    method: 'POST',
    body: JSON.stringify({
      id: userId,
    }), 
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // 각 문제를 문제 카테고리별로 'problems' 객체에 추가
      for (let problem of data) {
        problems[problem.category].push({
          category: problem.category,
          title: problem.title,
          content: problem.content,
          pid: problem.pid,
        });
      } 
      // 각 카테고리의 문제 목록을 페이지에 표시
      pushProblemList('인문학');
      pushProblemList('자연과학');
      pushProblemList('사회과학');
    });
}

// 카테고리별 문제 목록을 페이지에 동적으로 추가하는 함수
function pushProblemList(targetCategory) {
  let index = 0;
  // 지정된 카테고리의 모든 문제를 반복하여 목록에 추가
  for (let element of problems[targetCategory]) {
    let a = document.createElement('a');
    a.className = 'problem';  // 클래스 지정
    a.textContent = element.title;  
    a.href = `writing_info.html`; // 문제 클릭 시 이동할 페이지 설정
    document.querySelector('.problems').appendChild(a); // 문제 목록에 링크 추가

    // 문제를 클릭했을 때 작성된 글 정보를 sessionStorage에 저장하는 이벤트 리스너
    a.addEventListener('click', (event) => {
      // 사용자가 선택한 문제에 대해서 작성한 글들을 서버에서 가져옴
      fetch('/process/getWriting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pid: element.pid,
          id: userId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const res = {
            problemTitle: element.title,
            problemContent: element.content,
            writings: data,
          };
          sessionStorage.setItem('data', JSON.stringify(res));  // 데이터를 세션 스토리지에 저장
        });
    });
  }
}

// 사용자의 모든 작성된 글을 가져오는 함수
function getAllWritings() {
  console.log('id: ',userId);
  fetch('/process/getAllWritings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: userId,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // 각 카테고리별로 작성된 글을 writings 객체에 추가
      for (let element of data) {
        writings[element.category].push(element);
      }
      setChart(); // 데이터를 기반으로 차트 업데이트
    });
}

// 특정 카테고리의 평균 점수를 계산하는 함수
function getAverage(category) {
  let average = 0,
    sum = 0;

  // 카테고리 내 모든 글의 점수를 합산
  for (let writing of writings[category]) {
    sum += writing.score;
  }

   // 글이 존재할 경우 평균 계산
  if (writings[category].length != 0) average = sum / writings[category].length;
  return { average: average, sum: sum };  // 평균과 총합 반환
}


// 차트를 설정하는 함수
function setChart() {
  let allAverage = 0,
    average1 = 0,
    average2 = 0,
    average3 = 0;

  // 전체 글 수 계산
  let lengthSum =
    writings['인문학'].length +
    writings['사회과학'].length +
    writings['자연과학'].length;

  // 각 카테고리별 평균 점수 계산
  average1 = getAverage('인문학');
  average2 = getAverage('자연과학');
  average3 = getAverage('사회과학');

  // 전체 평균 점수 계산
  if (lengthSum != 0)
    allAverage = (average1.sum + average2.sum + average3.sum) / lengthSum;

  // 화면에 총 작성된 글 수 표시
  document.querySelector('.sum-score').textContent = lengthSum;

  // 각 카테고리의 평균 점수 설정
  average1 = average1.average;
  average2 = average2.average;
  average3 = average3.average;

  // 문제 카테고리별 작성한 글 수에 대한 파이 차트 데이터
  const problemCountData = {
    labels: ['인문학', '자연과학', '사회과학'],
    datasets: [
      {
        data: [
          writings['인문학'].length,
          writings['자연과학'].length,
          writings['사회과학'].length,
        ],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
        ],
      },
    ],
  };
  const problemCountConfig = {
    type: 'pie',
    data: problemCountData,
  };

  // 문제 카테고리별 개수를 표시할 차트
  const ctx = document.getElementById('problem-count-chart');
  new Chart(ctx, problemCountConfig);

  // 평균 점수에 대한 bar 차트 데이터
  const scoreAveragedata = {
    labels: ['인문학', '자연과학', '사회과학', '전체'],
    datasets: [
      {
        label: '평균 점수',
        data: [average1, average2, average3, allAverage],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(255, 138, 16, 0.2)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(255, 138, 16)',
        ],
        borderWidth: 1,
      },
    ],
  };
  const scoreAverageConfig = {
    type: 'bar',
    data: scoreAveragedata,
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };
  // 평균 점수를 표시할 차트
  const ctx2 = document.getElementById('score-average-chart');
  new Chart(ctx2, scoreAverageConfig);
}

// 페이지 로드 시 모든 작성된 글과 문제 데이터를 가져옴
getAllWritings();
setWritings();

// 카테고리 변경 시 해당 카테고리의 문제 목록만 표시하도록 이벤트 리스너 설정
document.getElementById('category').addEventListener('change', (event) => {
  document.querySelector('.problems').innerHTML = ''; // 문제 목록 초기화

  // 선택된 카테고리가 없으면 모든 카테고리의 문제 목록을 표시
  if (problems[event.target.value] == undefined) {
    pushProblemList('인문학');
    pushProblemList('자연과학');
    pushProblemList('사회과학');
  } else {
     // 선택된 카테고리의 문제 목록만 표시
    pushProblemList(event.target.value);
  }
});
