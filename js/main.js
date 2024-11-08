// 股票清單
const STOCKS = [
    { code: '2330', name: '台積電', industry: '半導體' },
    { code: '2454', name: '聯發科', industry: '半導體' },
    { code: '2379', name: '瑞昱', industry: '半導體' },
    { code: '2317', name: '鴻海', industry: '電子' },
    { code: '2882', name: '國泰金', industry: '金融' },
    { code: '2881', name: '富邦金', industry: '金融' },
    { code: '1301', name: '台塑', industry: '傳產製造' },
    { code: '2002', name: '中鋼', industry: '傳產製造' },
    { code: '2912', name: '統一超', industry: '零售' }
];

// 初始化產業選項
const industries = ['all', ...new Set(STOCKS.map(stock => stock.industry))];
const industrySelect = document.getElementById('industry');
industries.forEach(industry => {
    const option = document.createElement('option');
    option.value = industry;
    option.textContent = industry === 'all' ? '所有產業' : industry;
    industrySelect.appendChild(option);
});

// 初始化股票選項
function updateStockOptions(industry = 'all', searchTerm = '') {
    const stockSelect = document.getElementById('stock');
    stockSelect.innerHTML = '';
    
    let filteredStocks = STOCKS;
    if (industry !== 'all') {
        filteredStocks = filteredStocks.filter(stock => stock.industry === industry);
    }
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredStocks = filteredStocks.filter(stock => 
            stock.code.toLowerCase().includes(searchLower) || 
            stock.name.toLowerCase().includes(searchLower)
        );
    }

    filteredStocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.code;
        option.textContent = `${stock.code} - ${stock.name}`;
        stockSelect.appendChild(option);
    });
}

// 生成模擬數據
function generateMockData(stockCode) {
    const basePrice = {
        '2330': 500,
        '2454': 800,
        '2317': 100
    }[stockCode] || Math.random() * 500 + 50;

    const days = 60;
    const data = [];
    let price = basePrice;

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        price = price * (1 + (Math.random() - 0.5) * 0.02);
        data.push({
            date: date.toISOString().split('T')[0],
            price: price
        });
    }

    return data;
}
// 從 API 獲取股票數據
async function fetchStockData(stockCode) {
    try {
        const apiUrl = `https://api.finmindtrade.com/api/v4/data`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dataset: 'TaiwanStockPrice',
                data_id: stockCode,
                start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            })
        });

        const data = await response.json();
        if (!data.data) return [];

        return data.data.map(item => ({
            date: item.date,
            price: item.close
        }));
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return generateMockData(stockCode); // 如果 API 失敗則回退到模擬數據
    }
}

// 從 Yahoo Finance 獲取股票資料
async function getStockData(stockCode) {
    try {
        // 轉換股票代碼格式 (加上.TW)
        const symbol = `${stockCode}.TW`;
        
        // 設定時間範圍
        const endDate = Math.floor(Date.now() / 1000);
        const startDate = endDate - (60 * 24 * 60 * 60); // 60天前
        
        // 呼叫 Yahoo Finance API
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`
        );
        
        if (!response.ok) {
            throw new Error('無法取得股票資料');
        }

        const data = await response.json();
        const timestamps = data.chart.result[0].timestamp;
        const quotes = data.chart.result[0].indicators.quote[0];
        
        // 整理資料格式
        return timestamps.map((time, index) => ({
            date: new Date(time * 1000),
            price: quotes.close[index],
            volume: quotes.volume[index]
        })).filter(item => item.price !== null);

    } catch (error) {
        console.error('取得股票資料失敗:', error);
        return [];
    }
}

// 更新圖表資料
async function updateChartData(stockCode) {
    const stockData = await getStockData(stockCode);
    if (stockData.length > 0) {
        // 這裡需要配合您的圖表更新邏輯
        updateChart(stockData);
    } else {
        console.error('無法取得股票資料');
    }
}

// 更新圖表
let priceChart = null;
let probabilityChart = null;

function updateCharts(stockCode) {
    const priceData = generateMockData(stockCode);
    
    // 更新價格圖表
    const priceCtx = document.getElementById('priceChart').getContext('2d');
    if (priceChart) priceChart.destroy();
    
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: priceData.map(d => d.date),
            datasets: [{
                label: '股價',
                data: priceData.map(d => d.price),
                borderColor: 'rgb(75, 192, 192)',
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
            }
        }
    });

    // 更新機率圖表
    const probData = Array(5).fill(0).map(() => ({
        range: `${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 100 + 100)}`,
        probability: Math.random() * 100
    }));

    const probCtx = document.getElementById('probabilityChart').getContext('2d');
    if (probabilityChart) probabilityChart.destroy();

    probabilityChart = new Chart(probCtx, {
        type: 'bar',
        data: {
            labels: probData.map(d => d.range),
            datasets: [{
                label: '獲利機率',
                data: probData.map(d => d.probability),
                backgroundColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '價格區間獲利機率'
                }
            }
        }
    });

    // 更新交易規則
    updateRules(probData);
}

// 更新交易規則
function updateRules(probData) {
    const rulesContainer = document.getElementById('rules');
    rulesContainer.innerHTML = '<h2 style="margin-bottom: 16px;">交易規則</h2>';

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

// 更新股票選項後更新圖表
function updateStockOptionsAndChart(industry, searchText) {
    updateStockOptions(industry, searchText);
    const stockSelect = document.getElementById('stock');
    if (stockSelect.options.length > 0) {
        updateCharts(stockSelect.value);
    }
}

document.getElementById('search').addEventListener('input', (e) => {
    updateStockOptionsAndChart(document.getElementById('industry').value, e.target.value);
});

document.getElementById('industry').addEventListener('change', (e) => {
    updateStockOptionsAndChart(e.target.value, document.getElementById('search').value);
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
updateStockOptionsAndChart(defaultIndustry, '');