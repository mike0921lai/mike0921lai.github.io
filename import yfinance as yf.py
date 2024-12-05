import yfinance as yf
import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import logging
import gradio as gr
import requests
from io import StringIO
import matplotlib.pyplot as plt
import random
import matplotlib

# 在程式碼開頭加入以下設定
matplotlib.rcParams['font.family'] = ['Microsoft YaHei']  # 使用微軟正黑體
# 或是 
matplotlib.rcParams['font.family'] = ['DFKai-SB']  # 使用標楷體
matplotlib.rcParams['axes.unicode_minus'] = False   # 讓負號正確顯示

# 備用方案:如果上述字型都無法使用,可以嘗試:
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'DFKai-SB', 'SimSun', 'Noto Sans CJK TC']

# 設置中文字型
plt.rcParams['font.sans-serif'] = ['Noto Sans CJK JP', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

def get_stock_list(max_retries=3, retry_delay=1) -> List[Tuple[str, str]]:
    """取得台股上市股票清單，加入重試機制"""
    default_stocks = [("2330", "台積電"), ("2317", "鴻海"), ("2308", "台達電")]
    
    for attempt in range(max_retries):
        try:
            url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2"
            response = requests.get(url, timeout=10)
            response.encoding = 'big5'
            
            if response.status_code != 200:
                raise requests.RequestException(f"HTTP error {response.status_code}")
                
            df = pd.read_html(StringIO(response.text))[0]
            df = df.iloc[2:, [0, 1]]
            df.columns = ['代碼和名稱', '公司名稱']

            df['股票代碼'] = df['代碼和名稱'].str.split().str[0]
            df['股票名稱'] = df['代碼和名稱'].str.split().str[1]
            
            # 更嚴格的股票代碼驗證
            mask = df['股票代碼'].str.match(r'^\d{4}$') & df['股票名稱'].notna()
            df = df[mask]
            
            if df.empty:
                raise ValueError("No valid stock data found")
                
            return list(zip(df['股票代碼'].tolist(), df['股票名稱'].tolist()))
            
        except Exception as e:
            logging.warning(f"第 {attempt + 1} 次嘗試取得股票列表失敗: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logging.error(f"無法取得股票列表，使用預設值: {e}")
                return default_stocks

def scrape_stock_data():
    """抓取股票資料並加入錯誤處理與快取機制"""
    cache_file = 'stock_data_cache.pkl'
    
    # 檢查快取
    try:
        if os.path.exists(cache_file):
            if time.time() - os.path.getmtime(cache_file) < 86400:  # 24小時內的快取
                return pd.read_pickle(cache_file)
    except:
        pass
        
    url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        response.encoding = 'big5'
        
        df = pd.read_html(response.text)[0]
        df.columns = ['有價證券代號及名稱', 'ISIN Code', '上市日', '市場別', '產業別', '公司名稱', '備註']
        df[['代號', '名稱']] = df['有價證券代號及名稱'].str.split('　', n=1, expand=True)
        df = df[['代號', '名稱', '產業別']].dropna()
        
        # 儲存快取
        df.to_pickle(cache_file)
        
        return df
        
    except Exception as e:
        logging.error(f"抓取股票資料失敗: {str(e)}")
        # 如果有快取則使用快取
        if os.path.exists(cache_file):
            return pd.read_pickle(cache_file)
        return pd.DataFrame()

@dataclass
class TradingInterval:
    lower_bound: float
    upper_bound: float
    avg_profit: float
    profit_probability: float
    sample_size: int
    is_buy_signal: bool

class GeneticAlgorithm:
    def __init__(self,
                 population_size: int = 50,
                 chromosome_length: int = 10,
                 generations: int = 100,
                 crossover_rate: float = 0.8,
                 mutation_rate: float = 0.1):
        self.population_size = population_size
        self.chromosome_length = chromosome_length
        self.generations = generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate
        self.best_solution = None
        self.best_fitness = float('-inf')

    def initialize_population(self) -> List[str]:
        return [''.join(random.choice('01') for _ in range(self.chromosome_length))
                for _ in range(self.population_size)]

    def decode_chromosome(self, chromosome: str) -> dict:
        chunks = [chromosome[i:i+2] for i in range(0, len(chromosome), 2)]
        return {
            'intervals': 3 + int(chunks[0], 2),  # 區間數 3-6
            'holding_period': 5 + int(chunks[1], 2) * 5,  # 持有期間 5-25
            'target_profit_ratio': 0.5 + int(chunks[2], 2) * 0.2,  # 目標利潤比例 0.5-1.3
            'confidence_threshold': 0.3 + int(chunks[3], 2) * 0.1  # 信心水準 0.3-0.7
        }

    def select_parents(self, population: List[str], fitness_values: List[float]) -> Tuple[str, str]:
        """改進的父代選擇機制"""
        try:
            # 過濾無效的適應度值
            valid_pairs = [(p, f) for p, f in zip(population, fitness_values)
                          if not (np.isnan(f) or np.isinf(f))]
            
            if len(valid_pairs) < 2:
                # 如果有效配對不足，隨機選擇
                return tuple(random.sample(population, 2))
            
            valid_population, valid_fitness = zip(*valid_pairs)
            
            # 適應度值標準化
            min_fitness = min(valid_fitness)
            max_fitness = max(valid_fitness)
            
            if max_fitness == min_fitness:
                return tuple(random.sample(valid_population, 2))
                
            normalized_fitness = [(f - min_fitness) / (max_fitness - min_fitness) + 1e-6 
                                for f in valid_fitness]
            
            # 使用輪盤法選擇父代
            total_fitness = sum(normalized_fitness)
            probabilities = [f/total_fitness for f in normalized_fitness]
            
            selected_indices = np.random.choice(
                len(valid_population),
                size=2,
                p=probabilities,
                replace=False  # 確保不會選到同一個
            )
            
            return (valid_population[selected_indices[0]], 
                    valid_population[selected_indices[1]])
                    
        except Exception as e:
            logging.error(f"Parent selection error: {e}")
            return tuple(random.sample(population, 2))

    def crossover(self, parent1: str, parent2: str) -> Tuple[str, str]:
        if random.random() < self.crossover_rate:
            point = random.randint(1, self.chromosome_length-1)
            child1 = parent1[:point] + parent2[point:]
            child2 = parent2[:point] + parent1[point:]
            return child1, child2
        return parent1, parent2

    def mutate(self, chromosome: str) -> str:
        if random.random() < self.mutation_rate:
            point = random.randint(0, self.chromosome_length-1)
            chromosome_list = list(chromosome)
            chromosome_list[point] = '1' if chromosome_list[point] == '0' else '0'
            return ''.join(chromosome_list)
        return chromosome

    def evolve(self, fitness_func):
        population = self.initialize_population()
        
        for generation in range(self.generations):
            try:
                fitness_values = [fitness_func(self.decode_chromosome(chrom)) 
                                for chrom in population]
                
                max_fitness_idx = np.argmax(fitness_values)
                if fitness_values[max_fitness_idx] > self.best_fitness:
                    self.best_fitness = fitness_values[max_fitness_idx]
                    self.best_solution = population[max_fitness_idx]
                
                new_population = []
                for _ in range(self.population_size // 2):
                    parent1, parent2 = self.select_parents(population, fitness_values)
                    child1, child2 = self.crossover(parent1, parent2)
                    child1 = self.mutate(child1)
                    child2 = self.mutate(child2)
                    new_population.extend([child1, child2])
                
                population = new_population
                
                if generation % 10 == 0:
                    print(f"Generation {generation}: Best Fitness = {self.best_fitness:.4f}")
                    
            except Exception as e:
                print(f"Evolution error in generation {generation}: {e}")
                continue

class StockAnalyzer:
    def __init__(self,
                 symbol: str,
                 holding_period: int = 10,
                 num_intervals: int = 5,
                 target_profit_ratio: float = 0.8,
                 confidence_threshold: float = 0.6,
                 years_of_history: int = 5):
        self.symbol = symbol
        self.holding_period = holding_period
        self.num_intervals = num_intervals
        self.target_profit_ratio = target_profit_ratio
        self.confidence_threshold = confidence_threshold
        self.years_of_history = years_of_history
        
        self.logger = logging.getLogger(__name__)
        self.historical_data = None
        self.trading_intervals = None
        self.ga = GeneticAlgorithm(generations=50)  # 減少世代數以加快運算

    def fitness_function(self, params: dict) -> float:
        """改進的適應度計算"""
        try:
            # 參數合理性檢查
            if not all(isinstance(v, (int, float)) for v in params.values()):
                return float('-inf')
                
            self.num_intervals = max(3, min(6, params['intervals']))
            self.holding_period = max(5, min(25, params['holding_period']))
            self.target_profit_ratio = max(0.5, min(1.3, params['target_profit_ratio']))
            self.confidence_threshold = max(0.3, min(0.7, params['confidence_threshold']))
            
            self.analyze_profit_patterns()
            
            buy_signals = [interval for interval in self.trading_intervals 
                          if interval.is_buy_signal]
            
            if not buy_signals:
                return float('-inf')
                
            # 計算綜合得分
            total_profit = sum(interval.avg_profit for interval in buy_signals)
            avg_probability = np.mean([interval.profit_probability for interval in buy_signals])
            avg_sample_size = np.mean([interval.sample_size for interval in buy_signals])
            
            # 加入風險調整因子
            risk_factor = 1.0 - np.std([interval.avg_profit for interval in buy_signals]) / (total_profit + 1e-6)
            
            score = (total_profit * avg_probability * np.log1p(avg_sample_size) * max(0.1, risk_factor))
            
            return float('-inf') if np.isnan(score) or np.isinf(score) else score
            
        except Exception as e:
            logging.error(f"Fitness calculation error: {e}")
            return float('-inf')

    def fetch_data(self) -> pd.DataFrame:
        """改進的資料擷取功能"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                ticker = yf.Ticker(f"{self.symbol}.TW")
                data = ticker.history(period=f"{self.years_of_history}y")
                
                if data.empty:
                    raise ValueError(f"無法取得股票 {self.symbol} 的資料")
                    
                # 檢查資料品質
                if len(data) < 20:  # 至少需要20個交易日的資料
                    raise ValueError(f"股票 {self.symbol} 的資料量不足")
                    
                # 檢查是否有遺漏值
                if data.isnull().any().any():
                    data = data.fillna(method='ffill').fillna(method='bfill')
                    
                self.historical_data = data
                return self.historical_data
                
            except Exception as e:
                if attempt < max_retries - 1:
                    logging.warning(f"第 {attempt + 1} 次嘗試取得 {self.symbol} 資料失敗: {e}")
                    time.sleep(retry_delay)
                else:
                    logging.error(f"無法取得 {self.symbol} 資料: {e}")
                    raise

    def calculate_price_intervals(self) -> List[Tuple[float, float]]:
        price_range = self.historical_data['High'].max() - self.historical_data['Low'].min()
        interval_length = price_range / self.num_intervals
        min_price = self.historical_data['Low'].min()

        return [(min_price + i * interval_length,
                min_price + (i + 1) * interval_length)
                for i in range(self.num_intervals)]

    def analyze_profit_patterns(self) -> List[TradingInterval]:
        if self.historical_data is None:
            self.fetch_data()

        intervals = self.calculate_price_intervals()
        close_prices = self.historical_data['Close']
        
        max_idx = len(close_prices) - self.holding_period
        buy_sell_pairs = [(close_prices.iloc[i],
                          close_prices.iloc[i + self.holding_period])
                          for i in range(max_idx)]

        interval_profits = {interval: [] for interval in intervals}

        for buy_price, sell_price in buy_sell_pairs:
            for interval in intervals:
                if interval[0] <= buy_price < interval[1]:
                    profit = sell_price - buy_price
                    interval_profits[interval].append(profit)
                    break

        trading_intervals = []
        for interval, profits in interval_profits.items():
            if profits:
                avg_profit = np.mean(profits)
                interval_length = interval[1] - interval[0]
                target_profit = self.target_profit_ratio * interval_length
                profit_probability = np.mean([p >= target_profit for p in profits])
                is_buy_signal = profit_probability >= self.confidence_threshold

                trading_intervals.append(TradingInterval(
                    lower_bound=interval[0],
                    upper_bound=interval[1],
                    avg_profit=avg_profit,
                    profit_probability=profit_probability,
                    sample_size=len(profits),
                    is_buy_signal=is_buy_signal
                ))

        self.trading_intervals = trading_intervals
        return trading_intervals

    def optimize_parameters(self):
        """使用遺傳算法優化參數"""
        self.ga.evolve(self.fitness_function)
        best_params = self.ga.decode_chromosome(self.ga.best_solution)
        
        # 更新最佳參數
        self.num_intervals = best_params['intervals']
        self.holding_period = best_params['holding_period']
        self.target_profit_ratio = best_params['target_profit_ratio']
        self.confidence_threshold = best_params['confidence_threshold']

    def generate_trading_rules(self) -> List[str]:
        """生成交易規則"""
        if self.trading_intervals is None:
            self.analyze_profit_patterns()

        rules = []
        for interval in self.trading_intervals:
            price_range = f"{interval.lower_bound:.2f}-{interval.upper_bound:.2f}"
            if interval.is_buy_signal:
                rules.append(f"買進規則: 當股價在 {price_range} 區間時買入")
                stop_loss = interval.lower_bound - (0.2 * interval.lower_bound)
                rules.append(f"  - 停損點: 當股價跌破 {stop_loss:.2f} 時賣出")
                rules.append(f"  - 達到目標獲利機率: {interval.profit_probability*100:.1f}%")
            else:
                rules.append(f"觀望規則: 當股價在 {price_range} 區間時進場")
            rules.append(f"  - 平均獲利: {interval.avg_profit:.2f}")
            rules.append(f"  - 基於 {interval.sample_size} 筆歷史資料\n")

        return rules

    def plot_analysis(self) -> plt.Figure:
        """繪製分析圖表"""
        if self.trading_intervals is None:
            self.analyze_profit_patterns()

        fig = plt.figure(figsize=(12, 8))
        
        # 股價走勢
        ax1 = plt.subplot(2, 1, 1)
        ax1.plot(self.historical_data.index, self.historical_data['Close'],
                 label='收盤價', color='blue', linewidth=1)
        
        ax1.set_title(f'股票 {self.symbol} 股價走勢與交易區間分析', fontsize=12, pad=20)
        ax1.set_ylabel('股價', fontsize=10)
        ax1.grid(True, linestyle='--', alpha=0.7)
        ax1.legend()

        # 標記買進區間
        for interval in self.trading_intervals:
            color = 'lightgreen' if interval.is_buy_signal else 'lightcoral'
            alpha = 0.3 if interval.is_buy_signal else 0.2
            ax1.axhspan(interval.lower_bound, interval.upper_bound,
                       color=color, alpha=alpha)
            ax1.text(self.historical_data.index[-1],
                    (interval.lower_bound + interval.upper_bound)/2,
                    f'{interval.lower_bound:.0f}-{interval.upper_bound:.0f}',
                    verticalalignment='center')

        # 獲利機率分布
        ax2 = plt.subplot(2, 1, 2)
        intervals = [f"{i.lower_bound:.0f}-{i.upper_bound:.0f}"
                    for i in self.trading_intervals]
        probs = [i.profit_probability * 100 for i in self.trading_intervals]
        colors = ['lightgreen' if i.is_buy_signal else 'lightcoral'
                  for i in self.trading_intervals]

        # 繼續 plot_analysis 方法
        bars = ax2.bar(intervals, probs, color=colors)
        ax2.axhline(y=self.confidence_threshold * 100,
                    color='black', linestyle='--', label='信心水準')

        # 在柱狀圖上添加數值標籤
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}%',
                    ha='center', va='bottom')

        ax2.set_title('各價格區間獲利機率分析', fontsize=12, pad=20)
        ax2.set_ylabel('獲利機率 (%)', fontsize=10)
        ax2.set_xticklabels(intervals, rotation=45)
        ax2.grid(True, linestyle='--', alpha=0.7)
        ax2.legend()

        plt.tight_layout()
        return fig

def analyze_stock(stock_option: str, use_genetic: bool = False) -> Tuple[str, plt.Figure]:
    """分析股票並返回結果"""
    try:
        stock_code = stock_option.split(' - ')[0]
        
        # 創建分析器實例
        analyzer = StockAnalyzer(symbol=stock_code)
        
        if use_genetic:
            print("開始遺傳算法優化...")
            analyzer.optimize_parameters()
            print("優化完成!")
            
        # 生成交易規則
        rules = analyzer.generate_trading_rules()
        rules_text = "\n".join(rules)

        # 生成圖表
        fig = analyzer.plot_analysis()

        # 如果使用了遺傳算法，添加參數資訊
        if use_genetic:
            rules_text += "\n\n最佳參數設置："
            rules_text += f"\n區間數：{analyzer.num_intervals}"
            rules_text += f"\n持有期間：{analyzer.holding_period}天"
            rules_text += f"\n目標獲利比例：{analyzer.target_profit_ratio:.2f}"
            rules_text += f"\n信心水準：{analyzer.confidence_threshold:.2f}"
            rules_text += f"\n最佳適應度：{analyzer.ga.best_fitness:.4f}"

        return rules_text, fig

    except Exception as e:
        print(f"分析錯誤：{str(e)}")
        return f"分析時發生錯誤：{str(e)}", None

def main():
    # 設置日誌
    logging.basicConfig(level=logging.INFO)
    
    # 設置 Gradio CSS 
    css = """
    * {
        font-family: "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif !important;
    }
    """

    # 獲取股票列表
    stocks = get_stock_list()
    stock_options = [f"{code} - {name}" for code, name in stocks]

    # 創建 Gradio 界面
    iface = gr.Interface(
        fn=analyze_stock,
        inputs=[
            gr.Dropdown(choices=stock_options, label="選擇股票", info="選擇要分析的股票"),
            gr.Checkbox(label="使用遺傳算法優化參數", info="使用遺傳算法自動尋找最佳參數組合")
        ],
        outputs=[
            gr.Textbox(label="交易規則", lines=10),
            gr.Plot(label="分析圖表")
        ],
        title="台股交易策略分析系統 (遺傳算法優化版)",
        description="選擇股票並決定是否使用遺傳算法優化參數，系統會分析歷史數據並生成交易建議。",
        theme="default",
        css=css
    )

    iface.launch()

if __name__ == "__main__":
    main()