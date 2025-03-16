// 'form' 요소에 대한 제출 이벤트 리스너 설정
document.querySelector('form').addEventListener('submit', (event) => {
  // form의 기본 동작(페이지 새로 고침)을 막음
  event.preventDefault();

  // 입력된 사용자 이름, 비밀번호 및 비밀번호 확인 값 가져오기
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // 비밀번호와 비밀번호 확인이 일치하지 않으면 경고 메시지 표시
  if (password != confirmPassword) {
    alert('패스워드가 일치하지 않습니다.');
    return;
  }

  // 사용자 정보(아이디와 비밀번호)를 서버로 보내 회원가입 요청
  fetch('/process/signup',{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json' // 전송 데이터 형식 지정 (예: JSON)
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
    .then((res) => res.json())
    .then((data) => {
      // 서버에서 받은 응답이 이미 존재하는 아이디인지 확인
      if(data.exist){
        alert('이미 해당 id가 존재합니다.');
      }
      else {
        // 아이디가 존재하지 않으면 sessionStorage에 아이디를 저장하고 홈 페이지로 이동
        sessionStorage.setItem('id', username);
        window.location.href = 'home.html';
      }
    }) 

});
