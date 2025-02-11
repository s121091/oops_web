// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 导航链接的鼠标悬停效果
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        // 鼠标悬停时上移2px
        link.addEventListener('mouseover', () => link.style.transform = 'translateY(-2px)');
        // 鼠标移出时恢复原位
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

    // 视频卡片的悬停效果（动态遮罩和切换图片）
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        const thumbnail = card.querySelector('.video-thumbnail');
        const defaultImg = card.dataset.defaultImage;
        const hoverImg = card.dataset.hoverImage;

        // 动态设置CSS变量
        thumbnail.style.setProperty('--default-img', `url(${defaultImg})`);
        thumbnail.style.setProperty('--hover-img', `url(${hoverImg})`);

        // 预加载悬浮图片
        new Image().src = hoverImg;

        const originalUrl = thumbnail.style.backgroundImage;
        const hoverUrl = thumbnail.dataset.hoverUrl;

        card.addEventListener('mouseover', () => {
            thumbnail.style.backgroundBlendMode = 'normal';
            thumbnail.style.backgroundImage = `url(${hoverUrl})`;
        });

        card.addEventListener('mouseout', () => {
            thumbnail.style.backgroundBlendMode = 'multiply';
            thumbnail.style.backgroundImage = originalUrl;
        });
    });

    // 音乐卡片的悬停效果和播放控制
    const songCards = document.querySelectorAll('.song-card');
    let currentAudio = null;

    songCards.forEach(card => {
        card.addEventListener('mouseover', () => card.style.transform = 'translateY(-5px)');
        card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');

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
                    songCards.forEach(c => c.classList.remove('playing'));
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

    // 增加国际化功能
    let currentLang = 'zh'; // 默认中文
    const langMap = { zh: 'en', en: 'zh' };

    // 加载保存的语言设置
    const savedLang = localStorage.getItem('lang') || 'zh';
    if (savedLang !== 'zh') {
        await applyTranslations(savedLang);
        currentLang = savedLang;
        document.querySelector('.lang-switch').textContent = currentLang === 'zh' ? 'EN' : '中';
    }

    // 语言切换功能
    document.querySelector('.lang-switch').addEventListener('click', async () => {
        currentLang = langMap[currentLang];
        await applyTranslations(currentLang);
        localStorage.setItem('lang', currentLang);
        document.querySelector('.lang-switch').textContent = currentLang === 'zh' ? 'EN' : '中';
    });

    // 导航栏锚点平滑滚动
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
});

// 异步加载翻译文件
async function loadTranslations(lang) {
    const response = await fetch(`/${lang}.json`);
    return await response.json();
}

// 应用翻译
async function applyTranslations(lang) {
    const translations = await loadTranslations(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}
