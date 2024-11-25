// 驗證股票數據的輔助函數
function validateStockData(data) {
    if (!data?.chart?.result?.[0]?.timestamp || !data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
        throw new Error('Invalid stock data structure');
    }
}

// 延遲函數
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 自定義錯誤類別
class StockAPIError extends Error {
    constructor(message, status, symbol) {
        super(message);
        this.name = 'StockAPIError';
        this.status = status;
        this.symbol = symbol;
    }
}

// 改進的 fetchHistoricalData 函數
async function fetchHistoricalData(symbol) {
    try {
        const data = await fetchStockDataSafely(symbol);
        
        // 確保數據存在且為陣列
        if (!data || !Array.isArray(data)) {
            throw new Error(`無效的數據格式: ${symbol}`);
        }
        
        console.log(`成功獲取 ${symbol} 的數據`);
        return data;
    } catch (error) {
        console.error(`獲取歷史數據時發生錯誤 (${symbol}):`, error);
        return []; // 返回空陣列而不是 null
    }
}

function analyzeIntervals(data) {
    // 加入型別檢查
    if (!Array.isArray(data)) {
        console.error('analyzeIntervals: 輸入數據必須是陣列');
        return [];
    }
    
    try {
        return data.map(item => {
            // 處理數據轉換邏輯
            return {
                date: item.date,
                value: item.value
                // 其他需要的欄位
            };
        });
    } catch (error) {
        console.error('分析區間時發生錯誤:', error);
        return [];
    }
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

// 生成模擬數據
function generateMockData(days = 365) {
    const now = Math.floor(Date.now() / 1000);
    const data = {
        chart: {
            result: [{
                timestamp: [],
                indicators: {
                    quote: [{
                        close: [],
                        volume: [],
                        open: [],
                        high: [],
                        low: []
                    }]
                }
            }]
        }
    };

    for (let i = 0; i < days; i++) {
        // 生成時間戳，從現在往前推
        const timestamp = now - ((days - i) * 24 * 60 * 60);
        data.chart.result[0].timestamp.push(timestamp);

        // 生成隨機價格數據
        const basePrice = 100;
        const randomFactor = 0.02; // 2% 波動
        const dayVariation = (Math.random() - 0.5) * 2 * basePrice * randomFactor;
        const price = basePrice + dayVariation;

        data.chart.result[0].indicators.quote[0].close.push(price);
        data.chart.result[0].indicators.quote[0].open.push(price * (1 + (Math.random() - 0.5) * 0.01));
        data.chart.result[0].indicators.quote[0].high.push(price * (1 + Math.random() * 0.01));
        data.chart.result[0].indicators.quote[0].low.push(price * (1 - Math.random() * 0.01));
        data.chart.result[0].indicators.quote[0].volume.push(Math.floor(Math.random() * 1000000));
    }

    return data;
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
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '機率 (%)'
                    },
                    ticks: {
                        callback: value => value + '%'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '價格區間'
                    }
                }
            }
        }
    });
}

// 初始化分析
analyzeStock();

<<<<<<< HEAD
async function getStockList() {
    const defaultStocks = [["2330", "台積電"], ["2317", "鴻海"]];
    
    try {
        const url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2";
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`無法連接到證交所網站，狀態碼：${response.status}`);
            return defaultStocks;
        }
        
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const table = doc.querySelector('table');
        
        if (!table) {
            throw new Error('找不到股票資料表格');
        }

        const stocks = Array.from(table.querySelectorAll('tr'))
            .slice(1) // 跳過表頭
            .map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const code = cells[0]?.textContent?.trim();
                    const name = cells[1]?.textContent?.trim();
                    
                    // 確保股票代碼為4位數字
                    if (code && name && /^\d{4}$/.test(code)) {
                        return [code, name];
                    }
                }
                return null;
            })
            .filter(stock => stock !== null);

        return stocks.length > 0 ? stocks : defaultStocks;
    } catch (error) {
        console.error('取得股票列表時發生錯誤：', error);
        return defaultStocks;
    }
}

// 使用範例
async function fetchStockDataSafely(symbol) {
    try {
        const data = await fetchHistoricalData(symbol);
        console.log(`成功獲取 ${symbol} 的數據`);
        return data;
    } catch (error) {
        if (error instanceof StockAPIError) {
            console.error(`股票 API 錯誤 (${symbol}):`, {
                message: error.message,
                status: error.status,
                symbol: error.symbol
            });
        } else {
            console.error(`未預期的錯誤 (${symbol}):`, error);
        }
        return null;
    }
}

// 使用改進後的錯誤處理
fetchStockDataSafely('2330.TW')
    .then(data => {
        if (Array.isArray(data) && data.length > 0) {
            console.log('數據獲取成功');
            const analyzed = analyzeIntervals(data);
            // 處理分析結果
        } else {
            console.warn('未獲取到有效數據');
        }
    })
    .catch(error => {
        console.error('處理數據時發生錯誤:', error);
    });
=======
    const confidenceThreshold = parseInt(document.getElementById('confidence').value);

    probData.forEach(data => {
        const isBuySignal = data.probability > confidenceThreshold;
        const ruleCard = document.createElement('div');
        ruleCard.className = `rule-card ${isBuySignal ? 'buy' : 'hold'}`;
        
        ruleCard.innerHTML = `
            <h3>${isBuySignal ? '買進規則' : '觀望規則'}</h3>
            <p>價格區間: ${data.range}</p>
            <p>獲利機率: ${data.probability.toFixed(1)}%</p>
            <p>建議操作: ${isBuySignal ? '可以買入' : '暫時觀望'}</p>
        `;

        rulesContainer.appendChild(ruleCard);
    });
}

// 事件監聽器
document.getElementById('search').addEventListener('input', (e) => {
    updateStockOptions(document.getElementById('industry').value, e.target.value);
});

document.getElementById('industry').addEventListener('change', (e) => {
    updateStockOptions(e.target.value, document.getElementById('search').value);
});

document.getElementById('stock').addEventListener('change', (e) => {
    updateCharts(e.target.value);
});

document.getElementById('period').addEventListener('input', (e) => {
    document.getElementById('period-value').textContent = `${e.target.value}天`;
    updateCharts(document.getElementById('stock').value);
});

document.getElementById('confidence').addEventListener('input', (e) => {
    document.getElementById('confidence-value').textContent = `${e.target.value}%`;
    updateCharts(document.getElementById('stock').value);
});

// 初始化
const defaultIndustry = document.getElementById('industry').value || '';
<<<<<<< HEAD
updateStockOptionsAndChart(defaultIndustry, '');
>>>>>>> parent of 2bc2f33 (1)
=======
updateStockOptions(defaultIndustry, '');
updateCharts('2330');
>>>>>>> parent of 13addc9 (1)
