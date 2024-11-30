// 模擬股票資料
const mockStocks = [
    { code: '2330', name: '台積電' },
    { code: '2317', name: '鴻海' },
    { code: '2454', name: '聯發科' },
    { code: '2412', name: '中華電' }
];

// 在檔案頂部宣告變數來儲存圖表實例
let priceChart = null;
let probabilityChart = null;

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

// 模擬分析資料生成
function generateAnalysisData(stockCode, params) {
    // 使用 stockCode 來決定基礎價格範圍
    const stockInfo = mockStocks.find(s => s.code === stockCode) || mockStocks[0];
    let basePrice;
    
    // 根據不同股票代碼設定不同的基礎價格範圍
    switch(stockCode) {
        case '2330': // 台積電
            basePrice = Math.random() * 200 + 500; // 500-700 範圍
            break;
        case '2317': // 鴻海
            basePrice = Math.random() * 50 + 100;  // 100-150 ���圍
            break;
        case '2454': // 聯發科
            basePrice = Math.random() * 300 + 700; // 700-1000 範圍
            break;
        case '2412': // 中華電
            basePrice = Math.random() * 30 + 100;  // 100-130 範圍
            break;
        default:
            basePrice = Math.random() * 500 + 100; // 預設範圍
    }

    // 模擬股價資料
    const dates = Array.from({length: 100}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const prices = dates.map(() => basePrice + (Math.random() - 0.5) * 50);

    // 模擬區間分析
    const intervals = Array.from({length: params.intervals}, (_, i) => {
        const lowerBound = Math.min(...prices) + (i * (Math.max(...prices) - Math.min(...prices)) / params.intervals);
        const upperBound = Math.min(...prices) + ((i + 1) * (Math.max(...prices) - Math.min(...prices)) / params.intervals);
        const probability = Math.random();
        const isBuySignal = probability > params.confidence;

        return {
            range: `${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}`,
            probability: probability * 100,
            isBuySignal
        };
    });

    return {
        dates,
        prices,
        intervals
    };
}

// 更新圖表
function updateCharts(data) {
    // 銷毀兩個圖表實例
    if (priceChart) {
        priceChart.destroy();
    }
    if (probabilityChart) {
        probabilityChart.destroy();
    }

    // 更新股價圖表
    const priceCtx = document.getElementById('price-chart').getContext('2d');
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '股價',
                data: data.prices,
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

    // 更新機率圖表
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

// 生成交易規則文字
function generateTradingRules(data) {
    const rules = data.intervals.map(interval => {
        const type = interval.isBuySignal ? '買進' : '觀望';
        return `${type}規則: 當股價在 ${interval.range} 區間時${interval.isBuySignal ? '買入' : '觀望'}\n` +
               `  - 獲利機率: ${interval.probability.toFixed(1)}%\n`;
    });

    document.getElementById('trading-rules').textContent = rules.join('\n');
}

// 初始化頁面
function initialize() {
    initializeStockSelect();
    
    ['intervals', 'holding-period', 'target-profit', 'confidence'].forEach(updateRangeValue);

    document.getElementById('analyze-btn').addEventListener('click', () => {
        const params = {
            intervals: parseInt(document.getElementById('intervals').value),
            holdingPeriod: parseInt(document.getElementById('holding-period').value),
            targetProfit: parseFloat(document.getElementById('target-profit').value),
            confidence: parseFloat(document.getElementById('confidence').value)
        };

        const stockCode = document.getElementById('stock-select').value;
        const analysisData = generateAnalysisData(stockCode, params);
        updateCharts(analysisData);
        generateTradingRules(analysisData);
    });
}

initialize();