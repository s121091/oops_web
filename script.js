function handleClick() {
    alert('按钮被点击了！');
}

function handleScroll() {
    const windowHeight = window.innerHeight;
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        if (cardRect.top < windowHeight - 50) {
            card.classList.add('show');
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

function init() {
    handleScroll();
    document.addEventListener('scroll', debounce(handleScroll, 100));
}

document.addEventListener('DOMContentLoaded', init);

function scrollToFavourite(event) {
    event.preventDefault();
    const target = document.getElementById('Favourite-anchor');
    if (target) {
        const offset = -200;
        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition + offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function toggleMenu() {
    const secondaryMenu = document.querySelector('.secondary-menu');
    secondaryMenu.classList.toggle('visible');
}

function showFooterOnScroll() {
    const footer = document.querySelector('.footer');
    const scrollThreshold = 100; /* 距离底部 100px 时显示页脚 */

    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - scrollThreshold) {
        footer.style.visibility = 'visible';
        window.removeEventListener('scroll', showFooterOnScroll);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    /* 监听滚动事件 */
    window.addEventListener('scroll', showFooterOnScroll);
});
