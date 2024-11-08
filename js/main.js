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
async function fetchHistoricalData(symbol, days = 365, maxRetries = 3) {
    let lastError;
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (days * 24 * 60 * 60);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`正在進行第 ${attempt} 次請求: ${symbol}`);
            
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`
            );
            
            // 處理不同的 HTTP 狀態碼
            if (!response.ok) {
                switch (response.status) {
                    case 404:
                        throw new StockAPIError(`找不到股票代號 ${symbol}`, response.status, symbol);
                    case 429:
                        throw new StockAPIError('請求過於頻繁，請稍後再試', response.status, symbol);
                    case 500:
                        throw new StockAPIError('Yahoo Finance API 服務器錯誤', response.status, symbol);
                    default:
                        throw new StockAPIError(`HTTP 錯誤: ${response.status}`, response.status, symbol);
                }
            }

            const data = await response.json();
            
            try {
                validateStockData(data);
            } catch (error) {
                throw new StockAPIError(`數據格式錯誤: ${error.message}`, 'DATA_INVALID', symbol);
            }

            // 格式化數據
            const timestamps = data.chart.result[0].timestamp;
            const prices = data.chart.result[0].indicators.quote[0].close;
            
            return timestamps.map((timestamp, index) => ({
                date: new Date(timestamp * 1000),
                price: prices[index]
            })).filter(item => item.price !== null);
            
        } catch (error) {
            lastError = error;
            console.warn(`第 ${attempt} 次請求失敗:`, {
                symbol,
                error: error.message,
                status: error.status,
                timestamp: new Date().toISOString()
            });

            // 根據錯誤類型決定是否重試
            if (error.status === 404) {
                throw error; // 404 錯誤不需要重試
            }

            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // 指數退避，最多等待10秒
                console.log(`等待 ${waitTime/1000} 秒後重試...`);
                await delay(waitTime);
            }
        }
    }
    
    throw new StockAPIError(
        `在 ${maxRetries} 次嘗試後仍無法獲取數據: ${lastError.message}`,
        'MAX_RETRIES_EXCEEDED',
        symbol
    );
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
                            const code = cells[2]?.textContent?.trim();
                            const name = cells[3]?.textContent?.trim();
                            if (code && name) return [code, name];
                        }
                        return null;
                    })
                    .filter(stock => stock !== null);

                return stocks.length > 0 ? stocks : defaultStocks;
                
            } catch (error) {
                console.error(`處理股票列表時發生錯誤：${error}`);
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
        if (data) {
            console.log('數據獲取成功');
        }
    });