const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 만 9세 이하 또는 초등학교 3학년 이하 여부 확인
function isEligibleChild(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  
  // 1. 만 9세가 되는 날의 전날 계산
  const age9Date = new Date(birth.getFullYear() + 9, birth.getMonth(), birth.getDate() - 1);
  
  // 2. 초등학교 3학년이 되는 날(해당 학년 3월 1일)의 전날 계산
  const grade3Year = birth.getFullYear() + 8;
  const grade3Date = new Date(grade3Year, 1, 28); // 2월 28일
  
  // 윤년 처리
  if (isLeapYear(grade3Year)) {
    grade3Date.setDate(29);
  }
  
  // 더 늦은 날짜를 사용 가능 마지막 날로 설정
  const usageEndDate = age9Date > grade3Date ? age9Date : grade3Date;
  
  return today <= usageEndDate;
}

// 윤년 판별 함수
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// 육아시간 계산
function calculateParentalLeave(data) {
  const { birthDate, continuousMonths, nonContinuousDays } = data;
  
  if (!isEligibleChild(birthDate)) {
    return { eligible: false, message: "자녀가 만 9세를 초과했거나 초등학교 3학년을 초과했습니다." };
  }
  
  let totalUsedMonths = 0;
  
  // 연속 사용 개월 수 추가
  if (continuousMonths && Array.isArray(continuousMonths)) {
    continuousMonths.forEach(period => {
      totalUsedMonths += period.months;
    });
  }
  
  // 비연속 사용일을 개월로 환산 (20일 = 1개월)
  if (nonContinuousDays) {
    totalUsedMonths += Math.floor(nonContinuousDays / 20);
  }
  
  const maxMonths = 36;
  const remainingMonths = maxMonths - totalUsedMonths;
  
  return {
    eligible: true,
    totalUsedMonths,
    remainingMonths: Math.max(0, remainingMonths),
    maxMonths,
    nonContinuousRemainingDays: nonContinuousDays ? (nonContinuousDays % 20) : 0
  };
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/calculate', (req, res) => {
  try {
    const result = calculateParentalLeave(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: '계산 중 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`육아시간 계산기가 포트 ${PORT}에서 실행중입니다.`);
});