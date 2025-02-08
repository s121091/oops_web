function handleClick() {
    alert('按钮被点击了！');
}

// 卡片懒加载
function handleScroll() {
    const windowHeight = window.innerHeight;
    const cards = document.querySelectorAll('.card:not(.show)');

    cards.forEach(card => {
        if (card.getBoundingClientRect().top <= windowHeight - 50) {
            card.classList.add('show');
        }
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    handleScroll();
    document.addEventListener('scroll', debounce(handleScroll, 100));
});

// 滚动到锚点
function scrollToFavourite(e) {
    e.preventDefault();
    const target = document.getElementById('Favourite-anchor');
    if (target) {
        window.scrollTo({
            top: target.offsetTop - 200,
            behavior: 'smooth'
        });
    }
}

// 打开/关闭侧边菜单
function toggleMenu() {
    document.body.classList.toggle('menu-open');
}

// 控制页脚显示
window.addEventListener('scroll', () => {
    const footer = document.querySelector('.mobile-only');
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - 100) {
        footer.style.visibility = 'visible';
    } else {
        footer.style.visibility = 'hidden';
    }
});

// 添加事件监听器
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', scrollToFavourite);
});

document.querySelector('.navbar-toggler').addEventListener('click', toggleMenu);
document.querySelector('.close-button').addEventListener('click', toggleMenu);

document.querySelector('.cta-btn').addEventListener('click', handleClick);
