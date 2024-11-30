// 模擬股票資料
// 模擬股票資料來自TWSE,但僅包含前10檔市值最大的股票
const mockStocks = [
    { code: '2330', name: '台灣積體電路製造' },
    { code: '2317', name: '鴻海精密工業' },
    { code: '2454', name: '聯發科技' },
    { code: '2412', name: '中華電信' },
    { code: '2308', name: '台達電子' },
    { code: '2881', name: '富邦金控' },
    { code: '2303', name: '聯電' },
    { code: '2882', name: '國泰金控' },
    { code: '1303', name: '南亞' },
    { code: '2891', name: '中信金控' }
];

// 全域變數存儲圖表實例和最新分析結果
let priceChart = null;
let probabilityChart = null;
let currentAnalysisData = null;

// 增加圖表配置選項
const chartOptions = {
    responsive: true,
    animation: {
        duration: 0 // 停用動畫以提升效能
    },
    plugins: {
        decimation: {
            enabled: true,
            algorithm: 'min-max'
        }
    }
};

const chartConfig = {
    options: {
        responsive: true,
        animation: false,
        elements: {
            line: {
                tension: 0 // 關閉平滑曲線
            }
        },
        plugins: {
            decimation: {
                enabled: true,
                algorithm: 'min-max',
                samples: 100 // 限制採樣點數
            }
        }
    }
};

// 初始化股票選單
function initializeStockSelect() {
    const select = document.getElementById('stock-select');
    mockStocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.code;
        option.textContent = `${stock.code} - ${stock.name}`;
        select.appendChild(option);
    });
}

// 更新滑桿值顯示
function updateRangeValue(inputId) {
    const input = document.getElementById(inputId);
    const valueSpan = document.getElementById(`${inputId}-value`);
    valueSpan.textContent = input.value;
    input.addEventListener('input', () => {
        valueSpan.textContent = input.value;
    });
}

// 添加快取機制
const dataCache = new Map();

async function generateAnalysisData(stockCode, params) {
    const cacheKey = `${stockCode}-${JSON.stringify(params)}`;

    // 檢查快取
    if (dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分鐘快取
            return cached.data;
        }
    }

    try {
        const data = await fetchStockData(stockCode, params);
        // 存入快取
        dataCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        return data;
    } catch (error) {
        return generateMockData(stockCode, params);
    }
}

// 模擬分析資料生成
function generateMockData(stockCode, params) {
    let basePrice;
    let volatility;

    // Function to estimate price range based on stock code
    function getStockPriceRange(code) {
        // Default values for unknown stocks
        let min = 50;
        let max = 200;
        let vol = 0.04;

        // Get first two digits of stock code
        const category = code.substring(0, 2);

        // Adjust ranges based on stock category
        switch (category) {
            case "23": // 電子業
                min = 100;
                max = 800;
                vol = 0.05;
                break;
            case "24": // 半導體
                min = 200;
                max = 1000;
                vol = 0.06;
                break;
            case "28": // 金融保險
                min = 30;
                max = 70;
                vol = 0.03;
                break;
            case "13": // 塑膠工業 
                min = 70;
                max = 120;
                vol = 0.03;
                break;
            case "20": // 鋼鐵工業
                min = 20;
                max = 50;
                vol = 0.02;
                break;
        }

        basePrice = Math.random() * (max - min) + min;
        volatility = vol;
    }

    // Set price range
    getStockPriceRange(stockCode);

    const dates = Array.from({ length: 100 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const prices = dates.map(() =>
        basePrice * (1 + (Math.random() - 0.5) * 2 * volatility)
    );

    const intervals = Array.from({ length: params.intervals }, (_, i) => {
        const lowerBound = Math.min(...prices) + (i * (Math.max(...prices) - Math.min(...prices)) / params.intervals);
        const upperBound = Math.min(...prices) + ((i + 1) * (Math.max(...prices) - Math.min(...prices)) / params.intervals);
        const trendFactor = Math.random() * 0.4 + 0.3;
        const volumeFactor = Math.random() * 0.3 + 0.4;
        const probability = (trendFactor + volumeFactor) / 2;
        const isBuySignal = probability > params.confidence;

        return {
            range: `${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}`,
            probability: probability * 100,
            isBuySignal
        };
    });

    return {
        stockCode,
        dates,
        prices,
        intervals,
        params
    };
}

// 更新圖表
function updateCharts(data) {
    if (priceChart) {
        priceChart.destroy();
    }
    if (probabilityChart) {
        probabilityChart.destroy();
    }

    // 數據預處理
    const decimatedData = decimateData(data.prices, 100);

    const priceCtx = document.getElementById('price-chart').getContext('2d');
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '股價',
                data: decimatedData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '股價走勢圖'
                }
            }
        }
    });

    const probCtx = document.getElementById('probability-chart').getContext('2d');
    probabilityChart = new Chart(probCtx, {
        type: 'bar',
        data: {
            labels: data.intervals.map(i => i.range),
            datasets: [{
                label: '獲利機率',
                data: data.intervals.map(i => i.probability),
                backgroundColor: data.intervals.map(i =>
                    i.isBuySignal ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'
                )
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '各價格區間獲利機率分析'
                }
            }
        }
    });
}

function decimateData(data, maxPoints) {
    if (data.length <= maxPoints) return data;
    const skip = Math.floor(data.length / maxPoints);
    return data.filter((_, i) => i % skip === 0);
}

// 生成交易規則文字
function generateTradingRules(data) {
    const rules = data.intervals.map(interval => {
        const type = interval.isBuySignal ? '買進' : '觀望';
        return `${type}規則: 當股價在 ${interval.range} 區間時${interval.isBuySignal ? '買入' : '觀望'}\n` +
            `  - 獲利機率: ${interval.probability.toFixed(1)}%\n`;
    });

    document.getElementById('trading-rules').textContent = rules.join('\n');
}

function updateTradingRules(data) {
    // 使用 DocumentFragment 優化 DOM 操作
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');

    data.intervals.forEach(interval => {
        const rule = document.createElement('p');
        rule.textContent = `${interval.isBuySignal ? '買進' : '觀望'}規則: ${interval.range}`;
        container.appendChild(rule);
    });

    fragment.appendChild(container);

    const rulesElement = document.getElementById('trading-rules');
    rulesElement.innerHTML = '';
    rulesElement.appendChild(fragment);
}

// 驗證輸入
function validateInputs() {
    const intervals = parseInt(document.getElementById('intervals').value);
    const holdingPeriod = parseInt(document.getElementById('holding-period').value);
    const targetProfit = parseFloat(document.getElementById('target-profit').value);
    const confidence = parseFloat(document.getElementById('confidence').value);

    if (!document.getElementById('stock-select').value) {
        showError('請選擇股票');
        return false;
    }

    if (intervals < 2 || intervals > 10) {
        showError('區間數必須在 2-10 之間');
        return false;
    }

    if (holdingPeriod < 1 || holdingPeriod > 30) {
        showError('持有期間必須在 1-30 天之間');
        return false;
    }

    if (targetProfit < 0 || targetProfit > 1) {
        showError('目標獲利必須在 0-1 之間');
        return false;
    }

    if (confidence < 0 || confidence > 1) {
        showError('信心水準必須在 0-1 之間');
        return false;
    }

    return true;
}

// 顯示/隱藏載入指示器
function showLoading(show) {
    document.getElementById('loading-indicator').classList.toggle('hidden', !show);
}

// 顯示錯誤訊息
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 3000);
}

// 匯出分析結果
function exportAnalysisResults() {
    if (!currentAnalysisData) {
        showError('無可用的分析資料');
        return;
    }

    const exportData = {
        股票代碼: currentAnalysisData.stockCode,
        分析參數: currentAnalysisData.params,
        歷史資料: currentAnalysisData.dates.map((date, index) => ({
            日期: date,
            價格: currentAnalysisData.prices[index].toFixed(2)
        })),
        交易規則: currentAnalysisData.intervals.map(interval => ({
            價格區間: interval.range,
            獲利機率: interval.probability.toFixed(1) + '%',
            建議操作: interval.isBuySignal ? '買進' : '觀望'
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `股票分析_${currentAnalysisData.stockCode}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 增加節流處理避免過度請求
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 使用 Web Worker 處理大量數據
const dataWorker = new Worker('dataWorker.js');

function processLargeDataSet(data) {
    return new Promise((resolve, reject) => {
        dataWorker.postMessage({ data });
        dataWorker.onmessage = (e) => resolve(e.data);
        dataWorker.onerror = (e) => reject(e);
    });
}

// 初始化頁面
function initialize() {
    initializeStockSelect();
    ['intervals', 'holding-period', 'target-profit', 'confidence'].forEach(updateRangeValue);

    document.getElementById('analyze-btn').addEventListener('click',
        throttle(async () => {
            try {
                showLoading(true);

                if (!validateInputs()) return;

                const params = {
                    intervals: parseInt(document.getElementById('intervals').value),
                    holdingPeriod: parseInt(document.getElementById('holding-period').value),
                    targetProfit: parseFloat(document.getElementById('target-profit').value),
                    confidence: parseFloat(document.getElementById('confidence').value)
                };

                const stockCode = document.getElementById('stock-select').value;
                currentAnalysisData = await generateAnalysisData(stockCode, params);
                updateCharts(currentAnalysisData);
                generateTradingRules(currentAnalysisData);
                updateTradingRules(currentAnalysisData);

            } catch (error) {
                handleError(error);
            } finally {
                showLoading(false);
            }
        }, 1000)
    );

    document.getElementById('reset-btn').addEventListener('click', () => {
        document.getElementById('intervals').value = 5;
        document.getElementById('holding-period').value = 10;
        document.getElementById('target-profit').value = 0.8;
        document.getElementById('confidence').value = 0.6;
        ['intervals', 'holding-period', 'target-profit', 'confidence'].forEach(updateRangeValue);
    });

    document.getElementById('export-btn')?.addEventListener('click', exportAnalysisResults);
}

function handleError(error) {
    console.error('錯誤:', error);
    showError(error.message || '發生未知錯誤');
    showLoading(false);
}

function validateStockCode(stockCode) {
    const pattern = /^\d{4}$/;
    if (!pattern.test(stockCode)) {
        throw new Error('無效的股票代碼');
    }
    return true;
}

// main.js 中新增股票代碼載入功能
async function loadStockList() {
    try {
        const response = await fetch('https://isin.twse.com.tw/isin/class_main.jsp?market=1&issuetype=1');
        const text = await response.text();

        // 解析 HTML 表格資料
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tr');

        const stockSelect = document.getElementById('stock-select');

        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 2) {
                const code = cols[0].textContent.trim();
                const name = cols[1].textContent.trim();

                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${code} ${name}`;
                stockSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('載入股票清單失敗:', error);
        showError('無法載入股票清單，請稍後再試');
    }
}

async function loadStockListByIndustry(industry) {
    try {
        const response = await fetch('https://isin.twse.com.tw/isin/C_public.jsp?strMode=2');
        const text = await response.text();

        // 解析 HTML 表格資料
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tr');

        const stockSelect = document.getElementById('stock-select');
        stockSelect.innerHTML = ''; // Clear existing options

        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 5) {
                const industryName = cols[4].textContent.trim();
                if (industryName.includes(industry)) {
                    const code = cols[0].textContent.trim();
                    const name = cols[1].textContent.trim();

                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = `${code} ${name}`;
                    stockSelect.appendChild(option);
                }
            }
        });
    } catch (error) {
        console.error('載入股票清單失敗:', error);
        showError('無法載入股票清單，請稍後再試');
    }
}

// Example usage: Load stocks for the electronics industry
loadStockListByIndustry('電子');

initialize();