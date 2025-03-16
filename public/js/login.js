// form 요소에서 submit 이벤트가 발생했을 때 실행되는 코드
document.querySelector('form').addEventListener('submit', (event) => {
  // form의 기본 동작(페이지 새로 고침)을 막음
  event.preventDefault();

  // 입력된 사용자 이름과 비밀번호 값을 가져옴
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // 로그인 요청을 서버로 보내기 위한 fetch 호출
  fetch('/process/login',{
    method : 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
    .then((res) => res.json())
    .then((data) => {
       // 서버에서 받은 데이터의 'exist' 필드가 false이면 로그인 실패
      if(!data.exist){
        alert('id 또는, 패스워드가 일치하지 않습니다.');
      }
      else {
        // 로그인 성공 시 sessionStorage에 사용자 ID 저장
        sessionStorage.setItem('id', username);

         // 로그인 후 홈 페이지로 이동
        window.location.href = 'home.html';
      }
    }) 
})