// 缓存 DOM 元素
const cardContainer = document.querySelector('.card-container');
const cards = document.querySelectorAll('.card');

// 处理按钮点击
function handleClick() {
    alert('按钮被点击了！');
}

// 滚动处理函数
function handleScroll() {
    const windowHeight = window.innerHeight;

    // 控制卡片的显示动画
    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        if (cardRect.top < windowHeight - 50) {
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

// 初始化函数
function init() {
    // 检查初始状态下卡片是否在视口内
    handleScroll();

    // 添加滚动事件监听器，使用防抖
    document.addEventListener('scroll', debounce(handleScroll, 100));
}

// 当内容加载完成后，执行初始化
document.addEventListener('DOMContentLoaded', init);

function scrollToFavourite(event) {
    event.preventDefault(); // 阻止默认的锚点跳转行为

    const target = document.getElementById('Favourite');
    const offset = -10; // 偏移量，负值表示向上偏移

    if (target) {
        // 获取元素相对于文档顶部的位置
        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        // 计算偏移后的滚动位置
        const offsetPosition = elementPosition + offset;

        // 平滑滚动到偏移后的位置
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth' // 可选，去掉则为瞬间滚动
        });
    }
}

