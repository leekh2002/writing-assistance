/*
실행 순서:
1. npm install을 통해 패키지들을 다운로드
2. 터미널에 "node svr.js" 명령어를 입력하여 서버 실행
3. 주소창에 "localhost:포트번호(3000)/public/index.html"접속
*/

const express = require('express'); // Express 모듈 불러오기
const mysql = require('mysql2'); // MySQL 연결을 위한 모듈
const path = require('path'); // 파일 및 디렉토리 경로 처리 모듈
const static = require('serve-static'); // 정적 파일 서빙을 위한 모듈
const session = require('express-session'); // 세션 관리를 위한 모듈
const dbconfig = require('./config/dbconfig.json'); // 데이터베이스 설정 파일
const OpenAI = require('openai'); // OpenAi API 사용을 위한 모듈
const cron = require('node-cron'); //task scheduler 모듈
let currentProblems = {}; // 현재 사용할 문제 정보를 저장하는 객체
let curretContestProblem = {};
let contestRound = 5;
let contestDay = 6; //콘테스트 시작요일(6: 토요일)
let contestStartHour = 15; //콘테스트 시작시간
let contestEndHour = 17; //콘테스트 종료시간

// MySQL 연결 풀 설정
const pool = mysql.createPool({
  connectionLimit: 10,
  host: dbconfig.host,
  user: dbconfig.user,
  password: dbconfig.password,
  database: dbconfig.database,
  multipleStatements: true,
  debug: false,
});

const app = express(); // Express 앱 생성
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱
app.use(express.json()); //JSON 형태의 요청(request) body를 파싱(parse)하기 위해 사용
app.use('/public', static(path.join(__dirname, 'public'))); // `/public` 경로로 정적 파일 제공
app.use(
  //세션 설정
  session({
    secret: 'secret', //세션 암호화 키
    resave: false, //세션을 항상 저장하지 않음
    saveUninitialized: false, // 초기화되지 않은 세션 저장 안함
    cookie: {
      secure: false,
    },
  })
);

// 프롬프트를 인자로 지정하여 Chat GPT를 호출하여 문제 데이터를 생성
async function callChatGPT(prompt) {
  const openai = new OpenAI({
    // OpenAI API 키
    apiKey: process.env.OPENAI_API_KEY
  });

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // 사용 모델
    messages: [{ role: 'user', content: prompt }],
  });

  let content = result.choices[0].message.content; // GPT 응답 내용
  console.log('content: ', content);
  try {
    const parsedContent = JSON.parse(content); // JSON 파싱
    return parsedContent; // 파싱된 데이터를 반환
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null; // 파싱 실패시 null 반환
  }
}

// 데이터베이스에 새로운 문제 추가
async function addProblem(category, isContest) {
  const result = await callChatGPT(
    `${category} 주제로 창의적 글쓰기 문제 만들어줘. 답변은 반드시 순수json으로만 해주고, 추가 텍스트(\', \`등)는 사용하지마. 양식은 다음과 같아.\n제목:\n내용:\n이때, 내용은 강조해야할 부분이나 문단에는 html태그를 붙여줘.`
  ); //Chat GPT에 문제 생성 프롬프트를 넘겨줌

  await new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      //insert구문으로 문제정보 테이블에 생성된 문제 추가
      const exec = conn.query(
        'insert into problem_info(pid,title,content,category) select max(pid)+1, ?, ?, ? from problem_info',
        [result['제목'], result['내용'], isContest ? 'contest' : category],
        (err, rows) => {
          conn.release();
          resolve();
        }
      );
    });
  });
}

// 콘테스트 문제 설정
function setContestProblem() {
  pool.getConnection((err, conn) => {
    const exec = conn.query(
      //콘테스트용 문제중 가장 최근에 생성된 문제 조회
      `
      SELECT pid, title, content, category
      FROM problem_info
      WHERE category = 'contest'
      ORDER BY pid DESC
      LIMIT 1
      `,
      [],
      (err, row) => {
        conn.release();
        curretContestProblem = row; // 최근 문제를 콘테스트 문제로 설정
        console.log(curretContestProblem);
      }
    );
  });
}

async function addContestProblem() {
  //콘테스트용 문제 생성
  const categories = ['인문학', '자연과학', '사회과학'];
  await addProblem(categories[Math.floor(Math.random() * 3)], true); //랜덤 카테고리로 생성
  setContestProblem();
}

//매주 토요일 대회 시작 1분전 콘테스트 문제 생성
cron.schedule('59 14 * * 6', () => {
  contestRound++;
  addContestProblem();
  console.log('대회 문제 생성');
});

//0분
//0시
//*(매일)
//*(매월)
//1 월요일
//매주 월요일 자정에 카테고리별 문제 업데이트
cron.schedule('0 0 * * 1', () => {
  updateProblem();
});

// 여러 문제를 생성하고 데이터베이스를 업데이트하는 함수
async function updateProblem() {
  await addProblem('자연과학', false);
  await addProblem('자연과학', false);
  await addProblem('자연과학', false);
  await addProblem('사회과학', false);
  await addProblem('사회과학', false);
  await addProblem('사회과학', false);
  await addProblem('인문학', false);
  await addProblem('인문학', false);
  await addProblem('인문학', false);

  setCurrentProblem(); // 최신 문제를 설정
}

// 최신 문제 데이터를 설정하는 함수
function setCurrentProblem() {
  pool.getConnection((err, conn) => {
    //db에서 카테고리별로 최근에 생성된 3개의 문제 검색
    //pid는 문제를 식별하는 pk
    conn.query(
      `
    SELECT pid, title, content, category
      FROM (
        SELECT pid, title, content, category,
              ROW_NUMBER() OVER (PARTITION BY category ORDER BY pid DESC) AS pid_rank
        FROM problem_info
        where category != 'contest'
    ) AS ranked_pids
    WHERE pid_rank <= 3;`,
      [],
      (err, rows) => {
        currentProblems = {};
        currentProblems = {
          자연과학: [],
          사회과학: [],
          인문학: [],
        };
        for (let row of rows) {
          currentProblems[row.category].push({
            pid: row.pid,
            title: row.title,
            content: row.content,
            category: row.category,
          });
        }
        //console.log('current: ',currentProblems);
      }
    );
  });
}

setCurrentProblem(); // 초기 문제 설정

// 사용자 회원가입 처리
app.post('/process/signup', (req, res) => {
  console.log('/process/signup 호출' + req);
  const username = req.body.username;
  const password = req.body.password;
  pool.getConnection((err, conn) => {
    const exec = conn.query(
      //db에 해당 id가 있는지 검색
      'select id from user where id=?',
      [username],
      (err, rows) => {
        conn.release();

        //만약 이미 존재할 경우, exist 상태를 true로 지정하여 리턴
        if (rows.length != 0) {
          return res.json({ exist: true });
        } else {
          //그렇지 않으면 db에 회원 정보 추가. 이때, 패스워드는 암호화
          conn.query(
            'insert into user (id, password) values (?,SHA2(?,512));',
            [username, password],
            (err, rows) => {
              req.session.userId = username; // 세션에 사용자 아이디 저장
              return res.json({ exist: false });
            }
          );
        }
      }
    );
  });
});

// 사용자 로그인 처리
app.post('/process/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  pool.getConnection((err, conn) => {
    const exec = conn.query(
      // user테이블에 id와 패스워드가 일치하는 데이터가 존재하는지 확인
      'select id from user where id=? and password=SHA2(?,512);',
      [username, password],
      (err, rows) => {
        conn.release();
        //존재하지 않을경우, exist를 false로 지정하여 클라이언트에 전달
        if (rows.length == 0) {
          return res.json({ exist: false });
        } else {
          //존재할 경우, 세션에 id를 저장하고, exist를 true로 지정하여 클라이언트에 전달
          req.session.userId = username;
          console.log('user: ', req.session.userId);
          return res.json({ exist: true });
        }
      }
    );
  });
});

//특정 카테고리 문제를 가져오는 요청 처리
app.post('/process/getproblem', (req, res) => {
  console.log(req.body.categories);

  //요청한 카테고리가 콘테스트용이라면 콘테스트 문제 반환
  if (req.body.categories == 'contest') {
    setContestProblem();
    console.log(curretContestProblem);
    return res.json(curretContestProblem);
  } else if (currentProblems[req.body.category] != undefined)
    return res.json(currentProblems[req.body.category]);
  return res.json('');
});

// 카테고리 정보와 문제 index를 토대로 해당 사용자가 작성한 글들을 가져오는 요청 처리
app.post('/process/getWritingsByCategoryAndIndex', (req, res) => {
  const category = req.body.category;
  const index = req.body.index;
  console.log('id: ', req.body.id);
  pool.getConnection((err, conn) => {
    conn.query(
      //피드백 정보와 글내용을 검색
      `select feedback, content from writing_info where id=? and pid=? order by wid;`,
      [req.body.id, currentProblems[category][index].pid],
      (err, rows) => {
        conn.release();

        //만약 조회된 결과가 없을시, db에 추가 유저 id와 문제번호, 글번호만 추가(글 내용 및 피드백 정보는 NULL)
        if (rows.length == 0) {
          conn.query(
            `insert into writing_info(id,pid,wid) values(?,?,1)`,
            [req.body.id, currentProblems[category][index].pid],
            (err, rows) => {
              conn.release();
            }
          );
        }
        return res.json({
          problem: currentProblems[category][index],
          writing: rows,
        });
      }
    );
  });
});

// 글쓰기 문제 정보를 추가하는 요청 처리
app.post('/process/addWriting', (req, res) => {
  pool.getConnection((err, conn) => {
    // 문제 정보 (문제 ID, 문제 내용, 작성한 글 ID)를 데이터베이스에 저장
    conn.query(
      `insert into writing_info(id,pid,wid) values(?, ?, ?);`,
      [
        req.body.id,
        currentProblems[req.body.category][req.body.index].pid,
        req.body.wid,
      ],
      (err, rows) => {
        conn.release();
      }
    );
  });
});

// 작성된 글들을 업데이트하는 요청 처리
app.post('/process/updateWritings', (req, res) => {
  let wid = 1;

  // 여러 개의 글을 업데이트
  for (let data of req.body.writings) {
    pool.getConnection((err, conn) => {
      const exec = conn.query(
        `
        update writing_info
        set content=?
        where id=? and pid=? and wid=?;
        `,
        [
          data,
          req.body.id,
          currentProblems[req.body.category][req.body.index].pid,
          wid++,
        ],
        (err, rows) => {
          conn.release();
          console.log('실행된 SQL: ' + exec.sql);
          if (err) {
            console.log('SQL 실행시 오류발생');
            console.dir(err);
          }
          return;
        }
      );
    });
  }
});

// 작성한 글에 대해 GPT로부터 피드백을 받아오는 API
app.post('/process/getFeedback', async (req, res) => {
  const problemTitle = req.body.problemTitle;
  const problemContent = req.body.problemContent;
  const writing = req.body.writing;
  const wid = req.body.wid;
  const category = req.body.category;
  console.log('category:', category);
  console.log('current: ', currentProblems[category]);
  const index = req.body.index;

  // GPT API 호출로 피드백 요청
  const result = await callChatGPT(
    `아래 글쓰기 문제에 관해서 작성한 글을 글 전체의 구성, 명확성, 문법적 정확성, 어휘의 풍부성, 문장 구사력, 의도 표현력을 토대로 매우 구체적으로 피드백해줘. 피드백을 받을 부분에 구체적인 예시 또한 제공해줬으면 좋겠어. 또한, html태그에 관한 피드백은 절대로 포함하지마. 답변은 반드시 순수json으로만 해주고, 추가 텍스트(\', \`등)는 사용하지마. 예시는 다음과 같아. 총점은 100점 만점으로 하되, 숫자 하나만 적어줘 ex)90/100이 아닌, 90 \n총점: 87\n피드백:{글 전체의 구성: , 명확성: , 문법적 정확성: , 어휘의 풍부성: , 문장 구사력: , 의도 표현력: }}\n이때, 피드백은 강조해야할 부분이나 문단에는 html태그를 붙여줘.\n\n-문제-\n제목: ${problemTitle}\n내용: ${problemContent}\n------\n\n-작성한 글-\n${writing}\n----------`
  );

  // 글 작성 정보 업데이트 (피드백, 점수 포함)
  pool.getConnection((err, conn) => {
    const exec = conn.query(
      `
      update writing_info
      set feedback=?, content=?, score=?
      where id=? and pid=? and wid=?;
      `,
      [
        JSON.stringify(result['피드백']),
        writing,
        result['총점'],
        req.body.id,
        currentProblems[category][index].pid,
        wid,
      ],
      (err, rows) => {
        conn.release();

        if (err) {
          console.log('SQL 실행시 오류발생');
          console.dir(err);
        }
      }
    );
  });
  return res.json(result); // 피드백 결과 반환
});

// 사용자가 풀었던 모든 문제들을 가져오는 요청 처리
app.post('/process/getAllProblems', (req, res) => {
  console.log('id: ', req.body.id);
  pool.getConnection((err, conn) => {
    //피드백 내용이 존재하는 문제들만 가져옴
    const exec = conn.query(
      `
      select distinct(b.pid), b.title, b.content, b.category
      from ( select * from writing_info where feedback is not null and id = ?) as a, problem_info as b
      where a.pid = b.pid and category != 'contest'
      order by pid;
      `,
      [req.body.id],
      (err, rows) => {
        conn.release();
        console.log(exec.sql);
        console.log('rows: ', rows);
        return res.json(rows);
      }
    );
  });
});

//특정 문제에 대해 작성한 글 정보를 가져옴
app.post('/process/getWriting', (req, res) => {
  pool.getConnection((err, conn) => {
    conn.query(
      `select feedback, score, content from writing_info where pid=? and id=? and feedback is not null`,
      [req.body.pid, req.body.id],
      (err, rows) => {
        conn.release();
        return res.json(rows);
      }
    );
  });
});

//해당 사용자가 작성한 모든 글 정보를 가져옴
app.post('/process/getAllWritings', (req, res) => {
  console.log('wrting id:', req.body.id);
  pool.getConnection((err, conn) => {
    conn.query(
      `
      select a.pid, a.wid, a.feedback, a.score, a.content, b.category 
      from writing_info as a, problem_info as b 
      where a.id = ? and a.pid = b.pid and feedback is not null and category != 'contest';
      `,
      [req.body.id],
      (err, rows) => {
        conn.release();
        return res.json(rows);
      }
    );
  });
});

//클라이언트에 콘테스트 시작요일, 시간 전달
app.post('/process/getContestDate', (req, res) => {
  return res.json({
    contestDay: contestDay,
    contestStartHour: contestStartHour,
    contestEndHour: contestEndHour,
  });
});

//스코어보드 정보를 회차, 점수, 제출 시간순으로 정렬해서 가져옴
app.post('/process/getScoreboard', (req, res) => {
  pool.getConnection((err, conn) => {
    conn.query(
      `select * from score_board order by round asc, score desc, submit_time asc;`,
      [],
      (err, rows) => {
        conn.release();
        return res.json({ round: contestRound, scoreBoard: rows });
      }
    );
  });
});

// 사용자가 해당 콘테스트 라운드에 참가했는지 확인하는 요청 처리
app.post('/process/checkParticipation', (req, res) => {
  pool.getConnection((err, conn) => {
    conn.query(
      `select * from score_board where round = ? and user_name = ?;`,
      [contestRound, req.body.userId],
      (err, rows) => {
        conn.release();
        if (rows.length > 0) return res.json({ result: true });
        else return res.json({ result: false });
      }
    );
  });
});

// 현재 콘테스트 라운드를 확인하는 요청 처리
app.post('/process/checkContestRound', (req, res) => {
  return res.json({ contestRound: contestRound });
});

//콘테스트에서 문제 제출시, gpt에게 점수 요청 및 db에 정보 저장
app.post('/process/submitContest', async (req, res) => {
  const problemTitle = req.body.problemTitle;
  const problemContent = req.body.problemContent;
  const writing = req.body.writing;
  const userId = req.body.userId;
  const submitTime = req.body.submitTime;

  // GPT API 호출로 점수 요청
  const result = await callChatGPT(
    `아래 글쓰기 문제에 관해서 작성한 글을 글 전체의 구성, 명확성, 문법적 정확성, 어휘의 풍부성, 문장 구사력, 의도 표현력을 토대로 점수를 제공해줘. 답변은 반드시 순수json으로만 해주고, 추가 텍스트(\', \`등)는 사용하지마. 예시는 다음과 같아. 총점은 100점 만점으로 하되, 숫자 하나만 적어줘 ex)90/100이 아닌, 90 \n총점: 87\n\n-문제-\n제목: ${problemTitle}\n내용: ${problemContent}\n------\n\n-작성한 글-\n${writing}\n----------`
  );

  //스코어보드 테이블에 정보 삽입
  pool.getConnection((err, conn) => {
    conn.query(
      `
      insert into score_board(user_name, round, score, submit_time)
      values (?,?,?,?);
      `,
      [userId, contestRound, result['총점'], submitTime],
      (err, rows) => {
        conn.release();
        return res.json();
      }
    );
  });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
