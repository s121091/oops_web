// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 导航链接的鼠标悬停效果
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
      link.addEventListener('mouseover', () => link.style.transform = 'translateY(-2px)');
      link.addEventListener('mouseout', () => link.style.transform = 'translateY(0)');
  });

  // 技能卡片的点击效果（如果需要更多交互可以在这里扩展）
  const skillCards = document.querySelectorAll('.skill-card');
  skillCards.forEach(card => {
      card.addEventListener('click', function () {
          // 这里可以添加点击后的额外逻辑，比如统计点击次数等
          console.log('Skill card clicked:', this.querySelector('h3').textContent);
      });
  });

  // 视频卡片的悬停效果（动态遮罩）
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(card => {
      const thumbnail = card.querySelector('.video-thumbnail');
      card.addEventListener('mouseover', () => thumbnail.style.backgroundBlendMode = 'normal');
      card.addEventListener('mouseout', () => thumbnail.style.backgroundBlendMode = 'multiply');
  });

  // 音乐卡片的悬停效果
  const songCards = document.querySelectorAll('.song-card');
  songCards.forEach(card => {
      card.addEventListener('mouseover', () => card.style.transform = 'translateY(-5px)');
      card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');
  });
});

// 增加国际化功能
let currentLang = 'zh'; // 默认中文
const langMap = { zh: 'en', en: 'zh' };

async function loadTranslations(lang) {
    const response = await fetch(`/${lang}.json`);
    return await response.json();
}

async function applyTranslations(lang) {
    const translations = await loadTranslations(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

// 初始化加载中文
document.addEventListener('DOMContentLoaded', async () => {
    // ...原有其他代码

    // 语言切换功能
    document.querySelector('.lang-switch').addEventListener('click', async () => {
        currentLang = langMap[currentLang];
        await applyTranslations(currentLang);
        localStorage.setItem('lang', currentLang);
        document.querySelector('.lang-switch').textContent = currentLang === 'zh' ? 'EN' : '中';
    });

    // 加载保存的语言设置
    const savedLang = localStorage.getItem('lang') || 'zh';
    if (savedLang !== 'zh') {
        await applyTranslations(savedLang);
        currentLang = savedLang;
        document.querySelector('.lang-switch').textContent = currentLang === 'zh' ? 'EN' : '中';
    }
});


