// 模擬數據生成函數
function generateMockData(days = 365) {
    const data = [];
    let price = 100;
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - i));

        price = price * (1 + (Math.random() - 0.5) * 0.02);
        data.push({
            date: date,
            price: price
        });
    }
    return data;
}

// 更新範圍值顯示
document.getElementById('holding-period').addEventListener('input', function (e) {
    document.getElementById('holding-period-value').textContent = e.target.value + '天';
});

document.getElementById('confidence').addEventListener('input', function (e) {
    document.getElementById('confidence-value').textContent = e.target.value;
});

let priceChart = null;
let probabilityChart = null;

function analyzeStock() {
    const stockCode = document.getElementById('stock-select').value;
    const holdingPeriod = document.getElementById('holding-period').value;
    const confidence = document.getElementById('confidence').value;

    // 生成模擬數據
    const historicalData = generateMockData();
    const intervals = analyzeIntervals(historicalData, confidence);

    // 更新交易規則顯示
    updateTradingRules(intervals);

    // 更新圖表
    updateCharts(historicalData, intervals);
}

function analyzeIntervals(data, confidence) {
    const minPrice = Math.min(...data.map(d => d.price));
    const maxPrice = Math.max(...data.map(d => d.price));
    const range = maxPrice - minPrice;
    const intervalSize = range / 5;

    const intervals = [];
    for (let i = 0; i < 5; i++) {
        const lowerBound = minPrice + (i * intervalSize);
        const upperBound = minPrice + ((i + 1) * intervalSize);
        const probability = 0.4 + Math.random() * 0.5;
        intervals.push({
            lowerBound,
            upperBound,
            probability,
            isBuySignal: probability >= confidence,
            avgProfit: (Math.random() - 0.3) * 10,
            sampleSize: Math.floor(Math.random() * 100) + 50
        });
    }
    return intervals;
}

function updateTradingRules(intervals) {
    const rulesContainer = document.getElementById('trading-rules');
    rulesContainer.innerHTML = '<h2>交易規則</h2>';

    intervals.forEach(interval => {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = `rule ${interval.isBuySignal ? 'buy-rule' : 'wait-rule'}`;

        const ruleText = `
            <h3>${interval.isBuySignal ? '買進規則' : '觀望規則'}</h3>
            <p>價格區間: ${interval.lowerBound.toFixed(2)} - ${interval.upperBound.toFixed(2)}</p>
            <p>獲利機率: ${(interval.probability * 100).toFixed(1)}%</p>
            <p>平均獲利: ${interval.avgProfit.toFixed(2)}</p>
            <p>樣本數量: ${interval.sampleSize}</p>
        `;

        ruleDiv.innerHTML = ruleText;
        rulesContainer.appendChild(ruleDiv);
    });
}

function updateCharts(historicalData, intervals) {
    // 更新價格走勢圖
    const priceCtx = document.getElementById('priceChart').getContext('2d');
    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: historicalData.map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: '股價',
                data: historicalData.map(d => d.price),
                borderColor: '#2563eb',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '股價走勢圖'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // 更新機率分布圖
    const probCtx = document.getElementById('probabilityChart').getContext('2d');
    if (probabilityChart) {
        probabilityChart.destroy();
    }

    probabilityChart = new Chart(probCtx, {
        type: 'bar',
        data: {
            labels: intervals.map(i => `${i.lowerBound.toFixed(0)}-${i.upperBound.toFixed(0)}`),
            datasets: [{
                label: '獲利機率',
                data: intervals.map(i => i.probability * 100),
                backgroundColor: intervals.map(i => i.isBuySignal ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '各價格區間獲利機率分析'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// 初始化分析
analyzeStock();