document.addEventListener('DOMContentLoaded', async () => {
const navLinks = document.querySelectorAll('.nav-links a');
navLinks.forEach(link => {
    link.addEventListener('mouseover', () => link.style.transform = 'translateY(-2px)');
    link.addEventListener('mouseout', () => link.style.transform = 'translateY(0)');
});

const linkCards = document.querySelectorAll('.link-card');
linkCards.forEach(card => {
    card.addEventListener('click', function (e) {
        if(e.target.closest('.network-status')) return;
        const title = this.querySelector('h3').textContent;
        console.log('Link card clicked:', title);
    });
});

// ==========================================
// Horizontal Scroll Logic
// ==========================================
const slider = document.getElementById('projectSlider');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

const smoothScrollTo = (element, target, duration) => {
    const start = element.scrollLeft;
    const change = target - start;
    const startTime = performance.now();
    const animateScroll = (currentTime) => {
        const timeElapsed = currentTime - startTime;
        if (timeElapsed < duration) {
            const t = timeElapsed / duration;
            const ease = 1 - (--t) * t * t * t; 
            element.scrollLeft = start + change * ease;
            requestAnimationFrame(animateScroll);
        } else { element.scrollLeft = target; }
    };
    requestAnimationFrame(animateScroll);
};

if (slider && prevBtn && nextBtn) {
    const scrollAmount = 430; 
    nextBtn.addEventListener('click', () => { slider.scrollBy({ left: scrollAmount, behavior: 'smooth' }); });
    prevBtn.addEventListener('click', () => { slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); });
    let isTicking = false;
    let scrollTimeout = null;
    
    const snapToNearest = () => {
        const center = slider.scrollLeft + slider.clientWidth / 2;
        let minDistance = Infinity;
        let targetCard = null;
        const cards = slider.querySelectorAll('.scroll-card');
        cards.forEach(card => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - center);
            if (distance < minDistance) { minDistance = distance; targetCard = card; }
        });
        if (targetCard) {
            const targetLeft = targetCard.offsetLeft - (slider.clientWidth - targetCard.offsetWidth) / 2;
            if (Math.abs(slider.scrollLeft - targetLeft) > 5) { smoothScrollTo(slider, targetLeft, 800); }
        }
    };
    
    slider.addEventListener('scroll', () => {
        if (!slider.classList.contains('is-scrolling')) { slider.classList.add('is-scrolling'); }
        window.clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { slider.classList.remove('is-scrolling'); snapToNearest(); }, 150);
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
                const buffer = 10; 
                if(prevBtn) prevBtn.disabled = slider.scrollLeft <= buffer;
                if(nextBtn) nextBtn.disabled = slider.scrollLeft >= maxScrollLeft - buffer;
                isTicking = false;
            });
            isTicking = true;
        }
    });
    prevBtn.disabled = true;
}

// ==========================================
// ✨ Podcast Player & Stack Logic
// ==========================================

// ✨ Podcast Show Data
const podcastShows = [
    {
        id: 'apple_news',
        name: 'Apple\nNews',
        rss: 'https://apple.news/podcast/apple_news_today',
        cover: 'https://news-assets.apple.com/podcast/image/b9e3a3f7-8d79-4d57-de2c-76b84dc3dc1c/PD_News_ShowCovers_ANT.jpg'
    },
    {
        id: 'bbc_6min',
        name: 'BBC\n6 Minute English', 
        rss: 'https://podcasts.files.bbci.co.uk/p02pc9tn.rss', 
        cover: 'https://ichef.bbci.co.uk/images/ic/3000x3000/p0hxqkd0.jpg'
    }
];

let currentShowIndex = 0;
let podcastAudio = null; 
let podcastEpisodes = []; 
let currentPodcastEpisodeIndex = 0; 
let currentAudio = null; 

// Web Audio API Variables
let isVisualizerRunning = false;

// UI Elements
const podcastPlayBtn = document.getElementById('podcastPlayBtn');
const podcastTitleEl = document.getElementById('podcastTitle');
const podcastDescEl = document.getElementById('podcastDesc');
const podcastDateEl = document.getElementById('episodeDate');
const podcastCoverEl = document.getElementById('episodeCover'); 
const podcastProgressBar = document.getElementById('podcastProgress');
const podcastProgressWrapper = document.querySelector('.hero-progress-wrapper'); 
const podcastPlayIcon = podcastPlayBtn ? podcastPlayBtn.querySelector('i') : null;
const toggleDescBtn = document.getElementById('toggleDescBtn');
const podcastTimeEl = document.getElementById('podcastTime');
const playlistContainer = document.getElementById('podcastPlaylist');
const podcastSidebar = document.getElementById('podcastSidebar');
const podcastStack = document.getElementById('podcastStack');

let playlistBackdrop = null;
let isDraggingProgress = false; 

// Helper: Format Time
const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ✨✨✨ BBC Description Formatter
const formatPodcastDescription = (text) => {
    if (!text) return "";
    let formatted = text;
    const headers = [
        "Learning English from the News",
        "SUBSCRIBE TO OUR NEWSLETTER:",
        "FIND BBC LEARNING ENGLISH HERE:",
        "LIKE PODCASTS?",
        "Try some of our other popular podcasts"
    ];
    headers.forEach(headerStr => {
        const safeHeader = headerStr.replace(/\?/g, "\\?");
        const regex = new RegExp(`(${safeHeader})`, 'gi');
        formatted = formatted.replace(regex, "<br><br><strong>$1</strong>");
    });
    formatted = formatted.replace(/([a-z0-9])([A-Z]{2,}[^a-z])/g, "$1<br><br><strong>$2</strong>");
    formatted = formatted.replace(/Find a full transcript/i, "<br><strong>Find a full transcript</strong>");
    formatted = formatted.replace(/(Visit our website)/gi, "<br>$1");
    formatted = formatted.replace(/(Follow us)/gi, "<br>$1");
    formatted = formatted.replace(/(They're all available)/gi, "<br>$1");
    formatted = formatted.replace(/([^ \n\r>])(https?:\/\/)/g, "$1<br>$2");
    formatted = formatted.replace(/([^ \n\r>])(✔️)/g, "$1<br>$2");
    return formatted;
};

const updateVisualizer = () => {
    if (!isVisualizerRunning) return;
    requestAnimationFrame(updateVisualizer);
    const activeItem = document.querySelector('.playlist-item.active');
    if (!activeItem) return;
    const waveBars = activeItem.querySelectorAll('.audio-wave span');
    if (!waveBars.length) return;
    const time = Date.now() / 150;
    waveBars.forEach((bar, i) => {
        const base = 25; 
        const wave = Math.sin(time + i * 1.5) * 20; 
        const noise = Math.random() * 15; 
        const h = Math.max(10, Math.min(100, base + wave + noise));
        bar.style.height = `${h}%`;
    });
};

const updatePlayerState = (isPlaying) => {
    if (isPlaying) {
        if(podcastPlayIcon) {
            podcastPlayIcon.classList.remove('fa-play');
            podcastPlayIcon.classList.add('fa-pause');
        }
        if (!isVisualizerRunning) {
            isVisualizerRunning = true;
            updateVisualizer();
        }
    } else {
        if(podcastPlayIcon) {
            podcastPlayIcon.classList.remove('fa-pause');
            podcastPlayIcon.classList.add('fa-play');
        }
        isVisualizerRunning = false;
    }
    const listItems = document.querySelectorAll('.playlist-item');
    listItems.forEach((item, index) => {
        item.classList.remove('playing');
        if (index === currentPodcastEpisodeIndex && isPlaying) {
            item.classList.add('playing');
        }
    });
};

const updateSlidingBackdrop = (index) => {
    if (!playlistBackdrop) return;
    const items = document.querySelectorAll('.playlist-item');
    if (!items[index]) return;
    const activeItem = items[index];
    const top = activeItem.offsetTop; 
    const height = activeItem.offsetHeight;
    playlistBackdrop.style.transform = `translateY(${top - 6}px)`;
    playlistBackdrop.style.height = `${height}px`;
    playlistBackdrop.style.opacity = '1';
};

const loadPodcastEpisode = (index) => {
    if (index < 0 || index >= podcastEpisodes.length) return;
    currentPodcastEpisodeIndex = index;
    const ep = podcastEpisodes[index];
    if(podcastTitleEl) podcastTitleEl.textContent = ep.title;
    if(podcastDescEl) podcastDescEl.innerHTML = formatPodcastDescription(ep.desc);
    if(podcastDateEl) {
        if (index === 0) {
            podcastDateEl.innerHTML = `${ep.dateStr} <span class="latest-badge">LATEST</span>`;
        } else {
            podcastDateEl.textContent = ep.dateStr;
        }
    }
    if(podcastCoverEl) podcastCoverEl.src = ep.imgUrl;
    if (podcastAudio) {
        podcastAudio.pause();
        podcastAudio = null;
    }
    updatePlayerState(false); 
    if(podcastProgressBar) podcastProgressBar.style.width = '0%';
    if (podcastTimeEl) {
        podcastTimeEl.innerHTML = `<span class="highlight-time">00:00</span> / <span class="highlight-time">${ep.durationStr}</span>`;
    }
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, idx) => {
        if (idx === index) item.classList.add('active');
        else item.classList.remove('active');
    });
    requestAnimationFrame(() => updateSlidingBackdrop(index));
    if(podcastDescEl) {
        podcastDescEl.style.maxHeight = null;
        podcastDescEl.classList.remove('expanded');
    }
    if(toggleDescBtn) toggleDescBtn.classList.remove('rotated');
};

const playPodcast = (index) => {
    if (index !== currentPodcastEpisodeIndex || !podcastAudio) {
        loadPodcastEpisode(index);
    }
    const ep = podcastEpisodes[currentPodcastEpisodeIndex];
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
    }
    if (!podcastAudio) {
        podcastAudio = new Audio();
        podcastAudio.src = ep.mp3Url;
        podcastAudio.addEventListener('timeupdate', () => {
            if (!isDraggingProgress && podcastAudio.duration) {
                const percent = (podcastAudio.currentTime / podcastAudio.duration) * 100;
                if(podcastProgressBar) podcastProgressBar.style.width = `${percent}%`;
                const currentStr = formatTime(podcastAudio.currentTime);
                const totalStr = formatTime(podcastAudio.duration);
                if (podcastTimeEl) {
                    podcastTimeEl.innerHTML = `<span class="highlight-time">${currentStr}</span> / <span class="highlight-time">${totalStr}</span>`;
                }
            }
        });
        podcastAudio.addEventListener('ended', () => {
            updatePlayerState(false);
            if(podcastProgressBar) podcastProgressBar.style.width = '0%';
            const waveBars = document.querySelectorAll('.audio-wave span');
            waveBars.forEach(b => b.style.height = '4px');
        });
    }
    if (podcastAudio.paused) {
        podcastAudio.play().then(() => {
            updatePlayerState(true); 
        }).catch(e => {
            console.error("Play failed:", e);
            if(podcastTitleEl) podcastTitleEl.textContent = "Error playing audio";
        });
    } else {
        podcastAudio.pause();
        updatePlayerState(false);
    }
};

if (podcastProgressWrapper) {
    const updateScrubUI = (clientX) => {
        const rect = podcastProgressWrapper.getBoundingClientRect();
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        podcastProgressBar.style.width = `${percent * 100}%`;
        if(podcastAudio && podcastAudio.duration) {
                const currentTime = percent * podcastAudio.duration;
                const currentStr = formatTime(currentTime);
                const totalStr = formatTime(podcastAudio.duration);
                if (podcastTimeEl) {
                    podcastTimeEl.innerHTML = `<span class="highlight-time">${currentStr}</span> / <span class="highlight-time">${totalStr}</span>`;
                }
        }
        return percent;
    };
    podcastProgressWrapper.addEventListener('mousedown', (e) => {
        isDraggingProgress = true;
        podcastProgressBar.style.transition = 'none'; 
        podcastProgressBar.classList.add('active');
        updateScrubUI(e.clientX);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) {
            e.preventDefault();
            updateScrubUI(e.clientX);
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (isDraggingProgress) {
            isDraggingProgress = false;
            podcastProgressBar.style.transition = ''; 
            podcastProgressBar.classList.remove('active');
            if (podcastAudio && !isNaN(podcastAudio.duration)) {
                const percent = updateScrubUI(e.clientX);
                podcastAudio.currentTime = percent * podcastAudio.duration;
                if(podcastAudio.paused) playPodcast(currentPodcastEpisodeIndex);
            }
        }
    });
    podcastProgressWrapper.addEventListener('touchstart', (e) => {
        isDraggingProgress = true;
        podcastProgressBar.style.transition = 'none';
        podcastProgressBar.classList.add('active');
        updateScrubUI(e.touches[0].clientX);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (isDraggingProgress) {
            e.preventDefault(); 
            updateScrubUI(e.touches[0].clientX);
        }
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
        if (isDraggingProgress) {
            isDraggingProgress = false;
            podcastProgressBar.style.transition = '';
            podcastProgressBar.classList.remove('active');
            if (podcastAudio && !isNaN(podcastAudio.duration)) {
                const rect = podcastProgressWrapper.getBoundingClientRect();
                const currentWidth = parseFloat(podcastProgressBar.style.width);
                const percent = currentWidth / 100;
                podcastAudio.currentTime = percent * podcastAudio.duration;
                if(podcastAudio.paused) playPodcast(currentPodcastEpisodeIndex);
            }
        }
    });
}

const renderPodcastList = () => {
    playlistContainer.innerHTML = ''; 
    const backdrop = document.createElement('div');
    backdrop.className = 'playlist-backdrop';
    playlistContainer.appendChild(backdrop);
    playlistBackdrop = backdrop; 
    podcastEpisodes.forEach((ep, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div class="playlist-item-info">
                <div class="pi-title">${ep.title}</div>
                <div class="pi-date">${ep.dateStr} • ${ep.durationStr}</div>
            </div>
            <div class="status-icon-container">
                <div class="audio-wave">
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
            </div>
        `;
        item.addEventListener('click', () => {
            playPodcast(index);
        });
        playlistContainer.appendChild(item);
    });
};

const fetchPodcastFeed = async (rssUrl) => {
    try {
        const proxyUrl = `https://apple-news-proxy.oops.us.kg/?url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
        const xmlText = await response.text();
        if (xmlText.trim().startsWith('<!DOCTYPE html>')) throw new Error('Received HTML instead of XML.');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        if (xmlDoc.querySelector('parsererror')) throw new Error('XML Parsing failed');
        const items = xmlDoc.querySelectorAll('item');
        if (items.length === 0) throw new Error('No items found');
        let channelImgUrl = "https://news-assets.apple.com/podcast/image/b9e3a3f7-8d79-4d57-de2c-76b84dc3dc1c/PD_News_ShowCovers_ANT.jpg";
        const channelImgTag = xmlDoc.querySelector('channel > itunes\\:image, channel > image > url');
        if (channelImgTag) {
            const xmlImg = channelImgTag.getAttribute('href') || channelImgTag.textContent;
            if (xmlImg) channelImgUrl = xmlImg;
        }
        if (podcastShows[currentShowIndex].cover) {
            channelImgUrl = podcastShows[currentShowIndex].cover;
        }
        podcastEpisodes = []; 
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent.trim() || "Untitled";
            const enclosure = item.querySelector('enclosure');
            if (!enclosure) return; 
            const mp3Url = enclosure.getAttribute('url');
            const pubDateStr = item.querySelector('pubDate')?.textContent;
            const durationEl = item.getElementsByTagName('itunes:duration')[0];
            let durationSecs = 0;
            if (durationEl) {
                const durText = durationEl.textContent;
                if (durText.includes(':')) {
                    const parts = durText.split(':').map(Number);
                    if (parts.length === 3) durationSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    else if (parts.length === 2) durationSecs = parts[0] * 60 + parts[1];
                } else { durationSecs = parseFloat(durText); }
            }
            const durationStr = formatTime(durationSecs);
            const dateObj = new Date(pubDateStr);
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            let imgUrl = channelImgUrl;
            const itemImg = item.getElementsByTagName('itunes:image')[0];
            if (itemImg) imgUrl = itemImg.getAttribute('href');
            if (!itemImg && podcastShows[currentShowIndex].cover) {
                imgUrl = podcastShows[currentShowIndex].cover;
            }
            let desc = item.querySelector('description')?.textContent || "";
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = desc;
            desc = tempDiv.textContent || tempDiv.innerText || "";
            podcastEpisodes.push({
                title, mp3Url, durationStr, dateStr, imgUrl, desc
            });
        });
        if (podcastEpisodes.length > 0) {
            renderPodcastList();
            loadPodcastEpisode(0); 
        } else {
            playlistContainer.innerHTML = '<div class="playlist-loading">No episodes available.</div>';
        }
    } catch (error) {
        console.error('Failed to load podcast:', error);
        if(podcastTitleEl) podcastTitleEl.textContent = "Error loading podcast";
        if(podcastDescEl) podcastDescEl.textContent = "Could not fetch the RSS feed.";
        if(playlistContainer) playlistContainer.innerHTML = '<div class="playlist-loading">Failed to load list.</div>';
    }
};

let isDraggingTimeline = false;
const initSidebar = () => {
    if(!podcastSidebar) return;
    podcastSidebar.innerHTML = '';
    const timelineWrapper = document.createElement('div');
    timelineWrapper.className = 'timeline-wrapper';
    podcastSidebar.appendChild(timelineWrapper);
    const track = document.createElement('div');
    track.className = 'timeline-track';
    timelineWrapper.appendChild(track);
    const indicator = document.createElement('div');
    indicator.className = 'timeline-indicator';
    indicator.id = 'timelineIndicator';
    track.appendChild(indicator);
    podcastShows.forEach((show, index) => {
        const node = document.createElement('div');
        node.className = 'timeline-node';
        node.dataset.index = index;
        const percent = (index / (podcastShows.length - 1)) * 100;
        node.style.left = `${percent}%`;
        node.innerHTML = `
            <div class="timeline-dot"></div>
            <span class="timeline-label">${show.name}</span>
        `;
        node.addEventListener('click', (e) => {
            e.stopPropagation(); 
            switchPodcastShow(index);
        });
        track.appendChild(node);
    });
};

const updateSidebarUI = (index) => {
    const indicator = document.getElementById('timelineIndicator');
    if (indicator) {
        if(!isDraggingTimeline) indicator.style.transition = 'left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
        const percent = (index / (podcastShows.length - 1)) * 100;
        indicator.style.left = `${percent}%`;
    }
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach((n, idx) => {
        if(idx === index) n.classList.add('active');
        else n.classList.remove('active');
    });
};

const initStack = () => {
    if(!podcastStack) return;
    podcastStack.innerHTML = '';
    podcastShows.forEach((show, index) => {
        const card = document.createElement('div');
        card.id = `stack-card-${index}`;
        card.className = 'stack-card'; 
        card.style.backgroundImage = `url(${show.cover})`;
        card.addEventListener('click', () => switchPodcastShow(index));
        podcastStack.appendChild(card);
    });
    updateStack(currentShowIndex);
};

const updateStack = (activeIndex) => {
    const total = podcastShows.length;
    
    podcastShows.forEach((show, index) => {
        const card = document.getElementById(`stack-card-${index}`);
        if(!card) return;
        
        let offset = (index - activeIndex + total) % total;
        card.style.transform = ''; 
        card.style.zIndex = '';
        card.style.opacity = '';
        card.classList.remove('active');

        if (offset === 0) {
            card.style.zIndex = 10;
            card.style.transform = 'translate(-50%, 0) scale(1) rotate(0deg)'; 
            card.style.opacity = 1;
            card.classList.add('active');
        } else {
            let order = offset; 
            if (offset > total / 2) order = offset - total; 

            const xOffset = order * 35; 
            const scale = 1 - (Math.abs(order) * 0.08); 
            const zIndex = 10 - Math.abs(order);
            const rotate = order * 6; 
            
            card.style.zIndex = zIndex;
            card.style.transform = `translate(calc(-50% + ${xOffset}px), 0) scale(${scale}) rotate(${rotate}deg)`;
            card.style.opacity = Math.abs(order) > 2 ? 0 : (1 - Math.abs(order) * 0.2);
        }
    });
};

const switchPodcastShow = (index) => {
    if (index === currentShowIndex && !isDraggingTimeline) return; 
    currentShowIndex = index;
    updateSidebarUI(index);
    updateStack(index);
    if(playlistContainer) playlistContainer.innerHTML = '<div class="playlist-loading"><i class="fas fa-spinner fa-spin"></i> Switching show...</div>';
    if(podcastTitleEl) podcastTitleEl.textContent = "Loading...";
    if (podcastAudio) {
        podcastAudio.pause();
        podcastAudio = null;
        updatePlayerState(false);
    }
    fetchPodcastFeed(podcastShows[currentShowIndex].rss);
};

if (document.getElementById('PodcastHero')) {
    initSidebar(); 
    initStack();   
    fetchPodcastFeed(podcastShows[0].rss);
    window.addEventListener('resize', () => {
        updateStack(currentShowIndex);
    });
    let isSwitching = false; 
    const handleScroll = (direction) => {
        if (isSwitching) return;
        isSwitching = true;
        let newIndex = currentShowIndex + direction;
        if (newIndex < 0) newIndex = podcastShows.length - 1;
        if (newIndex >= podcastShows.length) newIndex = 0;
        switchPodcastShow(newIndex);
        setTimeout(() => { isSwitching = false; }, 600); 
    };
    if (podcastStack) {
        podcastStack.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) handleScroll(1); 
            else handleScroll(-1); 
        }, { passive: false });
        let touchStartX = 0;
        let touchStartY = 0;
        podcastStack.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        podcastStack.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) { 
                if (diffX > 0) handleScroll(1); 
                else handleScroll(-1); 
            }
        }, { passive: true });
    }
    if (toggleDescBtn) {
        toggleDescBtn.addEventListener('click', () => {
            const isExpanded = podcastDescEl.classList.contains('expanded');
            if (isExpanded) {
                podcastDescEl.style.maxHeight = null;
                podcastDescEl.classList.remove('expanded');
            } else {
                podcastDescEl.classList.add('expanded');
                podcastDescEl.style.maxHeight = podcastDescEl.scrollHeight + "px"; 
            }
            toggleDescBtn.classList.toggle('rotated');
        });
    }
    if (podcastPlayBtn) {
        podcastPlayBtn.addEventListener('click', () => {
            playPodcast(currentPodcastEpisodeIndex);
        });
    }
}

const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
};
const calculateFraudScore = (ipString, ispName, analysis) => {
    let score = 0;
    if (analysis.isHosting) score += 40;
    if (analysis.isVPN) score += 30;
    if (analysis.isProxy) score += 20;
    if (analysis.isTor) score += 50;
    let hash = 0;
    for (let i = 0; i < ipString.length; i++) { hash = (hash << 5) - hash + ipString.charCodeAt(i); hash |= 0; }
    const noise = Math.abs(hash % 20);
    return Math.min(100, score + noise);
};
const analyzeNetworkProperties = (ispName, orgName) => {
    const text = (ispName + ' ' + orgName).toLowerCase();
    const result = { isVPN: false, isProxy: false, isTor: false, isRelay: false, isHosting: false, serviceType: 'N/A', isAnyCast: false, isMobile: false, isEdu: false, isSatellite: false };
    const mobileKeywords = ['mobile', 'wireless', 'cellular', 'gsm', 'lte', '5g', '3g', 'gprs', 't-mobile', 'at&t', 'verizon', 'vodafone'];
    const hostingKeywords = ['cloud', 'hosting', 'datacenter', 'server', 'vps', 'cdn', 'akamai', 'cloudflare', 'google', 'amazon', 'aws', 'azure', 'microsoft', 'digitalocean', 'linode', 'ovh'];
    const vpnKeywords = ['vpn', 'proxy', 'gateway', 'anonymous', 'privacy', 'expressvpn', 'nordvpn'];
    const eduKeywords = ['university', 'college', 'school', 'education', '.edu'];
    if (mobileKeywords.some(k => text.includes(k))) { result.isMobile = true; result.serviceType = 'Mobile ISP'; }
    if (vpnKeywords.some(k => text.includes(k))) { result.isVPN = true; result.serviceType = 'VPN Service'; }
    if (hostingKeywords.some(k => text.includes(k))) { result.isHosting = true; }
    if (text.includes('icloud private relay')) { result.isRelay = true; result.isVPN = true; result.isHosting = true; result.serviceType = 'Apple Private Relay'; }
    if (text.includes('tor exit')) { result.isTor = true; }
    if (eduKeywords.some(k => text.includes(k))) { result.isEdu = true; result.serviceType = 'Education Network'; }
    if (['cloudflare', 'google', 'amazon'].some(k => text.includes(k))) { result.isAnyCast = true; }
    if (['starlink', 'satellite'].some(k => text.includes(k))) { result.isSatellite = true; result.serviceType = 'Satellite ISP'; }
    if (result.serviceType === 'N/A') {
        if (result.isHosting) result.serviceType = 'Datacenter / Web Hosting';
        else if (result.isMobile) result.serviceType = 'Mobile Data';
        else result.serviceType = 'Residential ISP';
    }
    return result;
};

const updateDetectionLists = (analysis) => {
    const privacyMap = [
        { id: 'd-vpn', key: 'isVPN' },
        { id: 'd-proxy', key: 'isProxy' },
        { id: 'd-tor', key: 'isTor' },
        { id: 'd-relay', key: 'isRelay' },
        { id: 'd-hosting', key: 'isHosting' }
    ];

    const networkMap = [
        { id: 'd-anycast', key: 'isAnyCast' },
        { id: 'd-mobile', key: 'isMobile' },
        { id: 'd-edu', key: 'isEdu' },
        { id: 'd-satellite', key: 'isSatellite' }
    ];

    const serviceTypeEl = document.getElementById('service-type-val');
    if (serviceTypeEl) serviceTypeEl.textContent = analysis.serviceType;

    const setStatusIcon = (elementId, isTrue) => {
        const li = document.getElementById(elementId);
        if (!li) return;
        const iconSpan = li.querySelector('.status-icon');
        if (iconSpan) {
            iconSpan.className = `status-icon ${isTrue ? 'true' : 'false'}`;
            iconSpan.innerHTML = isTrue ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
        } else {
            const icon = li.querySelector('i');
            if (icon) {
                icon.className = isTrue ? 'fas fa-check-circle status-icon true' : 'fas fa-times-circle status-icon false';
            }
        }
    };

    privacyMap.forEach(item => {
        setStatusIcon(item.id, analysis[item.key] === true);
    });
    networkMap.forEach(item => {
        setStatusIcon(item.id, analysis[item.key] === true);
    });
};
const getIpTagsHTML = (ispName, score, analysis) => {
    let tags = '';
    if (analysis.isHosting || score > 50) tags += `<span class="info-tag tag-idc">IDC (機房)</span>`; 
    else tags += `<span class="info-tag tag-isp">ISP (住宅)</span>`;
    if (analysis.isAnyCast) tags += `<span class="info-tag tag-broadcast">廣播 IP (Anycast)</span>`; 
    else if (analysis.isHosting) tags += `<span class="info-tag tag-broadcast">非原生 (Hosting)</span>`; 
    else tags += `<span class="info-tag tag-native">原生 IP (Native)</span>`;
    return tags;
};

// ======================= 多 API 備用獲取網路資訊 =======================
const API_LIST = [
    {
        name: 'ipwho.is',
        url: 'https://ipwho.is/',
        normalize: (data) => {
            if (!data.success) throw new Error('API success false');
            return {
                ip: data.ip,
                country: data.country,
                country_code: data.country_code,
                city: data.city,
                connection: {
                    asn: data.connection?.asn,
                    org: data.connection?.org,
                    isp: data.connection?.isp
                }
            };
        }
    },
    {
        name: 'ip-api.com',
        url: 'https://ip-api.com/json/',
        normalize: (data) => {
            if (data.status !== 'success') throw new Error('API status not success');
            let asn = null;
            if (data.as) {
                const match = data.as.match(/AS(\d+)/);
                if (match) asn = match[1];
            }
            return {
                ip: data.query,
                country: data.country,
                country_code: data.countryCode,
                city: data.city,
                connection: {
                    asn: asn,
                    org: data.org,
                    isp: data.isp
                }
            };
        }
    },
    {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        normalize: (data) => {
            if (!data.ip) throw new Error('Invalid response');
            let asn = null;
            if (data.asn) {
                const match = data.asn.match(/AS(\d+)/);
                if (match) asn = match[1];
            }
            return {
                ip: data.ip,
                country: data.country_name,
                country_code: data.country,
                city: data.city,
                connection: {
                    asn: asn,
                    org: data.org,
                    isp: data.org   // ipapi.co 沒有分開 isp/org，統一用 org
                }
            };
        }
    }
];

async function fetchNetworkInfo() {
    const updateUI = (data, isV4 = false) => {
        if (isV4) {
            const el = document.getElementById('ip-address-v4');
            if(el) { el.textContent = `IPv4: ${data.ip}`; el.style.display = 'inline-block'; el.classList.add('found'); }
        } else {
            const elV6 = document.getElementById('ip-address-v6');
            const elV4 = document.getElementById('ip-address-v4');
            if (data.ip.includes(':')) {
                if(elV6) { elV6.textContent = `IPv6: ${data.ip}`; elV6.style.display = 'inline-block'; }
            } else {
                 if(elV4) { elV4.textContent = `IPv4: ${data.ip}`; elV4.style.display = 'inline-block'; elV4.classList.add('found'); }
            }
            const locEl = document.getElementById('ip-location');
            if (locEl) locEl.textContent = `${getFlagEmoji(data.country_code)} ${data.country} - ${data.city}`;
            const asnContainer = document.getElementById('asn-tags');
            if (asnContainer) {
                const asnTag = data.connection.asn ? `<span class="info-tag tag-asn">AS${data.connection.asn}</span>` : '';
                const orgTag = (data.connection.org || data.connection.isp) ? `<span class="info-tag tag-org">${data.connection.org || data.connection.isp}</span>` : '';
                asnContainer.innerHTML = asnTag + orgTag;
            }
            const ispName = data.connection.isp || '';
            const orgName = data.connection.org || '';
            const analysis = analyzeNetworkProperties(ispName, orgName);
            const score = calculateFraudScore(data.ip, ispName, analysis);
            const scoreElem = document.getElementById('fraud-score');

            updateDetectionLists(analysis);

            if (scoreElem) {
                scoreElem.textContent = `${score}/100`;
                scoreElem.className = 'value safe-score';
                if (score < 30) scoreElem.style.color = 'var(--status-good)';
                else if (score < 70) scoreElem.style.color = 'var(--status-medium)';
                else scoreElem.style.color = 'var(--status-bad)';
            }
            const tagsEl = document.getElementById('ip-tags');
            if (tagsEl) tagsEl.innerHTML = getIpTagsHTML(ispName, score, analysis);
        }
    };

    for (const api of API_LIST) {
        try {
            console.log(`嘗試使用 ${api.name} 獲取網路資訊...`);
            const response = await fetch(api.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const rawData = await response.json();
            const normalized = api.normalize(rawData);

            updateUI(normalized);

            if (normalized.ip.includes(':')) {
                try {
                    const v4Res = await fetch('https://api.ipify.org?format=json');
                    if (v4Res.ok) {
                        const v4Data = await v4Res.json();
                        updateUI({ ip: v4Data.ip }, true);
                    }
                } catch (e) { console.warn('IPv4 fallback failed', e); }
            }
            console.log(`${api.name} 成功`);
            return;
        } catch (error) {
            console.warn(`${api.name} 失敗:`, error);
        }
    }

    console.error('所有網路資訊 API 皆無法使用');
    const locEl = document.getElementById('ip-location');
    if (locEl) locEl.textContent = '⚠️ 無法獲取網路資訊 (請檢查網路或稍後重試)';
    const scoreElem = document.getElementById('fraud-score');
    if (scoreElem) scoreElem.textContent = '錯誤';
    const tagsEl = document.getElementById('ip-tags');
    if (tagsEl) tagsEl.innerHTML = '<span class="info-tag tag-error">API 全部失敗</span>';
}

setTimeout(fetchNetworkInfo, 500);
    const testLatency = () => {
    const cards = document.querySelectorAll('.link-card[data-test-url]');
    cards.forEach(card => {
        const url = card.dataset.testUrl;
        const statusDot = card.querySelector('.status-dot');
        const latencyText = card.querySelector('.latency-text');
        if (!statusDot || !latencyText) return;

        statusDot.style.backgroundColor = 'var(--status-checking)';
        latencyText.textContent = 'Testing...';
        card.classList.remove('status-good', 'status-medium', 'status-bad');

        const startTime = new Date().getTime();
        const img = new Image();
        let finished = false;
        let timeoutId = null;

        const finishTest = (isSuccess) => {
            if (finished) return;
            finished = true;
            if (timeoutId) clearTimeout(timeoutId);

            const duration = new Date().getTime() - startTime;
            latencyText.textContent = isSuccess ? `${duration}ms` : 'Timeout';

            if (!isSuccess) {
                card.classList.add('status-bad');
            } else if (duration < 200) {
                card.classList.add('status-good');
            } else if (duration < 500) {
                card.classList.add('status-medium');
            } else {
                card.classList.add('status-bad');
            }
        };

        img.onload = () => finishTest(true);
        img.onerror = () => finishTest(false);
        timeoutId = setTimeout(() => finishTest(false), 3000);
        img.src = url + '?t=' + startTime;
    });
};
    setTimeout(testLatency, 1000);
    const refreshBtn = document.getElementById('retest-btn');
    if(refreshBtn) refreshBtn.addEventListener('click', () => { testLatency(); fetchNetworkInfo(); });

    let currentLang = 'zh';
    const langMap = { zh: 'en', en: 'zh' };
    const savedLang = localStorage.getItem('lang') || 'zh';
    if (savedLang !== 'zh') { await applyTranslations(savedLang); currentLang = savedLang; }
    const switchBtn = document.querySelector('.lang-switch');
    if(switchBtn) switchBtn.addEventListener('click', async () => { 
        currentLang = langMap[currentLang]; 
        await applyTranslations(currentLang); 
        localStorage.setItem('lang', currentLang); 
        switchBtn.textContent = currentLang === 'zh' ? 'EN' : '中'; 
    });

    // ========== 綁定音樂卡片點擊事件 (帶有全域通行證) ==========
    // window.attachMusicEvents = function() {
    //     const songCards = document.querySelectorAll('.song-card');
        
    //     songCards.forEach(card => {
    //         card.addEventListener('click', function() {
    //             // 如果播客正在播放，先暫停它
    //             if(podcastAudio && !podcastAudio.paused) {
    //                 podcastAudio.pause();
    //                 updatePlayerState(false); 
    //             }
                
    //             const audioFile = this.dataset.audio;
    //             if(!audioFile) return;
                
    //             // 檢查點擊的是不是當前正在播放的同一首歌
    //             if(currentAudio && currentAudio.src.endsWith(encodeURI(audioFile).split('/').pop())) {
    //                 if(currentAudio.paused) { 
    //                     currentAudio.play(); 
    //                     this.classList.add('playing'); 
    //                 } else { 
    //                     currentAudio.pause(); 
    //                     this.classList.remove('playing'); 
    //                 }
    //             } else {
    //                 // 如果點擊了另一首歌
    //                 if(currentAudio) { 
    //                     currentAudio.pause(); 
    //                     songCards.forEach(c => c.classList.remove('playing')); 
    //                 }
    //                 currentAudio = new Audio(audioFile);
    //                 currentAudio.play();
    //                 this.classList.add('playing');
    //                 currentAudio.addEventListener('ended', () => { 
    //                     this.classList.remove('playing'); 
    //                 });
    //             }
    //         });
    //     });
    // };

    const initSpringSticky = (selector, topOffset = 100) => {
        const element = document.querySelector(selector);
        if (!element || window.innerWidth <= 1000) return;
        let currentY = 0, targetY = 0, velocity = 0;
        const stiffness = 0.05, damping = 0.75;
        const parent = element.parentElement;
        const update = () => {
            if (window.innerWidth <= 1000) {
                element.style.transform = '';
                return;
            }
            const parentRect = parent.getBoundingClientRect();
            let desiredY = window.scrollY - (parentRect.top + window.scrollY) + topOffset;
            desiredY = Math.max(0, Math.min(desiredY, parent.offsetHeight - element.offsetHeight));
            targetY = desiredY;
            const force = (targetY - currentY) * stiffness;
            velocity = (velocity + force) * damping;
            currentY += velocity;
            element.style.transform = `translate3d(0, ${currentY}px, 0)`;
            requestAnimationFrame(update);
        };
        update();
    };
    initSpringSticky('.sticky-profile', 100);
});

async function loadTranslations(lang) { 
    try { 
        const r = await fetch(`${lang}.json`); 
        return r.ok ? await r.json() : {}; 
    } catch(e) { 
        console.warn("Translation load failed", e);
        return {}; 
    } 
}
async function applyTranslations(lang) { 
    const t = await loadTranslations(lang); 
    document.querySelectorAll('[data-i18n]').forEach(el => { 
        if (t[el.dataset.i18n]) el.textContent = t[el.dataset.i18n]; 
    }); 
}
const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) document.documentElement.classList.add('is-mobile');

// ========== 多语言引擎 ==========
let currentLang = localStorage.getItem('lang') || 'zh';

function loadLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    fetch(`./locales/${lang}.json`)
        .then(res => {
            if (!res.ok) throw new Error('Language file not found');
            return res.json();
        })
        .then(translations => {
            applyTranslations(translations);
            // 更新语言切换按钮文本
            document.querySelector('.lang-switch').textContent = lang === 'zh' ? 'EN' : '中文';
            // 重新生成音乐卡片（因为歌曲列表在 JSON 中）
            renderMusic(translations.music.songs);
        })
        .catch(err => console.error('Load language error:', err));
}

function applyTranslations(data) {
    // 遍历所有带有 data-i18n 的元素，设置 innerHTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(data, key);
        if (value !== undefined) {
            // 如果元素内包含 HTML 标签，保留；否则直接文本
            el.innerHTML = value;
        }
    });
}

// 支持点号分隔的键，如 "nav.home"
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 监听语言切换按钮
document.addEventListener('DOMContentLoaded', function() {
    const langSwitch = document.querySelector('.lang-switch');
    langSwitch.addEventListener('click', function() {
        const newLang = currentLang === 'zh' ? 'en' : 'zh';
        loadLanguage(newLang);
    });

    // 初始加载语言
    loadLanguage(currentLang);
});

// ========== 全新音樂播放器核心邏輯 ==========
let musicAudio = new Audio();
let originalSongs = []; // 存儲原始 JSON 的順序
let currentPlaylist = []; // 存儲當前排序後的播放列表
let currentPlayingSong = null; // 當前正在播放的歌曲對象
let isMusicPlaying = false;

// 從 localStorage 獲取喜歡的歌曲列表
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

// UI 元素綁定
const proCover = document.getElementById('pro-cover');
const proTitle = document.getElementById('pro-title');
const proArtist = document.getElementById('pro-artist');
const proPlayBtn = document.getElementById('pro-play-btn');
const proLikeBtn = document.getElementById('pro-like-btn');
const proTimeCurrent = document.getElementById('pro-time-current');
const proTimeTotal = document.getElementById('pro-time-total');
const proSeekbar = document.getElementById('pro-seekbar');
const proPlaylistContainer = document.getElementById('pro-playlist');
const proSortSelect = document.getElementById('pro-sort-select');

// 格式化時間 (輔助函數)
const formatMusicTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// 1. 初始化與渲染音樂 (取代舊的 renderMusic)
window.renderMusic = function(songs) {
    if (!songs || songs.length === 0) return;
    originalSongs = [...songs];
    currentPlaylist = [...songs];
    renderPlaylistView();
    
    // 如果還沒有選擇歌曲，默認加載第一首 (但不自動播放)
    if (!currentPlayingSong) {
        loadSong(currentPlaylist[0], false);
    }
};

// 2. 渲染右側清單
function renderPlaylistView() {
    proPlaylistContainer.innerHTML = '';
    currentPlaylist.forEach((song) => {
        const isLiked = likedSongs.includes(song.title);
        const item = document.createElement('div');
        item.className = 'pro-playlist-item';
        if (currentPlayingSong && currentPlayingSong.title === song.title) {
            item.classList.add('active');
        }
        item.innerHTML = `
            <div class="pro-item-info">
                <span class="pro-item-title">${song.title}</span>
                <span class="pro-item-artist">${song.artist}</span>
            </div>
            <div class="pro-item-like">
                ${isLiked ? '<i class="fas fa-heart"></i>' : ''}
            </div>
        `;
        // 點擊列表播放該歌曲
        item.addEventListener('click', () => {
            loadSong(song, true);
        });
        proPlaylistContainer.appendChild(item);
    });
}

// 3. 加載歌曲並更新左側 UI
function loadSong(song, autoPlay = false) {
    // 解決播客衝突：播放音樂時暫停播客
    if (typeof podcastAudio !== 'undefined' && podcastAudio && !podcastAudio.paused) {
        podcastAudio.pause();
        updatePlayerState(false);
    }

    currentPlayingSong = song;
    musicAudio.src = song.audio;
    proCover.src = song.cover;
    proTitle.textContent = song.title;
    proArtist.textContent = song.artist;
    
    // 更新愛心狀態
    updateLikeButtonUI();

    // 更新右側列表的 Active 狀態
    renderPlaylistView();

    if (autoPlay) {
        togglePlayMusic(true);
    } else {
        togglePlayMusic(false);
    }
}

// 4. 播放/暫停控制 (完美解決只能播不能暫停的問題)
function togglePlayMusic(forcePlay) {
    if (forcePlay === true) {
        musicAudio.play();
        isMusicPlaying = true;
    } else if (forcePlay === false) {
        musicAudio.pause();
        isMusicPlaying = false;
    } else {
        // 切換狀態
        if (musicAudio.paused) {
            musicAudio.play();
            isMusicPlaying = true;
        } else {
            musicAudio.pause();
            isMusicPlaying = false;
        }
    }
    // 更新按鈕圖標
    proPlayBtn.innerHTML = isMusicPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

// 綁定主播放按鈕
proPlayBtn.addEventListener('click', togglePlayMusic);

// 5. 喜歡 (Heart) 功能與 LocalStorage
function updateLikeButtonUI() {
    if (!currentPlayingSong) return;
    const isLiked = likedSongs.includes(currentPlayingSong.title);
    if (isLiked) {
        proLikeBtn.classList.add('liked');
        proLikeBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        proLikeBtn.classList.remove('liked');
        proLikeBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

proLikeBtn.addEventListener('click', () => {
    if (!currentPlayingSong) return;
    const songTitle = currentPlayingSong.title;
    const index = likedSongs.indexOf(songTitle);
    
    if (index > -1) {
        likedSongs.splice(index, 1); // 移除喜歡
    } else {
        likedSongs.push(songTitle); // 加入喜歡
    }
    
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    updateLikeButtonUI();
    renderPlaylistView(); // 刷新列表上的小愛心
});

// 6. 進度條控制
musicAudio.addEventListener('timeupdate', () => {
    if (musicAudio.duration) {
        const percent = (musicAudio.currentTime / musicAudio.duration) * 100;
        proSeekbar.value = percent;
        proTimeCurrent.textContent = formatMusicTime(musicAudio.currentTime);
        proTimeTotal.textContent = formatMusicTime(musicAudio.duration);
    }
});

proSeekbar.addEventListener('input', () => {
    if (musicAudio.duration) {
        const seekTime = (proSeekbar.value / 100) * musicAudio.duration;
        musicAudio.currentTime = seekTime;
    }
});

musicAudio.addEventListener('ended', () => {
    // 自動播放下一首
    document.getElementById('pro-next-btn').click();
});

// 7. 上一首 / 下一首
document.getElementById('pro-next-btn').addEventListener('click', () => {
    if(!currentPlayingSong) return;
    let index = currentPlaylist.findIndex(s => s.title === currentPlayingSong.title);
    let nextIndex = index + 1 >= currentPlaylist.length ? 0 : index + 1;
    loadSong(currentPlaylist[nextIndex], true);
});

document.getElementById('pro-prev-btn').addEventListener('click', () => {
    if(!currentPlayingSong) return;
    let index = currentPlaylist.findIndex(s => s.title === currentPlayingSong.title);
    let prevIndex = index - 1 < 0 ? currentPlaylist.length - 1 : index - 1;
    loadSong(currentPlaylist[prevIndex], true);
});

// 8. 排序功能
proSortSelect.addEventListener('change', (e) => {
    const mode = e.target.value;
    if (mode === 'default') {
        currentPlaylist = [...originalSongs];
    } else if (mode === 'alphabet') {
        currentPlaylist.sort((a, b) => a.title.localeCompare(b.title));
    } else if (mode === 'artist') {
        currentPlaylist.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (mode === 'liked') {
        currentPlaylist = originalSongs.filter(song => likedSongs.includes(song.title));
        if(currentPlaylist.length === 0) {
            alert('你還沒有喜歡的歌曲哦！顯示默認列表。');
            proSortSelect.value = 'default';
            currentPlaylist = [...originalSongs];
        }
    }
    renderPlaylistView();
});