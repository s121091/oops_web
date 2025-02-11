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

// 在DOMContentLoaded事件监听器内添加:

// 音乐播放控制
let currentAudio = null;

document.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', function() {
        const audioFile = this.dataset.audio;
        
        // 如果当前正在播放的音频与点击的相同
        if(currentAudio && currentAudio.src.endsWith(audioFile)) {
            if(currentAudio.paused) {
                currentAudio.play();
                this.classList.add('playing');
            } else {
                currentAudio.pause();
                this.classList.remove('playing');
            }
        } else {
            // 暂停其他正在播放的音频
            if(currentAudio) {
                currentAudio.pause();
                document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
            }
            
            // 创建新音频实例
            currentAudio = new Audio(audioFile);
            currentAudio.play();
            this.classList.add('playing');
            
            // 音频结束监听
            currentAudio.addEventListener('ended', () => {
                this.classList.remove('playing');
            });
        }
    });
});

// 在DOMContentLoaded事件内添加:
document.querySelectorAll('.video-card').forEach(card => {
    const thumbnail = card.querySelector('.video-thumbnail');
    const defaultImg = card.dataset.defaultImage;
    const hoverImg = card.dataset.hoverImage;

    // 動態設置CSS變量
    thumbnail.style.setProperty('--default-img', `url(${defaultImg})`);
    thumbnail.style.setProperty('--hover-img', `url(${hoverImg})`);

    // 預加載懸浮圖片
    new Image().src = hoverImg;
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 视频卡片的悬停效果（切换图片）
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        const thumbnail = card.querySelector('.video-thumbnail');
        const originalUrl = thumbnail.style.backgroundImage;
        const hoverUrl = thumbnail.dataset.hoverUrl;

        card.addEventListener('mouseover', () => {
            thumbnail.style.backgroundImage = `url(${hoverUrl})`;
        });

        card.addEventListener('mouseout', () => {
            thumbnail.style.backgroundImage = originalUrl;
        });
    });
});

// 在现有的DOMContentLoaded事件监听器中添加:
document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        const headerOffset = 80; // 根据导航栏高度调整
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    });
});
