// sessionStorage에서 문제 데이터를 가져와 response 변수에 저장
const response = JSON.parse(sessionStorage.getItem('data'));

// .writing-info-section 클래스를 가진 요소를 선택
const writingInfoSection = document.querySelector('.writing-info-section');

// 문제 제목을 '.title' 클래스를 가진 요소에 삽입
document.querySelector('.title').innerHTML = response.problemTitle; 

// 문제 내용을 '.guide-section' 클래스를 가진 요소에 삽입
document.querySelector('.guide-section').innerHTML = response.problemContent;

// 작성한 글을 'writing-info-section'에 삽입
writingInfoSection.innerHTML = `<h2 style="font-weight: bold">작성한 글</h2>${response.writing}`;

// 피드백의 종합 점수를 'feedback-score' 클래스를 가진 요소에 삽입
document.querySelector(
  'div.feedback-score > h3'
).innerHTML = `종합 점수: ${response.feedback['총점']}/100`;

// 피드백 내용 평가항목별(어휘의 풍부성, 문장 구사력, 의도 표현력 등)로 생성하여 'feedback-content' 클래스를 가진 요소에 삽입
let i = 1;
let contentString = ''; // 피드백 내용을 저장할 문자열 변수
for (const key in response.feedback['피드백']) {
  contentString += `<p><strong>${key}</strong>: ${response.feedback['피드백'][key]}</p>`;
}

// 피드백 항목을 포함하는 HTML을 '.feedback-content'에 삽입
document.querySelector(
  '.feedback-content'
).innerHTML = `<h3>내용</h3>${contentString}`;

