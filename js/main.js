document.addEventListener('DOMContentLoaded', () => {
    // 股票列表相關元素
    const stockTableBody = document.getElementById('stockTableBody');
    const industryFilter = document.getElementById('industryFilter');
    const stockListSearch = document.getElementById('stockListSearch');
    const selectedStockInput = document.getElementById('selectedStock');

    // 股票分析相關元素
    const holdingPeriodInput = document.getElementById('holdingPeriod');
    const holdingPeriodValue = document.getElementById('holdingPeriodValue');
    const confidenceThresholdInput = document.getElementById('confidenceThreshold');
    const confidenceThresholdValue = document.getElementById('confidenceThresholdValue');
    const analyzeButton = document.getElementById('analyzeButton');
    const tradingRulesElement = document.getElementById('tradingRules');
    const stockChart = document.getElementById('stockChart');

    // 股票資料 (模擬數據)
    const stockData = [
        // 科技業
        { code: '2330', name: '台積電', industry: '半導體', market: '上市' },
        { code: '2317', name: '鴻海', industry: '電子零組件', market: '上市' },
        { code: '2454', name: '聯發科', industry: '半導體', market: '上市' },
        { code: '3008', name: '大立光', industry: '光電', market: '上市' },
        
        // 金融業
        { code: '2882', name: '國泰金', industry: '金融保險', market: '上市' },
        { code: '2886', name: '台驊投控', industry: '金融保險', market: '上市' },
        { code: '5880', name: '合庫金', industry: '金融保險', market: '上市' },
        
        // 傳產業
        { code: '2412', name: '中華電', industry: '電信業', market: '上市' },
        { code: '1101', name: '台泥', industry: '水泥', market: '上市' },
        { code: '1102', name: '亞泥', industry: '水泥', market: '上市' },
        
        // 服務業
        { code: '2603', name: '長榮', industry: '航運', market: '上市' },
        { code: '2609', name: '陽明', industry: '航運', market: '上市' },
        
        // 生技醫療
        { code: '4414', name: '如興', industry: '生技醫療', market: '上櫃' },
        { code: '6446', name: '藥華藥', industry: '生技醫療', market: '上櫃' },
        
        // 電子通路
        { code: '2416', name: '旺家', industry: '電子通路', market: '上市' },
        { code: '2347', name: '錸德', industry: '電子通路', market: '上市' },
        
        // 其他
        { code: '2002', name: '中鋼', industry: '鋼鐵', market: '上市' },
        { code: '1216', name: 'sailed', industry: '紡織', market: '上市' },
        { code: '2303', name: '聚陽', industry: '紡織', market: '上市' }
    ];

    // 模擬股票分析數據
    const mockStockData = {
        '2330': {
            historicalPrices: [100, 110, 105, 115, 120, 118, 125, 130, 128, 135],
            tradingRules: "台積電買進規則：\n- 當股價在 100-120 區間時買入\n- 停損點：95\n- 獲利機率：75%"
        },
        '2317': {
            historicalPrices: [50, 55, 52, 58, 60, 59, 62, 65, 64, 67],
            tradingRules: "鴻海買進規則：\n- 當股價在 50-60 區間時買入\n- 停損點：47\n- 獲利機率：70%"
        },
        // 其他股票的模擬數據
    };

    // 動態建立產業別篩選選項
    const industries = [...new Set(stockData.map(stock => stock.industry))];
    industries.sort().forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        industryFilter.appendChild(option);
    });

    // 渲染股票資料
    function renderStockData(data) {
        stockTableBody.innerHTML = '';
        data.forEach(stock => {
            const row = document.createElement('tr');
            row.classList.add('stock-row');
            row.innerHTML = `
                <td>${stock.code}</td>
                <td>${stock.name}</td>
                <td>${stock.industry}</td>
                <td>${stock.market}</td>
            `;
            row.addEventListener('click', () => {
                selectedStockInput.value = `${stock.code} - ${stock.name}`;
            });
            stockTableBody.appendChild(row);
        });
    }

    // 篩選功能
    function filterStocks() {
        const searchTerm = stockListSearch.value.toLowerCase();
        const selectedIndustry = industryFilter.value;

        const filteredStocks = stockData.filter(stock => 
            (selectedIndustry === '' || stock.industry === selectedIndustry) &&
            (stock.code.includes(searchTerm) || 
             stock.name.includes(searchTerm) ||
             stock.industry.includes(searchTerm))
        );

        renderStockData(filteredStocks);
    }

    // 更新滑桿顯示值
    holdingPeriodInput.addEventListener('input', () => {
        holdingPeriodValue.textContent = holdingPeriodInput.value;
    });

    confidenceThresholdInput.addEventListener('input', () => {
        confidenceThresholdValue.textContent = confidenceThresholdInput.value;
    });

    // 股票分析
    let chartInstance = null;
    analyzeButton.addEventListener('click', () => {
        const selectedStock = selectedStockInput.value.split(' - ')[0];
        const holdingPeriod = holdingPeriodInput.value;
        const confidenceThreshold = confidenceThresholdInput.value;

        // 檢查是否有選擇股票
        if (!selectedStock) {
            alert('請先選擇一支股票');
            return;
        }

        const stockData = mockStockData[selectedStock];

        // 如果沒有模擬數據
        if (!stockData) {
            alert('尚無此股票的分析數據');
            return;
        }

        // 顯示交易規則
        tradingRulesElement.innerHTML = `<pre>${stockData.tradingRules}</pre>`;

        // 銷毀先前的圖表實例
        if (chartInstance) {
            chartInstance.destroy();
        }

        // 創建股價走勢圖
        chartInstance = new Chart(stockChart, {
            type: 'line',
            data: {
                labels: stockData.historicalPrices.map((_, i) => `Day ${i+1}`),
                datasets: [{
                    label: '股價走勢',
                    data: stockData.historicalPrices,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${selectedStock} 股票分析`
                    }
                }
            }
        });
    });

    // 監聽篩選事件
    industryFilter.addEventListener('change', filterStocks);
    stockListSearch.addEventListener('input', filterStocks);

    // 初始渲染
    renderStockData(stockData);
});