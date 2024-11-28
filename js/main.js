<<<<<<< HEAD
// 台股資料爬蟲模組
class TWStockCrawler {
    constructor() {
        this.TPEX_URL = 'https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php';
        this.TWSE_URL = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
        };
    }

    // 取得股票基本資料
    async getStockInfo(stockId) {
        try {
            const response = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockId}.tw`, {
                headers: this.headers
            });
            const data = await response.json();
            return this.parseStockInfo(data);
        } catch (error) {
            console.error(`Failed to fetch stock info for ${stockId}:`, error);
            return null;
        }
    }

    // 取得歷史交易資料
    async getHistoricalData(stockId, startDate, endDate) {
        try {
            const dates = this.generateDateRange(startDate, endDate);
            const allData = [];
=======
document.addEventListener('DOMContentLoaded', () => {
    const stockTableBody = document.getElementById('stockTableBody');
    const industryFilter = document.getElementById('industryFilter');
    const searchInput = document.getElementById('searchInput');

    // 台灣上市上櫃股票資料 (模擬數據)
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
            row.innerHTML = `
                <td>${stock.code}</td>
                <td>${stock.name}</td>
                <td>${stock.industry}</td>
                <td>${stock.market}</td>
            `;
            stockTableBody.appendChild(row);
        });
    }

    // 篩選功能
    function filterStocks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedIndustry = industryFilter.value;
>>>>>>> parent of 7346115 (11)

            for (const date of dates) {
                const response = await fetch(this.buildHistoryUrl(stockId, date), {
                    headers: this.headers
                });
                const data = await response.json();
                const parsedData = this.parseHistoricalData(data);
                allData.push(...parsedData);
                
                // 避免請求過於頻繁
                await this.sleep(1000);
            }

            return this.processHistoricalData(allData);
        } catch (error) {
            console.error(`Failed to fetch historical data for ${stockId}:`, error);
            return null;
        }
    }

<<<<<<< HEAD
    // 取得即時報價
    async getRealTimeQuote(stockId) {
        try {
            const response = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockId}.tw`, {
                headers: this.headers
            });
            const data = await response.json();
            return this.parseRealTimeQuote(data);
        } catch (error) {
            console.error(`Failed to fetch real-time quote for ${stockId}:`, error);
            return null;
        }
    }

    // 取得法人買賣超資料
    async getInstitutionalTrades(stockId, date) {
        try {
            const response = await fetch(this.buildInstitutionalUrl(stockId, date), {
                headers: this.headers
            });
            const data = await response.json();
            return this.parseInstitutionalTrades(data);
        } catch (error) {
            console.error(`Failed to fetch institutional trades for ${stockId}:`, error);
            return null;
        }
    }

    // 解析股票基本資料
    parseStockInfo(data) {
        if (!data || !data.msgArray || data.msgArray.length === 0) {
            return null;
        }

        const stock = data.msgArray[0];
        return {
            stockId: stock.c,
            name: stock.n,
            exchange: stock.ex,
            industry: stock.i,
            previousClose: parseFloat(stock.y),
            open: parseFloat(stock.o)
        };
    }

    // 解析歷史交易資料
    parseHistoricalData(data) {
        if (!data || !data.data) {
            return [];
        }

        return data.data.map(row => ({
            date: row[0],
            volume: parseInt(row[1].replace(/,/g, '')),
            value: parseInt(row[2].replace(/,/g, '')),
            open: parseFloat(row[3]),
            high: parseFloat(row[4]),
            low: parseFloat(row[5]),
            close: parseFloat(row[6]),
            change: parseFloat(row[7]),
            transactions: parseInt(row[8].replace(/,/g, ''))
        }));
    }

    // 解析即時報價
    parseRealTimeQuote(data) {
        if (!data || !data.msgArray || data.msgArray.length === 0) {
            return null;
        }

        const quote = data.msgArray[0];
        return {
            stockId: quote.c,
            name: quote.n,
            time: quote.t,
            price: parseFloat(quote.z),
            change: parseFloat(quote.v),
            changePercent: parseFloat(quote.w),
            volume: parseInt(quote.tv),
            best5Asks: this.parseBest5(quote.a, quote.f),
            best5Bids: this.parseBest5(quote.b, quote.g)
        };
    }

    // 解析最佳五檔
    parseBest5(prices, volumes) {
        if (!prices || !volumes) return [];
        const priceArr = prices.split('_');
        const volumeArr = volumes.split('_');
        return priceArr.map((price, index) => ({
            price: parseFloat(price),
            volume: parseInt(volumeArr[index])
        })).filter(item => !isNaN(item.price) && !isNaN(item.volume));
    }

    // 解析法人買賣超
    parseInstitutionalTrades(data) {
        if (!data || !data.data) {
            return null;
        }

        return {
            foreignInvestors: parseInt(data.data[0][4].replace(/,/g, '')),
            investmentTrusts: parseInt(data.data[0][5].replace(/,/g, '')),
            dealers: parseInt(data.data[0][6].replace(/,/g, ''))
        };
    }

    // 產生日期範圍
    generateDateRange(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            dates.push(this.formatDate(currentDate));
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return dates;
    }

    // 格式化日期
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}${month}`;
    }

    // 建立歷史資料請求URL
    buildHistoryUrl(stockId, date) {
        return `${this.TWSE_URL}?response=json&date=${date}&stockNo=${stockId}`;
    }

    // 建立法人資料請求URL
    buildInstitutionalUrl(stockId, date) {
        return `https://www.twse.com.tw/exchangeReport/BFIAUU?response=json&date=${date}&stockNo=${stockId}`;
    }

    // 處理歷史資料
    processHistoricalData(data) {
        // 計算技術指標
        return {
            prices: data.map(d => d.close),
            volumes: data.map(d => d.volume),
            dates: data.map(d => d.date),
            indicators: this.calculateIndicators(data)
        };
    }

    // 計算技術指標
    calculateIndicators(data) {
        const closes = data.map(d => d.close);
        
        return {
            ma5: this.calculateMA(closes, 5),
            ma20: this.calculateMA(closes, 20),
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes)
        };
    }

    // 計算移動平均
    calculateMA(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
                continue;
            }
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    // 計算RSI
    calculateRSI(data, period) {
        const result = [];
        let gains = [];
        let losses = [];

        // 計算價格變化
        for (let i = 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }

        // 計算RSI
        for (let i = 0; i < data.length; i++) {
            if (i < period) {
                result.push(null);
                continue;
            }

            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b) / period;
            
            const rs = avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            result.push(rsi);
        }

        return result;
    }

    // 計算MACD
    calculateMACD(data) {
        const ema12 = this.calculateEMA(data, 12);
        const ema26 = this.calculateEMA(data, 26);
        const macdLine = ema12.map((v, i) => v - ema26[i]);
        const signalLine = this.calculateEMA(macdLine, 9);
        
        return {
            macdLine,
            signalLine,
            histogram: macdLine.map((v, i) => v - signalLine[i])
        };
}

    // 計算EMA
    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        const result = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            const ema = data[i] * k + result[i - 1] * (1 - k);
            result.push(ema);
        }
        
        return result;
    }

    // 休眠函數
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 使用範例
async function initializeStockData() {
    const crawler = new TWStockCrawler();
    const stockList = document.getElementById('stockTableBody');
    const analyzeButton = document.getElementById('analyzeButton');

    // 更新分析按鈕事件
    analyzeButton.addEventListener('click', async () => {
        const selectedStock = selectedStockInput.value.split(' - ')[0];
        const holdingPeriod = parseInt(holdingPeriodInput.value);
        
        if (!selectedStock) {
            alert('請先選擇一支股票');
            return;
        }

        try {
            // 顯示載入中訊息
            tradingRulesElement.innerHTML = '<p>資料載入中...</p>';
            
            // 取得最近一個月的資料
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            
            // 取得股票資料
            const stockData = await crawler.getHistoricalData(selectedStock, startDate, endDate);
            const realTimeQuote = await crawler.getRealTimeQuote(selectedStock);
            
            if (!stockData) {
                alert('無法取得股票資料');
                return;
            }

            // 更新交易規則顯示
            updateTradingRules(stockData, realTimeQuote);

            // 更新圖表
            updateStockChart(stockData, holdingPeriod);
            
    } catch (error) {
            console.error('分析過程發生錯誤:', error);
            alert('分析過程發生錯誤');
        }
    });
}

// 更新交易規則顯示
function updateTradingRules(stockData, realTimeQuote) {
    const { indicators } = stockData;
    const lastPrice = realTimeQuote.price;
    const lastRSI = indicators.rsi[indicators.rsi.length - 1];
    const lastMACD = indicators.macd.macdLine[indicators.macd.macdLine.length - 1];
    
    const rules = `交易策略分析：

1. 目前股價：${lastPrice} 元
   - MA5: ${indicators.ma5[indicators.ma5.length - 1].toFixed(2)}
   - MA20: ${indicators.ma20[indicators.ma20.length - 1].toFixed(2)}
   - RSI(14): ${lastRSI.toFixed(2)}
   - MACD: ${lastMACD.toFixed(2)}

2. 技術分析建議：
   ${generateTechnicalAdvice(stockData)}

3. 建議進場點位：
   - 支撐位：${(lastPrice * 0.95).toFixed(2)} 元
   - 壓力位：${(lastPrice * 1.05).toFixed(2)} 元
   
4. 風險控管：
   - 建議停損：${(lastPrice * 0.93).toFixed(2)} 元
   - 建議停利：${(lastPrice * 1.08).toFixed(2)} 元

5. 交易量分析：
   ${generateVolumeAnalysis(stockData)}`;

    tradingRulesElement.innerHTML = `<pre>${rules}</pre>`;
}

// 生成技術分析建議

function generateTechnicalAdvice(stockData) {
    const { indicators } = stockData;
    const ma5 = indicators.ma5[indicators.ma5.length - 1];
    const ma20 = indicators.ma20[indicators.ma20.length - 1];
    const rsi = indicators.rsi[indicators.rsi.length - 1];
    const macd = indicators.macd.macdLine[indicators.macd.macdLine.length - 1];
    const signal = indicators.macd.signalLine[indicators.macd.signalLine.length - 1];
    
    let advice = [];
    
    // 均線分析
    if (ma5 > ma20) {
        advice.push('- MA5突破MA20，短期趨勢向上');
        if (ma5 / ma20 > 1.05) {
            advice.push('- 均線距離過大，注意回檔風險');
        }
    } else {
        advice.push('- MA5低於MA20，短期趨勢偏空');
        if (ma5 / ma20 < 0.95) {
            advice.push('- 均線距離過大，可能出現超賣');
        }
    }
    
    // RSI分析
    if (rsi > 70) {
        advice.push('- RSI超過70，呈現超買狀態，注意賣出時機');
    } else if (rsi < 30) {
        advice.push('- RSI低於30，呈現超賣狀態，可考慮買進');
    } else {
        advice.push(`- RSI位於${rsi.toFixed(2)}，處於正常區間`);
    }
    
    // MACD分析
    if (macd > signal) {
        advice.push('- MACD位於信號線之上，持續看多');
        if (macd > 0) {
            advice.push('- MACD位於零軸之上，多頭趨勢確立');
        }
    } else {
        advice.push('- MACD位於信號線之下，趨勢轉空');
        if (macd < 0) {
            advice.push('- MACD位於零軸之下，空頭趨勢確立');
        }
    }
    
    return advice.join('\n');
}

// 生成成交量分析
function generateVolumeAnalysis(stockData) {
    const { volumes } = stockData;
    const recentVolumes = volumes.slice(-5);  // 最近5天成交量
    const avgVolume = recentVolumes.reduce((a, b) => a + b) / recentVolumes.length;
    const lastVolume = volumes[volumes.length - 1];
    
    let analysis = [];
    
    // 量能分析
    if (lastVolume > avgVolume * 1.5) {
        analysis.push('- 今日成交量明顯放大，交易活絡');
        analysis.push('- 建議關注價量配合度');
    } else if (lastVolume < avgVolume * 0.5) {
        analysis.push('- 今日成交量明顯萎縮，觀望氣氛濃');
        analysis.push('- 建議等待成交量回溫');
    } else {
        analysis.push('- 成交量維持平穩，可持續觀察');
    }
    
    // 計算量能趨勢
    const volumeTrend = recentVolumes.map((vol, i) => {
        if (i === 0) return 0;
        return ((vol - recentVolumes[i-1]) / recentVolumes[i-1] * 100).toFixed(2);
    });
    
    const avgTrend = volumeTrend.reduce((a, b) => Number(a) + Number(b), 0) / (volumeTrend.length - 1);
    
    if (avgTrend > 10) {
        analysis.push('- 近期量能持續放大，交易熱度上升');
    } else if (avgTrend < -10) {
        analysis.push('- 近期量能持續萎縮，建議保守操作');
    }
    
    return analysis.join('\n');
}

// 更新股票圖表
function updateStockChart(stockData, holdingPeriod) {
    const { prices, volumes, dates, indicators } = stockData;
    
    // 根據持有期間篩選數據
    const dataPoints = Math.min(holdingPeriod * 5, prices.length);
    const selectedPrices = prices.slice(-dataPoints);
    const selectedVolumes = volumes.slice(-dataPoints);
    const selectedDates = dates.slice(-dataPoints);
    const selectedMA5 = indicators.ma5.slice(-dataPoints);
    const selectedMA20 = indicators.ma20.slice(-dataPoints);
    
    // 銷毀現有圖表
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // 創建新圖表
    chartInstance = new Chart(stockChart, {
        type: 'bar',
        data: {
            labels: selectedDates,
            datasets: [
                {
                    label: '股價',
                    type: 'line',
                    data: selectedPrices,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    yAxisID: 'price',
                    tension: 0.1,
                    order: 1
                },
                {
                    label: 'MA5',
                    type: 'line',
                    data: selectedMA5,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    yAxisID: 'price',
                    order: 0
                },
                {
                    label: 'MA20',
                    type: 'line',
                    data: selectedMA20,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    yAxisID: 'price',
                    order: 0
                },
                {
                    label: '成交量',
                    data: selectedVolumes,
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    yAxisID: 'volume',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `股票走勢分析 (${holdingPeriod}天)`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (context.dataset.yAxisID === 'volume') {
                                return `成交量: ${value.toLocaleString()}`;
                            }
                            return `${context.dataset.label}: ${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                price: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '股價'
                    }
                },
                volume: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '成交量'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', initializeStockData);
=======
    // 監聽篩選事件
    industryFilter.addEventListener('change', filterStocks);
    searchInput.addEventListener('input', filterStocks);

    // 初始渲染
    renderStockData(stockData);
});
>>>>>>> parent of 7346115 (11)
