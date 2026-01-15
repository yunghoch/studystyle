import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// 이 설정 객체는 Firebase 프로젝트를 초기화할 때 자동으로 채워집니다.
// 이 정보는 공개되어도 안전합니다.
const firebaseConfig = {
    // 여기에 Firebase 설정이 들어갑니다.
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// 백엔드에 배포된 'analyzeStyle' 함수를 호출할 수 있는 함수를 만듭니다.
const analyzeStyle = httpsCallable(functions, 'analyzeStyle');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assessment-form');
    const outputDiv = document.getElementById('result-output');
    const firebaseConfigValue = document.getElementById('firebase-config-value');

    // Firebase 설정이 비어 있는지 확인
    if (!firebaseConfig.apiKey) {
        outputDiv.innerHTML = `
            <div class="text-orange-400 text-center">
                <p><strong>경고: Firebase 설정이 필요합니다.</strong></p>
                <p class="mt-2 text-sm">이 앱을 사용하려면 Firebase 프로젝트와 연결해야 합니다. Firebase CLI를 통해 프로젝트를 설정하고, 생성된 설정 값을 여기에 추가해주세요.</p>
            </div>
        `;
        // firebase-config-value textarea를 보이게 처리
        firebaseConfigValue.style.display = 'block';
        // firebaseConfigValue.parentElement.style.display = 'block'; // 부모 div도 보이게

    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!firebaseConfig.apiKey) {
            alert("Firebase 설정을 먼저 완료해주세요.");
            return;
        }

        const studentName = document.getElementById('student-name').value;
        const mbti = document.getElementById('mbti').value.toUpperCase();
        const birthYear = document.getElementById('birth-year').value;
        const birthMonth = document.getElementById('birth-month').value;
        const birthDay = document.getElementById('birth-day').value;
        const birthHour = document.getElementById('birth-hour').value;
        const calendarType = document.querySelector('input[name="calendar_type"]:checked').value;

        outputDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-400"></i>
                <p class="text-gray-400 mt-4">AI가 ${studentName}님의 학습 스타일을 분석중입니다...</p>
                <p class="text-gray-500 text-sm">안전한 백엔드 서버를 통해 분석하고 있습니다.</p>
            </div>
        `;

        try {
            const result = await analyzeStyle({ 
                studentName, mbti, birthYear, birthMonth, birthDay, birthHour, calendarType 
            });
            
            const content = result.data;
            renderResult(content, studentName, mbti);

        } catch (error) {
            console.error('백엔드 함수 호출 중 오류 발생:', error);
            outputDiv.innerHTML = `
                <div class="text-red-400 text-center">
                    <p><strong>오류가 발생했습니다.</strong></p>
                    <p class="mt-2 text-sm">${error.message}</p>
                    <p class="mt-2 text-sm">백엔드 로그를 확인하여 문제를 해결하세요. OpenAI API 키가 올바르게 설정되었는지도 확인해야 합니다.</p>
                </div>
            `;
        }
    });

    function renderResult(data, name, mbti) {
        const { learningStyle, analysis, recommendations } = data;
        const resultHTML = `
            <h3 class="text-xl font-bold text-blue-400 mb-3">${name}님 (MBTI: ${mbti}) - ${learningStyle.title}</h3>
            
            <p class="mb-4">${learningStyle.description}</p>

            <h4 class="text-lg font-semibold text-teal-300 mt-6 mb-2">종합 분석</h4>
            <ul class="list-disc list-inside space-y-2 text-gray-300 mb-4">
                ${analysis.strengths.map(s => `<li><strong>강점:</strong> ${s}</li>`).join('')}
                <li><strong>잠재력:</strong> ${analysis.potential}</li>
                <li><strong>주의할 점:</strong> ${analysis.caution}</li>
            </ul>

            <h4 class="text-lg font-semibold text-teal-300 mt-6 mb-2">추천 학습 전략</h4>
            <ul class="list-disc list-inside space-y-2 text-gray-300">
                ${recommendations.strategies.map(s => `<li>${s}</li>`).join('')}
            </ul>
        `;
        outputDiv.innerHTML = resultHTML;
    }
});
