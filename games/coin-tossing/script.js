const i18n = {
    'zh-TW': {
        langSwitch: 'EN', backHome: '返回主頁', pageTitle: 'Biased Coin Tossing Lab',
        subtitle: '-- 概率論與折騰的奇妙碰撞 --',
        alertWarning: '賭博無必勝，折騰有極限。如果發現自己對概率遊戲產生依賴，請及時尋求幫助。',
        hotline: '香港戒賭中心熱線: +852 2426 6262', visitSite: '訪問戒賭輔導網站 <i class="fas fa-external-link-alt"></i>',
        paramTitle: '<i class="fas fa-sliders-h"></i> 實驗參數設置',
        modeRandom: '隨機', modeFixed: '自定義概率', tossNum: '拋擲數量',
        accumulateHint: '* 每次點擊拋擲將會把數量「累積」到總數據中', nonAccumulateHint: '* 自定義模式不累積，每次均為獨立拋擲',
        probHeads: '正面概率 (Heads)', probTails: '反面概率 (Tails)', randomHint: '* 隨機模式下強制使用 50% 真實隨機率',
        btnReset: '<i class="fas fa-undo"></i> 重置', btnTossAcc: '拋擲', btnToss: '拋擲',
        fallacyTitle: '<i class="fas fa-brain"></i> 認知突破：大數法則與賭徒謬誤',
        fallacyP1: '下一投出現正面的理論概率：',
        fallacyP2: '<br><br>不管您之前连续抛出了多少次，下一投出现正面的理论概率永远是50%，因为硬币并没有记忆。<br><br>所以每一次抛掷都是<strong>完全独立的事件</strong>。<br><br>但人们常误以为「越抛不中，下次中奖机率越大」，但透过右侧的常态分布你可以清楚发现，这只是认知的偏差。',
        boardTitle: '<i class="fas fa-chart-pie"></i> 結果看板',
        totalTosses: '總計拋擲', currentTosses: '本次拋擲', accHeads: '累積正面', accTails: '累積反面',
        singleHeads: '本次正面', singleTails: '本次反面', maxStreak: '最長連擊', luckEval: '運氣評估',
        rawStreamTitle: '<i class="fas fa-terminal"></i> 歷史數據流 (Raw Stream)',
        waitingData: '等待拋擲數據寫入...', dataTooLarge: '(數據量過大，僅展示最後 1500 筆)',
        unitToss: '拋', unitTimes: '次', chartTitle: '常態分佈理論值 vs 實際落點', xAxis: '正面出現次數',
        luckSSR1: '歐氣爆表 (SSR)', luckSR: '手氣極佳 (SR)', luckSSR2: '天選非酋 (SSR)', luckR: '手氣略背 (R)', luckN: '正常水平 (N)',
        yAxis: '出現概率 (Probability)', tooltipProb: '發生概率約' // ✨ 新增 Y 軸與 Tooltip 翻譯 ✨
    },
    'en': {
        langSwitch: '中文', backHome: 'Back to Home', pageTitle: 'Biased Coin Tossing Lab',
        subtitle: '-- Where Probability Meets Tinkering --',
        alertWarning: 'Gambling has no guaranteed win. If you find yourself addicted, please seek help immediately.',
        hotline: 'HK Gamblers Recovery Hotline: +852 2426 6262', visitSite: 'Visit Recovery Website <i class="fas fa-external-link-alt"></i>',
        paramTitle: '<i class="fas fa-sliders-h"></i> Parameters',
        modeRandom: 'Random', modeFixed: 'Custom Prob.', tossNum: 'Number of Tosses',
        accumulateHint: '* Each toss will be ACCUMULATED to the total data', nonAccumulateHint: '* Custom mode does NOT accumulate. Independent rolls.',
        probHeads: 'Heads Probability', probTails: 'Tails Probability', randomHint: '* Forced 50% true random probability in Random mode',
        btnReset: '<i class="fas fa-undo"></i> Reset', btnTossAcc: 'Toss', btnToss: 'Toss Coin',
        fallacyTitle: '<i class="fas fa-brain"></i> Gambler\'s Fallacy',
        fallacyP1: 'Theoretical probability for next toss: ',
        fallacyP2: '<br><br>No matter how many times you have thrown it in a row before, the theoretical probability of the next positive one is always 50%, because the coin has no memory. <br><br>Therefore, each throw is <strong>a completely independent event</strong>. <br><br>However, people often mistakenly think that "the more you miss, the greater the chance of winning the next prize", but through the normal distribution on the right, you can clearly find that this is just a cognitive deviation.',
        boardTitle: '<i class="fas fa-chart-pie"></i> Dashboard',
        totalTosses: 'Total Tosses', currentTosses: 'Current Tosses', accHeads: 'Total Heads', accTails: 'Total Tails',
        singleHeads: 'Current Heads', singleTails: 'Current Tails', maxStreak: 'Max Streak', luckEval: 'Luck Rating',
        rawStreamTitle: '<i class="fas fa-terminal"></i> Raw Stream',
        waitingData: 'Waiting for data...', dataTooLarge: '(Data too large, displaying last 1500 records)',
        unitToss: 'toss', unitTimes: 'x', chartTitle: 'Normal Distribution vs Actual Landing', xAxis: 'Number of Heads',
        luckSSR1: 'Extremely Lucky (SSR)', luckSR: 'Very Lucky (SR)', luckSSR2: 'Extremely Unlucky (SSR)', luckR: 'Unlucky (R)', luckN: 'Normal (N)',
        yAxis: 'Probability', tooltipProb: 'Probability ≈' // ✨ Add Y-axis and Tooltip translation ✨
    }
};

let currentLang = 'zh-TW';

function toggleLanguage() {
    currentLang = currentLang === 'zh-TW' ? 'en' : 'zh-TW';
    document.querySelector('.lang-switch').innerText = i18n[currentLang].langSwitch;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang][key]) {
            el.innerHTML = i18n[currentLang][key];
        }
    });

    updateModeLabels();
    if(globalHistory.length > 0) {
        updateDashboard(parseFloat(probInput.value)); // Refresh chart and luck text
    }
}

// --- 全局狀態 ---
let globalHistory = []; 
let chartInstance = null;
let currentMode = 'random'; // 預設模式為 'random'

const numInput = document.getElementById("input_tosses_num");
const rangeInput = document.getElementById("input_tosses_range");
const probInput = document.getElementById("input_probability");
const probRange = document.getElementById("input_prob_range");
const tailsProbInput = document.getElementById("input_tails_probability");
const tailsProbRange = document.getElementById("input_tails_prob_range");

numInput.addEventListener('input', (e) => { rangeInput.value = e.target.value; });
rangeInput.addEventListener('input', (e) => { numInput.value = e.target.value; });

function syncProb(source) {
    let val = parseFloat(source.value);
    if (isNaN(val)) return;
    if (val < 0) val = 0; if (val > 1) val = 1;
    
    let heads, tails;
    if (source.id.includes('tails')) {
        tails = val; heads = 1 - tails;
    } else {
        heads = val; tails = 1 - heads;
    }
    heads = Math.round(heads * 100) / 100;
    tails = Math.round(tails * 100) / 100;
    
    probInput.value = heads; probRange.value = heads;
    tailsProbInput.value = tails; tailsProbRange.value = tails;
}

probInput.addEventListener('input', (e) => syncProb(e.target));
probRange.addEventListener('input', (e) => syncProb(e.target));
tailsProbInput.addEventListener('input', (e) => syncProb(e.target));
tailsProbRange.addEventListener('input', (e) => syncProb(e.target));

document.addEventListener('DOMContentLoaded', () => {
    setMode('random');
});

// --- 動態標籤更新 ---
function updateModeLabels() {
    const accHint = document.getElementById("acc_hint");
    const btnToss = document.getElementById("btn_toss_text");
    const lHeads = document.getElementById("label_heads");
    const lTails = document.getElementById("label_tails");
    const lTotal = document.getElementById("label_total");

    if (currentMode === 'random') {
        accHint.innerHTML = i18n[currentLang].accumulateHint;
        btnToss.innerHTML = i18n[currentLang].btnTossAcc;
        lHeads.innerHTML = `<i class="fas fa-circle highlight-text"></i> <span data-i18n="accHeads">${i18n[currentLang].accHeads}</span>`;
        lTails.innerHTML = `<i class="fas fa-circle" style="color:#cbd5e1;"></i> <span data-i18n="accTails">${i18n[currentLang].accTails}</span>`;
        lTotal.innerHTML = `<i class="fas fa-layer-group" style="color: #64748b;"></i> <span data-i18n="totalTosses">${i18n[currentLang].totalTosses}</span>`;
    } else {
        accHint.innerHTML = i18n[currentLang].nonAccumulateHint;
        btnToss.innerHTML = i18n[currentLang].btnToss;
        lHeads.innerHTML = `<i class="fas fa-circle highlight-text"></i> <span data-i18n="singleHeads">${i18n[currentLang].singleHeads}</span>`;
        lTails.innerHTML = `<i class="fas fa-circle" style="color:#cbd5e1;"></i> <span data-i18n="singleTails">${i18n[currentLang].singleTails}</span>`;
        lTotal.innerHTML = `<i class="fas fa-layer-group" style="color: #64748b;"></i> <span data-i18n="currentTosses">${i18n[currentLang].currentTosses}</span>`;
    }
}

// --- 模式切換邏輯 ---
function setMode(mode) {
    resetAll(); // 切換模式強制清空
    currentMode = mode;
    document.getElementById("btn_mode_fixed").classList.remove('active');
    document.getElementById("btn_mode_random").classList.remove('active');
    document.getElementById(`btn_mode_${mode}`).classList.add('active');

    const probHint = document.getElementById("prob_hint");

    if (mode === 'random') {
        numInput.min = 1; rangeInput.min = 1;
        numInput.value = 1; rangeInput.value = 1;
        probInput.value = 0.5; probRange.value = 0.5;
        tailsProbInput.value = 0.5; tailsProbRange.value = 0.5;
        
        probInput.disabled = true; probRange.disabled = true;
        tailsProbInput.disabled = true; tailsProbRange.disabled = true;
        
        probHint.style.display = 'block';
        document.getElementById("gamblers_fallacy_notice").style.display = "block";
    } else {
        // 自定義機率模式，強迫拋擲數量從 2 起步
        numInput.min = 2; rangeInput.min = 2;
        if (parseInt(numInput.value) < 2) {
            numInput.value = 2; rangeInput.value = 2;
        }
        probInput.disabled = false; probRange.disabled = false;
        tailsProbInput.disabled = false; tailsProbRange.disabled = false;
        
        probHint.style.display = 'none';
        document.getElementById("gamblers_fallacy_notice").style.display = "none";
    }
    updateModeLabels();
}

function generateResult(prob) {
    if (currentMode === 'random') {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return (array[0] / 4294967295) < 0.5 ? "H" : "T";
    } else {
        return Math.random() < prob ? "H" : "T";
    }
}

function normalPDF(x, mu, sigma) {
    if (sigma === 0) return x === mu ? 1 : 0;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

// --- 啟動模擬流程 ---
function startSimulation() {
    const tossesToAdd = parseInt(numInput.value);
    const prob = parseFloat(probInput.value);

    if (isNaN(tossesToAdd) || tossesToAdd < parseInt(numInput.min) || isNaN(prob) || prob < 0 || prob > 1) {
        alert(`Oops! 拋擲數量不可低於 ${numInput.min}，且概率介於 0.0 到 1.0 之間！`);
        return;
    }

    // 自定義模式：不累計，每次重新開始
    if (currentMode === 'fixed') {
        globalHistory = [];
    }

    if (globalHistory.length === 0) {
        probInput.disabled = true; probRange.disabled = true;
        tailsProbInput.disabled = true; tailsProbRange.disabled = true;
    }

    for (let i = 0; i < tossesToAdd; i++) {
        globalHistory.push(generateResult(prob));
    }

    updateDashboard(prob);
}

function updateDashboard(prob) {
    const totalTosses = globalHistory.length;
    if (totalTosses === 0) return;

    let headsCount = 0; let currentStreak = 0; let maxStreak = 0;
    let lastResult = ""; let htmlBuffer = "";

    for (let i = 0; i < totalTosses; i++) {
        const result = globalHistory[i];
        if (result === "H") headsCount++;

        if (result === lastResult) { currentStreak++; } 
        else { currentStreak = 1; lastResult = result; }
        if (currentStreak > maxStreak) { maxStreak = currentStreak; }

        if (totalTosses - i <= 1500) {
            htmlBuffer += `<span class="tag-${result.toLowerCase()}">${result}</span>`;
        }
    }

    const tailsCount = totalTosses - headsCount;

    document.getElementById("total_tosses_badge").innerHTML = `${totalTosses}<span data-i18n="unitToss">${i18n[currentLang].unitToss}</span>`;
    document.getElementById("res_heads").innerHTML = `${headsCount}<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span> (${(headsCount/totalTosses*100).toFixed(1)}%)`;
    document.getElementById("res_tails").innerHTML = `${tailsCount}<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span> (${(tailsCount/totalTosses*100).toFixed(1)}%)`;
    document.getElementById("res_streak").innerHTML = `${maxStreak}<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span>`;

    // Z-Score 運氣評估
    const expected = totalTosses * (currentMode === 'random' ? 0.5 : prob);
    const variance = totalTosses * (currentMode === 'random' ? 0.5 : prob) * (1 - (currentMode === 'random' ? 0.5 : prob));
    const stdDev = Math.sqrt(variance);
    
    let luckKey = "luckN"; let luckColor = "var(--secondary-color)";
    if (stdDev > 0) {
        const zScore = (headsCount - expected) / stdDev;
        if (zScore > 2.5) { luckKey = "luckSSR1"; luckColor = "#FF6B35"; }
        else if (zScore > 1.5) { luckKey = "luckSR"; luckColor = "#facc15"; }
        else if (zScore < -2.5) { luckKey = "luckSSR2"; luckColor = "#3b82f6"; }
        else if (zScore < -1.5) { luckKey = "luckR"; luckColor = "#94a3b8"; }
    }
    const luckEl = document.getElementById("res_luck");
    luckEl.innerHTML = `<span data-i18n="${luckKey}">${i18n[currentLang][luckKey]}</span>`;
    luckEl.style.color = luckColor;

    const streamBox = document.getElementById("history_stream");
    if (totalTosses > 1500) {
        streamBox.innerHTML = `<div style="width: 100%; color: #888; font-size: 0.85rem; padding-bottom: 8px;" data-i18n="dataTooLarge">${i18n[currentLang].dataTooLarge}</div>` + htmlBuffer;
    } else {
        streamBox.innerHTML = htmlBuffer;
    }
    streamBox.scrollTop = streamBox.scrollHeight;

    updateDistributionChart(totalTosses, prob, headsCount, expected, stdDev);
}

// --- 核心：繪製常態分佈理論值 vs 實際落點 (移除歷史軌跡) ---
function updateDistributionChart(N, p, actualHeads, mu, sigma) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    // X軸動態縮放：顯示期望值周圍 4 個標準差
    let minX = Math.max(0, Math.floor(mu - 4 * sigma));
    let maxX = Math.min(N, Math.ceil(mu + 4 * sigma));
    
    if (N <= 20) { minX = 0; maxX = N; } 
    
    const labels = [];
    const dataNormal = [];
    let actualY = normalPDF(actualHeads, mu, sigma);

    for (let x = minX; x <= maxX; x++) {
        labels.push(x);
        dataNormal.push(normalPDF(x, mu, sigma));
    }

    const chartTitle = i18n[currentLang].chartTitle;
    const xAxisLabel = i18n[currentLang].xAxis;
    const currentLabel = currentLang === 'zh-TW' ? '最新落點 (Actual)' : 'Current (Actual)';
    const expectedLabel = currentLang === 'zh-TW' ? '理論分佈曲線 (Expected)' : 'Expected Curve';
    const yAxisLabel = i18n[currentLang].yAxis;
    const tooltipProbText = i18n[currentLang].tooltipProb;

    if (!chartInstance) {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: currentLabel,
                        data: labels.map(x => (x === actualHeads ? actualY : null)),
                        borderColor: '#FF6B35', backgroundColor: '#FF6B35',
                        pointRadius: 8, pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 10,
                        type: 'scatter', order: 1
                    },
                    {
                        label: expectedLabel,
                        data: dataNormal,
                        borderColor: '#cbd5e1', backgroundColor: 'rgba(203, 213, 225, 0.2)',
                        borderWidth: 2, fill: true, pointRadius: 0, tension: 0.4, order: 2
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                animation: false, // ✨ 關閉動畫，讓落點每次直接浮現在目標位置，不再從底部拉上來 ✨
                plugins: { 
                    legend: { 
                        position: 'top',
                        onClick: function(e, legendItem, legend) {
                            if (legendItem.datasetIndex === 1) return; // 鎖定理論曲線不給點擊隱藏
                            Chart.defaults.plugins.legend.onClick.call(this, e, legendItem, legend);
                        }
                    },
                    title: { display: true, text: chartTitle, font: { size: 14 } },
                    tooltip: { // ✨ 添加通俗易懂的懸停解釋 ✨
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${tooltipProbText} ${(context.parsed.y * 100).toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: xAxisLabel }, grid: { display: false } },
                    y: { display: true, title: { display: true, text: yAxisLabel }, beginAtZero: true } // ✨ 開啟 Y 軸並加上標題 ✨
                }
            }
        });
    } else {
        chartInstance.options.plugins.title.text = chartTitle;
        chartInstance.options.scales.x.title.text = xAxisLabel;
        chartInstance.options.scales.y.title.text = yAxisLabel;
        chartInstance.data.datasets[0].label = currentLabel;
        chartInstance.data.datasets[1].label = expectedLabel;

        // 更新 Tooltip 的語言
        chartInstance.options.plugins.tooltip.callbacks.label = function(context) {
            return `${context.dataset.label}: ${tooltipProbText} ${(context.parsed.y * 100).toFixed(2)}%`;
        };

        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = labels.map(x => (x === actualHeads ? actualY : null));
        chartInstance.data.datasets[1].data = dataNormal;
        chartInstance.update();
    }
}

function resetAll() {
    globalHistory = []; 
    
    if (currentMode === 'fixed') {
        probInput.disabled = false; probRange.disabled = false;
        tailsProbInput.disabled = false; tailsProbRange.disabled = false;
    }
    
    document.getElementById("total_tosses_badge").innerHTML = `0<span data-i18n="unitToss">${i18n[currentLang].unitToss}</span>`;
    document.getElementById("res_heads").innerHTML = `0<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span>`;
    document.getElementById("res_tails").innerHTML = `0<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span>`;
    document.getElementById("res_streak").innerHTML = `0<span data-i18n="unitTimes">${i18n[currentLang].unitTimes}</span>`;
    
    const luckEl = document.getElementById("res_luck");
    luckEl.innerHTML = "-"; luckEl.style.color = "var(--secondary-color)";
    
    document.getElementById("history_stream").innerHTML = `<span style="color: #666; font-size: 0.95rem;" data-i18n="waitingData">${i18n[currentLang].waitingData}</span>`;
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}