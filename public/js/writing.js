const userId = sessionStorage.getItem('id'); //유저 id
const urlParams = new URLSearchParams(window.location.search); //URL의 파라미터값 read
const category = urlParams.get('category'); //이전페이지에서 선택한 문제의 카테고리
let index = urlParams.get('index'); //해당 카테고리의 문제중, 몇번째 문제인지 식별하기 위한 변수
let writings = []; //서버로부터 받아온 글 정보를 저장하는 배열

//사용자가 작성한 글 정보를 가져오는 함수
function setWritings() {
  //서버의 '/process/getWritingsByCategoryAndIndex'경로로 POST방식으로 데이터 요청
  fetch('/process/getWritingsByCategoryAndIndex', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: category,
      id: userId,
      index: index,
    }),
  })
    .then((res) => res.json()) //받아온 데이터를 json으로 파싱
    .then((data) => {
      document.querySelector('.title').innerHTML = data.problem.title; //페이지의 문제제목 표기 부분을 서버로부터 받아온 문제 제목으로 변경
      document.querySelector('.guide-section').innerHTML = data.problem.content; //페이지의 문제 설명 부분을 서버로부터 받아온 문제 내용으로 변경
      let idx = 1;

      //서버로부터 받아온 writing정보를 순차적으로 탐색하여 글 목록 select박스에 옵션들 추가
      for (let writing of data.writing) {
        writings.push(writing.content);
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `작성한 글${idx++}`;
        option.selected = true;
        document.querySelector('div.se-wrapper > div').innerHTML =
          writing.content; //작성한 글 표기 부분을 writing.content로 변경(페이지 로드시, 항상 마지막 옵션의 글 내용으로 표기)
        document.getElementById('writing-list').appendChild(option);
      }
      //writing정보가 없을 경우에 select박스에 옵션을 한개만 추가
      if (data.writing.length == 0) {
        const option = document.createElement('option');
        option.value = 1;
        option.textContent = `작성한 글1`;
        option.selected = true;
        document.getElementById('writing-list').appendChild(option);
      }
    });
}

//이전에 작성한 글을 writings배열에 업데이트
function setBeforeWriting() {
  let beforeSelect;
  let beforeContent;
  beforeSelect = document.getElementById('writing-list').value;
  beforeContent = document.querySelector('div.se-wrapper > div').innerHTML;  
  console.log('before: ', beforeContent);
  writings[beforeSelect - 1] = beforeContent;
}
setWritings(); //초기에 글 정보를 writings배열을 세팅함

//select박스 focus시, 글 내용을 writings배열에 업데이트(옵션 변경전 현재까지 작성한 글을 저장하기 위함)
document.getElementById('writing-list').addEventListener('focus', (event) => {
  setBeforeWriting();
});

//다른 글로 옵션 변경시, 글 내용을 선택된 글로 업데이트
document.getElementById('writing-list').addEventListener('change', (event) => {
  console.log(document.querySelector('div.se-wrapper>div'));

  document.querySelector('div.se-wrapper > div').innerHTML =
    writings[event.target.value - 1];
});

//글 추가버튼 클릭시
document
  .querySelector('.writing-list-add')
  .addEventListener('click', (event) => {
    setBeforeWriting();
    const selectElement = document.getElementById('writing-list');
    const option = document.createElement('option');
    option.value = selectElement.options.length + 1;
    option.textContent = `작성한 글${option.value}`;
    option.selected = true;

    //추가된 글정보를 db에 추가
    fetch('/process/addWriting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: category, //선택된 문제 카테고리
        index: index, //몇번째 문제인지
        wid: option.value, //글을 식별하기 위한 id
        id: userId, //유저 정보
      }),
    });
    document.getElementById('writing-list').appendChild(option);  //select박스에 옵션 추가
    document.querySelector('div.se-wrapper > div').innerHTML = '';  //텍스트 에디터 내부 내용을 공백으로 지정
  });

//새로고침하거나, 다른페이지로 이동했을 경우, 현재까지 작성한 글 정보들을 db에 업데이트
window.addEventListener('unload', (event) => {
  writings[document.getElementById('writing-list').value - 1] =
    document.querySelector('div.se-wrapper > div').innerHTML;
  fetch('/process/updateWritings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writings: writings,
      category: category,
      id: userId,
      index: index,
    }),
  });
  navigator.sendBeacon('/log', JSON.stringify({ action: 'page_unloaded' }));
});

//제출하기 버튼 클릭시
document.querySelector('.submit').addEventListener('click', (event) => {
  const problemTitle = document.querySelector('.title').innerHTML;  
  const problemContent = document.querySelector('.guide-section').innerHTML;
  const writing = document.querySelector('div.se-wrapper > div').innerHTML;
  const selectValue = document.getElementById('writing-list').value; 
  console.log('category: ', category);

  //서버로부터 피드백 정보를 가져옴
  fetch('/process/getFeedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problemTitle: problemTitle,     
      problemContent: problemContent,
      writing: writing, //작성한 글
      wid: selectValue, //작성한 글을 db에서 식별하기 위한 키값
      id: userId, //유저 정보
      category: category,
      index: index, //해당 카테고리의 문제중, 몇번째 문제인지
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const res = {
        problemTitle: problemTitle,
        problemContent: problemContent,
        writing: writing,
        feedback: data,
      };
      sessionStorage.setItem('data', JSON.stringify(res));  //세션 스토리지에 서버로부터 받은 정보를 저장
      console.log('data:', data);
      window.location.href = 'feedback.html'; //feedback페이지 로드
    });
});
