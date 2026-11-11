// Lucide icons initialization
function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}
document.addEventListener('DOMContentLoaded', refreshIcons);

// Dark / Light Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  refreshIcons();

  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    refreshIcons();
  });
}

// Mobile Menu Toggle
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

// Scroll Progress Bar
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    bar.style.width = `${progress}%`;
  }
});

// Typing animation for Hero subtitle
const typedEl = document.getElementById('typed-text');
if (typedEl) {
  const titles = [
    '문제를 해결하는 소프트웨어 엔지니어',
    '사용자 중심 풀스택 빌더',
    '새로운 가치를 창조하는 테크 혁신가'
  ];
  let titleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function typeEffect() {
    const current = titles[titleIdx];
    if (isDeleting) {
      typedEl.textContent = current.substring(0, charIdx - 1);
      charIdx--;
    } else {
      typedEl.textContent = current.substring(0, charIdx + 1);
      charIdx++;
    }

    let speed = isDeleting ? 40 : 80;

    if (!isDeleting && charIdx === current.length) {
      speed = 1800;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      titleIdx = (titleIdx + 1) % titles.length;
      speed = 400;
    }

    setTimeout(typeEffect, speed);
  }
  typeEffect();
}

// Project Modal Logic
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');

const projectDetails = {
  ai: {
    title: 'AI 문서 분석 및 인사이트 엔진',
    badge: 'AI & LangChain',
    desc: '대규모 PDF와 사내 문서를 RAG(검색 증강 생성) 아키텍처를 통해 색인하고, 자연어 질의응답 및 인사이트 시각화를 제공하는 엔터프라이즈 솔루션입니다.',
    tech: ['FastAPI', 'Python', 'LangChain', 'OpenAI API', 'Vector DB', 'Next.js']
  },
  commerce: {
    title: '글로벌 커머스 데이터 플랫폼',
    badge: 'Full-Stack Web',
    desc: '실시간 주문 처리, 결제 시스템 연동, 매출 통계 시각화 및 재고 관리 파이프라인을 지원하는 대규모 이커머스 웹 플랫폼입니다.',
    tech: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS']
  },
  portfolio: {
    title: '정종환 인터랙티브 공식 포트폴리오',
    badge: 'Interactive Web',
    desc: '모던한 글래스모피즘과 캔버스 파티클 효과, 다크모드, 실시간 브라우저 방명록을 지원하는 개인 공식 웹사이트입니다.',
    tech: ['Vanilla JS', 'Tailwind CSS', 'HTML5 Canvas', 'Responsive Design']
  }
};

function openModal(key) {
  const p = projectDetails[key];
  if (!p || !modal || !modalBody) return;

  modalBody.innerHTML = `
    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-500 mb-2 inline-block">${p.badge}</span>
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">${p.title}</h3>
    <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">${p.desc}</p>
    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">사용한 기술 스택</div>
    <div class="flex flex-wrap gap-1.5 mb-6">
      ${p.tech.map(t => `<span class="px-2.5 py-1 rounded-lg text-xs bg-gray-100 dark:bg-dark-subtle font-mono">${t}</span>`).join('')}
    </div>
    <div class="flex justify-end gap-2">
      <button onclick="closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-dark-subtle hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">닫기</button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  refreshIcons();
}

function closeModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// Guestbook system using localStorage
const gbForm = document.getElementById('guestbook-form');
const gbList = document.getElementById('guestbook-list');

const DEFAULT_GUESTBOOK = [
  { name: '테크 동료', msg: '홈페이지 정말 감각적이고 멋집니다! 응원합니다.', date: '2026. 11. 11.' },
  { name: '방문자', msg: '앞으로의 활약과 프로젝트 기대할게요!', date: '2026. 11. 10.' }
];

function loadGuestbook() {
  if (!gbList) return;
  const stored = localStorage.getItem('jh_guestbook');
  const items = stored ? JSON.parse(stored) : DEFAULT_GUESTBOOK;

  gbList.innerHTML = items.map(item => `
    <div class="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm shadow-sm">
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-gray-900 dark:text-white">${item.name}</span>
        <span class="text-[11px] text-gray-400 font-mono">${item.date}</span>
      </div>
      <p class="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">${item.msg}</p>
    </div>
  `).join('');
}
loadGuestbook();

if (gbForm) {
  gbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('gb-name');
    const msgEl = document.getElementById('gb-message');
    const name = nameEl.value.trim();
    const msg = msgEl.value.trim();
    if (!name || !msg) return;

    const stored = localStorage.getItem('jh_guestbook');
    const items = stored ? JSON.parse(stored) : DEFAULT_GUESTBOOK;
    const now = new Date();
    const dateStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`;

    items.unshift({ name, msg, date: dateStr });
    localStorage.setItem('jh_guestbook', JSON.stringify(items));

    nameEl.value = '';
    msgEl.value = '';
    loadGuestbook();
  });
}

// Interactive Particle Background (Canvas)
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.7,
    radius: Math.random() * 2 + 1
  }));

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 110})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(renderParticles);
  }
  renderParticles();
}
