<<<<<<< HEAD
// 定義常數避免魔術數字
const CONSTANTS = {
    MA_DIVERGENCE_THRESHOLD: 0.05,
    RSI_OVERBOUGHT: 70,
    RSI_OVERSOLD: 30,
    VOLUME_SURGE_MULTIPLIER: 1.5,
    VOLUME_DROP_MULTIPLIER: 0.5,
    VOLUME_TREND_THRESHOLD: 10,
    DEFAULT_DECIMAL_PLACES: 2
  };
  
  // 定義分析結果的類型
  class AnalysisResult {
    constructor() {
      this.signals = [];
      this.risk_level = 0; // 0-低風險, 1-中風險, 2-高風險
    }
  
    addSignal(message, importance = 1) {
      this.signals.push({ message, importance });
      return this;
    }
  }
  
  // 技術分析器類別
  class TechnicalAnalyzer {
    constructor(stockData) {
      this.stockData = stockData;
      this.result = new AnalysisResult();
    }
  
    // 分析均線
    analyzeMAs() {
      const { ma5, ma20 } = this.stockData.indicators;
      const currentMA5 = ma5[ma5.length - 1];
      const currentMA20 = ma20[ma20.length - 1];
      const maRatio = currentMA5 / currentMA20;
  
      if (currentMA5 > currentMA20) {
        this.result.addSignal('MA5突破MA20，短期趨勢向上');
        
        if (maRatio > 1 + CONSTANTS.MA_DIVERGENCE_THRESHOLD) {
          this.result.addSignal('均線距離過大，注意回檔風險', 2);
          this.result.risk_level = Math.max(this.result.risk_level, 2);
        }
      } else {
        this.result.addSignal('MA5低於MA20，短期趨勢偏空');
        
        if (maRatio < 1 - CONSTANTS.MA_DIVERGENCE_THRESHOLD) {
          this.result.addSignal('均線距離過大，可能出現超賣', 2);
        }
      }
  
      return this;
    }
  
    // 分析RSI
    analyzeRSI() {
      const rsi = this.stockData.indicators.rsi[this.stockData.indicators.rsi.length - 1];
      
      if (rsi > CONSTANTS.RSI_OVERBOUGHT) {
        this.result.addSignal(`RSI (${rsi.toFixed(CONSTANTS.DEFAULT_DECIMAL_PLACES)}) 超過${CONSTANTS.RSI_OVERBOUGHT}，呈現超買狀態，注意賣出時機`, 2);
        this.result.risk_level = Math.max(this.result.risk_level, 2);
      } else if (rsi < CONSTANTS.RSI_OVERSOLD) {
        this.result.addSignal(`RSI (${rsi.toFixed(CONSTANTS.DEFAULT_DECIMAL_PLACES)}) 低於${CONSTANTS.RSI_OVERSOLD}，呈現超賣狀態，可考慮買進`);
      } else {
        this.result.addSignal(`RSI位於${rsi.toFixed(CONSTANTS.DEFAULT_DECIMAL_PLACES)}，處於正常區間`);
      }
  
      return this;
    }
  
    // 分析MACD
    analyzeMACD() {
      const { macdLine, signalLine } = this.stockData.indicators.macd;
      const currentMACD = macdLine[macdLine.length - 1];
      const currentSignal = signalLine[signalLine.length - 1];
  
      if (currentMACD > currentSignal) {
        this.result.addSignal('MACD位於信號線之上，持續看多');
        if (currentMACD > 0) {
          this.result.addSignal('MACD位於零軸之上，多頭趨勢確立');
        }
      } else {
        this.result.addSignal('MACD位於信號線之下，趨勢轉空');
        if (currentMACD < 0) {
          this.result.addSignal('MACD位於零軸之下，空頭趨勢確立');
        }
      }
  
      return this;
    }
  
    // 執行所有分析
    analyze() {
      return this
        .analyzeMAs()
        .analyzeRSI()
        .analyzeMACD()
        .result;
    }
  }
  
  // 成交量分析器類別
  class VolumeAnalyzer {
    constructor(stockData, daysToAnalyze = 5) {
      this.volumes = stockData.volumes;
      this.daysToAnalyze = daysToAnalyze;
      this.result = new AnalysisResult();
    }
  
    calculateRecentVolumes() {
      return this.volumes.slice(-this.daysToAnalyze);
    }
  
    calculateAverageVolume(volumes) {
      return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    }
  
    calculateVolumeTrend(volumes) {
      return volumes.map((vol, i) => {
        if (i === 0) return 0;
        return ((vol - volumes[i-1]) / volumes[i-1] * 100);
      });
    }
  
    analyze() {
      const recentVolumes = this.calculateRecentVolumes();
      const avgVolume = this.calculateAverageVolume(recentVolumes);
      const lastVolume = recentVolumes[recentVolumes.length - 1];
      const volumeTrend = this.calculateVolumeTrend(recentVolumes);
      const avgTrend = this.calculateAverageVolume(volumeTrend.slice(1));
  
      // 分析當日成交量
      if (lastVolume > avgVolume * CONSTANTS.VOLUME_SURGE_MULTIPLIER) {
        this.result.addSignal('今日成交量明顯放大，交易活絡');
        this.result.addSignal('建議關注價量配合度');
      } else if (lastVolume < avgVolume * CONSTANTS.VOLUME_DROP_MULTIPLIER) {
        this.result.addSignal('今日成交量明顯萎縮，觀望氣氛濃');
        this.result.addSignal('建議等待成交量回溫');
      } else {
        this.result.addSignal('成交量維持平穩，可持續觀察');
      }
  
      // 分析成交量趨勢
      if (avgTrend > CONSTANTS.VOLUME_TREND_THRESHOLD) {
        this.result.addSignal('近期量能持續放大，交易熱度上升');
      } else if (avgTrend < -CONSTANTS.VOLUME_TREND_THRESHOLD) {
        this.result.addSignal('近期量能持續萎縮，建議保守操作');
      }
  
      return this.result;
    }
  }
  
  // 圖表更新器類別
  class ChartUpdater {
    constructor(chartInstance, stockChart) {
      this.chartInstance = chartInstance;
      this.stockChart = stockChart;
    }
  
    static createChartConfig(data, holdingPeriod) {
      return {
        type: 'bar',
        data: {
          labels: data.dates,
          datasets: [
            {
              label: '股價',
              type: 'line',
              data: data.prices,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              yAxisID: 'price',
              tension: 0.1,
              order: 1
            },
            {
              label: 'MA5',
              type: 'line',
              data: data.ma5,
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              pointRadius: 0,
              yAxisID: 'price',
              order: 0
            },
            {
              label: 'MA20',
              type: 'line',
              data: data.ma20,
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              pointRadius: 0,
              yAxisID: 'price',
              order: 0
            },
            {
              label: '成交量',
              data: data.volumes,
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              yAxisID: 'volume',
              order: 2
            }
          ]
        },
        options: ChartUpdater.getChartOptions(holdingPeriod)
      };
    }
  
    static getChartOptions(holdingPeriod) {
      return {
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
                return `${context.dataset.label}: ${value.toFixed(CONSTANTS.DEFAULT_DECIMAL_PLACES)}`;
              }
            }
          }
        },
        scales: ChartUpdater.getChartScales()
      };
    }
  
    static getChartScales() {
      return {
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
      };
    }
  
    update(stockData, holdingPeriod) {
      const dataPoints = Math.min(holdingPeriod * 5, stockData.prices.length);
      const selectedData = {
        prices: stockData.prices.slice(-dataPoints),
        volumes: stockData.volumes.slice(-dataPoints),
        dates: stockData.dates.slice(-dataPoints),
        ma5: stockData.indicators.ma5.slice(-dataPoints),
        ma20: stockData.indicators.ma20.slice(-dataPoints)
      };
  
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
  
      this.chartInstance = new Chart(
        this.stockChart,
        ChartUpdater.createChartConfig(selectedData, holdingPeriod)
      );
    }
  }
  
  // 初始化應用
  function initializeApp() {
    document.addEventListener('DOMContentLoaded', () => {
      const stockData = initializeStockData();
      const chartUpdater = new ChartUpdater(null, document.getElementById('stockChart'));
      
      // 更新圖表和分析
      function updateAnalysis() {
        const technicalAnalysis = new TechnicalAnalyzer(stockData).analyze();
        const volumeAnalysis = new VolumeAnalyzer(stockData).analyze();
        
        // 更新UI (這部分需要根據實際DOM結構來實現)
        displayAnalysisResults(technicalAnalysis, volumeAnalysis);
        chartUpdater.update(stockData, getHoldingPeriod());
      }
  
      // 初始更新
      updateAnalysis();
    });
  }
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

        const filteredStocks = stockData.filter(stock => 
            (selectedIndustry === '' || stock.industry === selectedIndustry) &&
            (stock.code.includes(searchTerm) || 
             stock.name.includes(searchTerm) ||
             stock.industry.includes(searchTerm))
        );

        renderStockData(filteredStocks);
    }

    // 監聽篩選事件
    industryFilter.addEventListener('change', filterStocks);
    searchInput.addEventListener('input', filterStocks);

    // 初始渲染
    renderStockData(stockData);
});
>>>>>>> parent of 7346115 (11)
