// 세션 저장소에서 'data' 항목을 가져와 JSON으로 파싱하여 'response'에 저장
const response = JSON.parse(sessionStorage.getItem('data'));

// 'writing-info-section' 요소를 선택
const writingInfoSection = document.querySelector('.writing-info-section');

// 문제 제목과 문제 내용을 해당 HTML 요소에 설정
document.querySelector('.title').innerHTML = response.problemTitle;
document.querySelector('.guide-section').innerHTML = response.problemContent;

// 'writing-list' 선택 요소를 선택
const select = document.getElementById('writing-list');

let index = 1;
// 'response.writings' 배열을 순회하여 작성한 글 목록을 'select' 요소에 추가
for (let data of response.writings) {
  const option = document.createElement('option');
  option.value = index; // option의 값으로 index 설정
  option.textContent = `작성한 글${index++}`; // option 텍스트로 '작성한 글1', '작성한 글2' 등 설정
  select.appendChild(option); // 'select' 요소에 추가
}

// 글 내용과 피드백을 설정하는 함수
function setHtml(idx) {
  // 선택한 글의 피드백을 JSON으로 파싱
  const feedback = JSON.parse(response.writings[idx].feedback);
  
  // 'writing-info-section'에 해당 글의 내용을 설정
  writingInfoSection.innerHTML = `<h2 style="font-weight: bold">작성한 글</h2>${response.writings[idx].content}`;

  // 피드백을 담을 문자열 초기화
  contentString = '';

  // 해당 글의 종합 점수를 설정
  document.querySelector(
    'div.feedback-score > h3'
  ).innerHTML = `종합 점수: ${response.writings[idx].score}/100`;

  // 피드백 내용을 HTML로 설정
  for (const key in feedback) {
    contentString += `<p><strong>${key}</strong>: ${feedback[key]}</p>`;
  }

   // 피드백 내용을 'feedback-content'에 추가
  document.querySelector(
    '.feedback-content'
  ).innerHTML = `<h3>내용</h3>${contentString}`;
}

// 페이지 로드 시 보여줄 글 내용 및 피드백을 첫 번째 글로 설정
setHtml(0);


// 'writing-list' 선택 요소에서 변경 이벤트가 발생하면 글을 변경하여 표시
select.addEventListener('change', (event) => {

  // 선택한 글 번호에 해당하는 글을 표시
  setHtml(Number(event.target.value) - 1)
});

