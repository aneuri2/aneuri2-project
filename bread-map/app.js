/**
 * 오늘의 빵 추첨기 (Jonghwan's Bakery Picker)
 * - 15종 베이커리 랜덤 추첨
 * - 다크모드 / 화이트모드 테마 시스템 (localStorage 동기화)
 * - 최근 추첨 기록 저장 및 비우기 기능
 */

// 1. 빵 데이터 목록 (15종)
const BREADS = [
  { name: "크루아상", emoji: "🥐", desc: "겉은 바삭하고 속은 겹겹이 부드러운 프랑스 정통 클래식!" },
  { name: "소금빵", emoji: "🥖", desc: "고소한 버터 홀과 톡 쏘는 바다 소금의 중독적인 앙상블." },
  { name: "베이글", emoji: "🥯", desc: "쫄깃하고 든든해서 크림치즈와 함께 식사 대용으로 최고!" },
  { name: "식빵", emoji: "🍞", desc: "그냥 찢어 먹어도, 토스트기에 바삭하게 구워도 맛있는 기본의 정석." },
  { name: "단팥빵", emoji: "🫘", desc: "달콤하고 부드러운 팥 앙금이 꽉 찬 언제나 반가운 추억의 빵." },
  { name: "크림빵", emoji: "🧁", desc: "한 입 베어 물면 부드럽고 달콤한 크림이 사르르 녹아내려요." },
  { name: "소보로빵", emoji: "🍪", desc: "바삭하고 달콤고소한 땅콩 소보로 크러스트가 듬뿍!" },
  { name: "마늘빵", emoji: "🧄", desc: "진한 마늘과 버터, 파슬리의 향이 코끝과 입맛을 깨워줘요." },
  { name: "앙버터", emoji: "🧈", desc: "달콤한 팥과 두툼하고 고소한 버터의 실패 없는 단짠 조합." },
  { name: "치아바타", emoji: "🥪", desc: "올리브 오일과 발사믹에 찍어 먹으면 담백함이 배가되는 이탈리아 빵." },
  { name: "멜론빵", emoji: "🍈", desc: "격자무늬의 달콤하고 바삭한 쿠키 반죽을 덮은 일본 인기 베이커리." },
  { name: "슈크림빵", emoji: "🍮", desc: "바닐라빈 풍미의 커스터드 슈크림이 입안 가득 행복을 채워줘요." },
  { name: "꽈배기", emoji: "🍩", desc: "설탕 솔솔 뿌린 쫄깃하고 친근한 국민 간식의 대표주자." },
  { name: "바게트", emoji: "🥖", desc: "겉은 하드하고 속은 촉촉한 담백함! 잠봉뵈르로 즐겨도 훌륭해요." },
  { name: "에그타르트", emoji: "🥧", desc: "바삭한 페이스트리 시트 속에 달콤촉촉 푸딩 같은 에그 커스터드." }
];

// 2. DOM 요소 참조
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const pickButton = document.getElementById("pickButton");
const breadEmoji = document.getElementById("breadEmoji");
const breadName = document.getElementById("breadName");
const breadDesc = document.getElementById("breadDesc");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// 3. 다크모드 / 화이트모드 테마 관리
function getPreferredTheme() {
  const saved = localStorage.getItem("bakery_theme");
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  // 시스템 환경 설정 감지
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (themeIcon) themeIcon.textContent = "☀️";
    if (themeLabel) themeLabel.textContent = "화이트모드";
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (themeIcon) themeIcon.textContent = "🌙";
    if (themeLabel) themeLabel.textContent = "다크모드";
  }
  localStorage.setItem("bakery_theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
}

// 4. 최근 추첨 기록 관리
const STORAGE_KEY_HISTORY = "bakery_history";

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

function renderHistory() {
  const history = getStoredHistory();
  if (!historyList) return;

  historyList.innerHTML = "";

  if (history.length === 0) {
    const emptySpan = document.createElement("span");
    emptySpan.className = "chip chip-empty";
    emptySpan.textContent = "아직 추첨 기록이 없어요.";
    historyList.appendChild(emptySpan);
    return;
  }

  history.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${item.emoji} ${item.name}`;
    historyList.appendChild(chip);
  });
}

function addHistoryItem(item) {
  const history = getStoredHistory();
  history.unshift(item);
  // 최근 최대 6개까지만 보관
  if (history.length > 6) {
    history.pop();
  }
  saveHistory(history);
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  renderHistory();
}

// 5. 빵 무작위 추첨 로직
function pickRandomBread() {
  const currentName = breadName.textContent.trim();
  // 직전에 뽑은 빵과 다른 빵이 선택되도록 필터링
  const candidates = BREADS.filter((b) => b.name !== currentName);
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || BREADS[0];

  // 애니메이션 효과 리셋
  breadEmoji.classList.remove("pop");
  void breadEmoji.offsetWidth; // reflow 강제
  breadEmoji.classList.add("pop");

  // DOM 갱신
  breadEmoji.textContent = picked.emoji;
  breadName.textContent = picked.name;
  breadDesc.textContent = picked.desc;

  // 기록 추가
  addHistoryItem(picked);
}

// 6. 이벤트 리스너 등록 & 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 테마 초기화
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // 시스템 테마 변경 감지
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      // 사용자가 수동 설정한 기록이 없을 때만 시스템 테마 반영
      if (!localStorage.getItem("bakery_theme")) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }

  // 추첨 버튼
  if (pickButton) {
    pickButton.addEventListener("click", pickRandomBread);
  }

  // 기록 비우기 버튼
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }

  // 이전 기록 렌더링
  renderHistory();
});
