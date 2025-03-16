// 'category' 선택 요소에서 값이 변경될 때 발생하는 이벤트 처리
document.getElementById('category').addEventListener('change', (event) => {

  // 선택된 카테고리에 맞는 문제 데이터를 서버에서 요청
  fetch('/process/getproblem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: event.target.value, // 선택된 카테고리 값을 서버로 전달
    }),
  })
    .then((res) => res.json())
    .then((data) => {
       // 문제 목록을 갱신하기 전에 기존 문제 목록을 비움
      document.querySelector('.problems').innerHTML = '';
      let index=0;

      // 서버에서 받은 문제 데이터를 순차적으로 처리
      for (let element of data) {
        // 각 문제에 대해 링크(a 태그)를 생성
        let a = document.createElement('a');
        a.className = 'problem';  // 'problem' 클래스를 추가
        a.textContent = element.title;  // 문제 제목을 링크 텍스트로 설정

        // 각 링크 클릭 시 'writing.html' 페이지로 이동하며 카테고리와 문제 인덱스를 URL 파라미터로 전달
        a.href=`writing.html?category=${element.category}&index=${index++}`;

        // 생성한 링크를 .problems 요소에 추가
        document.querySelector('.problems').appendChild(a);
      }
    });
});
