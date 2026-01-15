const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();

// API 키는 Firebase 환경 변수에 저장되어 안전하게 사용됩니다.
const openAIKey = functions.config().openai.key;
const openai = new OpenAI({ apiKey: openAIKey });

const OPENAI_MODEL = "gpt-3.5-turbo-1106";

exports.analyzeStyle = functions.https.onCall(async (data, context) => {

    const { studentName, mbti, birthYear, birthMonth, birthDay, birthHour, calendarType } = data;

    const systemPrompt = `당신은 사주 명리학과 MBTI를 종합적으로 분석하여 학생의 학습 스타일을 진단하는 최고의 교육 컨설턴트입니다. 다음 정보를 바탕으로 학생의 타고난 학습 스타일, 강점, 추천 학습 전략, 그리고 주의할 점을 분석해 주세요. 응답은 반드시 지정된 JSON 형식으로만 제공해야 합니다. 다른 설명이나 일반 텍스트를 추가하지 마세요.

응답 JSON 형식:
{
  "learningStyle": {
    "title": "학습 스타일 이름 (예: 논리적 탐구형)",
    "description": "사주와 MBTI를 통합하여 분석한 학습 스타일에 대한 상세한 설명"
  },
  "analysis": {
    "strengths": [
      "학생의 강점 1",
      "학생의 강점 2"
    ],
    "potential": "학습 성과 및 잠재력에 대한 예측",
    "caution": "주의하거나 보완해야 할 점"
  },
  "recommendations": {
    "strategies": [
      "추천 학습 전략 1",
      "추천 학습 전략 2",
      "추천 학습 전략 3"
    ]
  }
}`;

    const userPrompt = `
        - 학생 이름: ${studentName}
        - MBTI: ${mbti}
        - 생년월일시: ${birthYear}년 ${birthMonth}월 ${birthDay}일 ${birthHour}시
        - 달력 종류: ${calendarType === 'solar' ? '양력' : '음력'}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);

    } catch (error) {
        console.error("OpenAI API 호출 중 오류 발생:", error);
        throw new functions.https.HttpsError('internal', 'AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
});
