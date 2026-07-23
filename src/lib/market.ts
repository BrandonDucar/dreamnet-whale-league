import type { ChartPoint, MarketAsset, MarketWindow, OrderBookLevel } from './types'

export const fallbackStockAssets: MarketAsset[] = [
  { id: 'stock-nvda', symbol: 'NVDA', name: 'NVIDIA Corp', image: '', price: 128.50, change1h: 0.35, change24h: 3.42, change7d: 8.12, marketCap: 3_150_000_000_000, volume: 42_500_000_000, rank: 1, assetType: 'stock' },
  { id: 'stock-aapl', symbol: 'AAPL', name: 'Apple Inc', image: '', price: 224.30, change1h: 0.12, change24h: 1.85, change7d: 3.64, marketCap: 3_420_000_000_000, volume: 28_400_000_000, rank: 2, assetType: 'stock' },
  { id: 'stock-msft', symbol: 'MSFT', name: 'Microsoft Corp', image: '', price: 445.20, change1h: -0.05, change24h: 0.92, change7d: 2.15, marketCap: 3_310_000_000_000, volume: 21_800_000_000, rank: 3, assetType: 'stock' },
  { id: 'stock-amzn', symbol: 'AMZN', name: 'Amazon.com Inc', image: '', price: 186.40, change1h: 0.45, change24h: 2.14, change7d: 4.88, marketCap: 1_940_000_000_000, volume: 18_900_000_000, rank: 4, assetType: 'stock' },
  { id: 'stock-googl', symbol: 'GOOGL', name: 'Alphabet Inc', image: '', price: 178.90, change1h: -0.15, change24h: -0.45, change7d: 1.24, marketCap: 2_230_000_000_000, volume: 15_600_000_000, rank: 5, assetType: 'stock' },
  { id: 'stock-meta', symbol: 'META', name: 'Meta Platforms', image: '', price: 512.60, change1h: 0.82, change24h: 4.18, change7d: 9.42, marketCap: 1_300_000_000_000, volume: 19_200_000_000, rank: 6, assetType: 'stock' },
  { id: 'stock-tsla', symbol: 'TSLA', name: 'Tesla Inc', image: '', price: 248.50, change1h: 1.25, change24h: 6.32, change7d: 14.50, marketCap: 790_000_000_000, volume: 31_400_000_000, rank: 7, assetType: 'stock' },
  { id: 'stock-brka', symbol: 'BRK.A', name: 'Berkshire Hathaway', image: '', price: 672400.00, change1h: 0.02, change24h: 0.35, change7d: 1.12, marketCap: 980_000_000_000, volume: 1_200_000_000, rank: 8, assetType: 'stock' },
  { id: 'stock-avgo', symbol: 'AVGO', name: 'Broadcom Inc', image: '', price: 164.20, change1h: 0.54, change24h: 2.88, change7d: 6.74, marketCap: 760_000_000_000, volume: 8_900_000_000, rank: 9, assetType: 'stock' },
  { id: 'stock-lly', symbol: 'LLY', name: 'Eli Lilly & Co', image: '', price: 942.10, change1h: 0.18, change24h: 1.25, change7d: -0.84, marketCap: 890_000_000_000, volume: 5_400_000_000, rank: 10, assetType: 'stock' },
  { id: 'stock-jpm', symbol: 'JPM', name: 'JPMorgan Chase', image: '', price: 208.40, change1h: 0.22, change24h: 1.12, change7d: 3.14, marketCap: 590_000_000_000, volume: 6_200_000_000, rank: 11, assetType: 'stock' },
  { id: 'stock-wmt', symbol: 'WMT', name: 'Walmart Inc', image: '', price: 68.20, change1h: 0.08, change24h: 0.84, change7d: 2.05, marketCap: 540_000_000_000, volume: 4_800_000_000, rank: 12, assetType: 'stock' },
  { id: 'stock-v', symbol: 'V', name: 'Visa Inc', image: '', price: 268.90, change1h: 0.11, change24h: 0.62, change7d: 1.84, marketCap: 550_000_000_000, volume: 5_100_000_000, rank: 13, assetType: 'stock' },
  { id: 'stock-ma', symbol: 'MA', name: 'Mastercard Inc', image: '', price: 442.30, change1h: 0.09, change24h: 0.48, change7d: 1.62, marketCap: 410_000_000_000, volume: 3_900_000_000, rank: 14, assetType: 'stock' },
  { id: 'stock-unh', symbol: 'UNH', name: 'UnitedHealth Group', image: '', price: 564.10, change1h: -0.42, change24h: -1.22, change7d: -3.45, marketCap: 520_000_000_000, volume: 4_300_000_000, rank: 15, assetType: 'stock' },
  { id: 'stock-orcl', symbol: 'ORCL', name: 'Oracle Corp', image: '', price: 138.60, change1h: 0.65, change24h: 3.11, change7d: 7.24, marketCap: 380_000_000_000, volume: 6_400_000_000, rank: 16, assetType: 'stock' },
  { id: 'stock-xom', symbol: 'XOM', name: 'Exxon Mobil Corp', image: '', price: 118.40, change1h: -0.28, change24h: -0.78, change7d: 0.85, marketCap: 470_000_000_000, volume: 5_800_000_000, rank: 17, assetType: 'stock' },
  { id: 'stock-cost', symbol: 'COST', name: 'Costco Wholesale', image: '', price: 848.20, change1h: 0.31, change24h: 1.64, change7d: 4.12, marketCap: 375_000_000_000, volume: 3_200_000_000, rank: 18, assetType: 'stock' },
  { id: 'stock-pg', symbol: 'PG', name: 'Procter & Gamble', image: '', price: 168.10, change1h: 0.05, change24h: 0.24, change7d: 1.05, marketCap: 395_000_000_000, volume: 3_600_000_000, rank: 19, assetType: 'stock' },
  { id: 'stock-hd', symbol: 'HD', name: 'Home Depot Inc', image: '', price: 362.40, change1h: 0.18, change24h: 1.05, change7d: 2.84, marketCap: 360_000_000_000, volume: 4_100_000_000, rank: 20, assetType: 'stock' },
  { id: 'stock-bac', symbol: 'BAC', name: 'Bank of America', image: '', price: 39.80, change1h: 0.34, change24h: 1.45, change7d: 3.92, marketCap: 310_000_000_000, volume: 5_200_000_000, rank: 21, assetType: 'stock' },
  { id: 'stock-nflx', symbol: 'NFLX', name: 'Netflix Inc', image: '', price: 642.80, change1h: 0.72, change24h: 2.95, change7d: 8.14, marketCap: 276_000_000_000, volume: 7_400_000_000, rank: 22, assetType: 'stock' },
  { id: 'stock-jnj', symbol: 'JNJ', name: 'Johnson & Johnson', image: '', price: 152.40, change1h: -0.08, change24h: -0.32, change7d: -0.94, marketCap: 365_000_000_000, volume: 3_800_000_000, rank: 23, assetType: 'stock' },
  { id: 'stock-abbv', symbol: 'ABBV', name: 'AbbVie Inc', image: '', price: 174.60, change1h: 0.14, change24h: 0.88, change7d: 2.45, marketCap: 310_000_000_000, volume: 3_100_000_000, rank: 24, assetType: 'stock' },
  { id: 'stock-cvx', symbol: 'CVX', name: 'Chevron Corp', image: '', price: 156.80, change1h: -0.32, change24h: -0.95, change7d: 0.42, marketCap: 290_000_000_000, volume: 4_400_000_000, rank: 25, assetType: 'stock' },
  { id: 'stock-crm', symbol: 'CRM', name: 'Salesforce Inc', image: '', price: 242.10, change1h: 0.41, change24h: 1.82, change7d: 5.12, marketCap: 235_000_000_000, volume: 4_900_000_000, rank: 26, assetType: 'stock' },
  { id: 'stock-ko', symbol: 'KO', name: 'Coca-Cola Co', image: '', price: 68.40, change1h: 0.08, change24h: 0.42, change7d: 1.34, marketCap: 295_000_000_000, volume: 3_200_000_000, rank: 27, assetType: 'stock' },
  { id: 'stock-mrk', symbol: 'MRK', name: 'Merck & Co Inc', image: '', price: 124.50, change1h: 0.04, change24h: 0.18, change7d: -0.45, marketCap: 315_000_000_000, volume: 3_500_000_000, rank: 28, assetType: 'stock' },
  { id: 'stock-amd', symbol: 'AMD', name: 'Advanced Micro Devices', image: '', price: 158.40, change1h: 0.95, change24h: 4.62, change7d: 11.24, marketCap: 256_000_000_000, volume: 11_400_000_000, rank: 29, assetType: 'stock' },
  { id: 'stock-pep', symbol: 'PEP', name: 'PepsiCo Inc', image: '', price: 164.20, change1h: -0.05, change24h: -0.15, change7d: 0.82, marketCap: 225_000_000_000, volume: 2_900_000_000, rank: 30, assetType: 'stock' },
  { id: 'stock-tmus', symbol: 'TMUS', name: 'T-Mobile US', image: '', price: 176.40, change1h: 0.18, change24h: 0.92, change7d: 2.14, marketCap: 210_000_000_000, volume: 2_600_000_000, rank: 31, assetType: 'stock' },
  { id: 'stock-tmo', symbol: 'TMO', name: 'Thermo Fisher Scientific', image: '', price: 542.10, change1h: 0.24, change24h: 1.15, change7d: 3.42, marketCap: 208_000_000_000, volume: 2_800_000_000, rank: 32, assetType: 'stock' },
  { id: 'stock-wfc', symbol: 'WFC', name: 'Wells Fargo & Co', image: '', price: 58.40, change1h: 0.28, change24h: 1.32, change7d: 3.64, marketCap: 205_000_000_000, volume: 3_900_000_000, rank: 33, assetType: 'stock' },
  { id: 'stock-csco', symbol: 'CSCO', name: 'Cisco Systems', image: '', price: 48.20, change1h: 0.11, change24h: 0.55, change7d: 1.92, marketCap: 194_000_000_000, volume: 3_100_000_000, rank: 34, assetType: 'stock' },
  { id: 'stock-mcd', symbol: 'MCD', name: 'McDonalds Corp', image: '', price: 258.40, change1h: 0.05, change24h: 0.28, change7d: 0.95, marketCap: 186_000_000_000, volume: 2_700_000_000, rank: 35, assetType: 'stock' },
  { id: 'stock-intc', symbol: 'INTC', name: 'Intel Corp', image: '', price: 32.40, change1h: -0.62, change24h: -2.84, change7d: -6.42, marketCap: 138_000_000_000, volume: 6_800_000_000, rank: 36, assetType: 'stock' },
  { id: 'stock-ibm', symbol: 'IBM', name: 'IBM Corp', image: '', price: 184.20, change1h: 0.32, change24h: 1.42, change7d: 4.18, marketCap: 169_000_000_000, volume: 3_400_000_000, rank: 37, assetType: 'stock' },
  { id: 'stock-dis', symbol: 'DIS', name: 'Walt Disney Co', image: '', price: 96.80, change1h: -0.22, change24h: -0.85, change7d: -2.14, marketCap: 176_000_000_000, volume: 4_500_000_000, rank: 38, assetType: 'stock' },
  { id: 'stock-ge', symbol: 'GE', name: 'GE Aerospace', image: '', price: 164.80, change1h: 0.45, change24h: 2.15, change7d: 5.84, marketCap: 180_000_000_000, volume: 3_800_000_000, rank: 39, assetType: 'stock' },
  { id: 'stock-pm', symbol: 'PM', name: 'Philip Morris Intl', image: '', price: 102.40, change1h: 0.12, change24h: 0.64, change7d: 1.85, marketCap: 159_000_000_000, volume: 2_400_000_000, rank: 40, assetType: 'stock' },
  { id: 'stock-cat', symbol: 'CAT', name: 'Caterpillar Inc', image: '', price: 348.20, change1h: 0.38, change24h: 1.78, change7d: 4.95, marketCap: 172_000_000_000, volume: 3_600_000_000, rank: 41, assetType: 'stock' },
  { id: 'stock-vz', symbol: 'VZ', name: 'Verizon Communications', image: '', price: 41.20, change1h: 0.02, change24h: 0.12, change7d: 0.65, marketCap: 173_000_000_000, volume: 3_900_000_000, rank: 42, assetType: 'stock' },
  { id: 'stock-axp', symbol: 'AXP', name: 'American Express', image: '', price: 268.90, change1h: 0.42, change24h: 1.95, change7d: 5.24, marketCap: 192_000_000_000, volume: 3_200_000_000, rank: 43, assetType: 'stock' },
  { id: 'stock-uber', symbol: 'UBER', name: 'Uber Technologies', image: '', price: 72.40, change1h: 0.75, change24h: 3.28, change7d: 8.64, marketCap: 151_000_000_000, volume: 5_900_000_000, rank: 44, assetType: 'stock' },
  { id: 'stock-ms', symbol: 'MS', name: 'Morgan Stanley', image: '', price: 98.40, change1h: 0.25, change24h: 1.22, change7d: 3.42, marketCap: 160_000_000_000, volume: 3_100_000_000, rank: 45, assetType: 'stock' },
  { id: 'stock-txn', symbol: 'TXN', name: 'Texas Instruments', image: '', price: 198.40, change1h: 0.18, change24h: 0.84, change7d: 2.65, marketCap: 181_000_000_000, volume: 2_900_000_000, rank: 46, assetType: 'stock' },
  { id: 'stock-cmg', symbol: 'CMG', name: 'Chipotle Mexican Grill', image: '', price: 64.80, change1h: 0.52, change24h: 2.42, change7d: 6.18, marketCap: 88_000_000_000, volume: 2_400_000_000, rank: 47, assetType: 'stock' },
  { id: 'stock-hon', symbol: 'HON', name: 'Honeywell International', image: '', price: 214.20, change1h: 0.08, change24h: 0.48, change7d: 1.64, marketCap: 139_000_000_000, volume: 2_200_000_000, rank: 48, assetType: 'stock' },
  { id: 'stock-amat', symbol: 'AMAT', name: 'Applied Materials', image: '', price: 218.40, change1h: 0.82, change24h: 3.64, change7d: 9.15, marketCap: 180_000_000_000, volume: 4_600_000_000, rank: 49, assetType: 'stock' },
  { id: 'stock-low', symbol: 'LOW', name: 'Lowes Companies', image: '', price: 228.40, change1h: 0.18, change24h: 0.95, change7d: 2.84, marketCap: 130_000_000_000, volume: 2_500_000_000, rank: 50, assetType: 'stock' },
]

export const fallbackCryptoAssets: MarketAsset[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: '', price: 68240, change1h: 0.42, change24h: 2.81, change7d: 5.64, marketCap: 1_347_000_000_000, volume: 38_400_000_000, rank: 1, assetType: 'crypto' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 3568, change1h: -0.18, change24h: 1.34, change7d: 4.08, marketCap: 429_000_000_000, volume: 19_200_000_000, rank: 2, assetType: 'crypto' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', image: '', price: 1, change1h: 0.01, change24h: 0.02, change7d: -0.01, marketCap: 112_000_000_000, volume: 52_700_000_000, rank: 3, assetType: 'crypto' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: '', price: 594, change1h: 0.21, change24h: -0.74, change7d: 2.24, marketCap: 87_600_000_000, volume: 1_840_000_000, rank: 4, assetType: 'crypto' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: '', price: 151.4, change1h: 0.86, change24h: 5.72, change7d: 9.83, marketCap: 70_100_000_000, volume: 4_920_000_000, rank: 5, assetType: 'crypto' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', image: '', price: 1, change1h: 0, change24h: 0.01, change7d: 0.02, marketCap: 32_900_000_000, volume: 6_800_000_000, rank: 6, assetType: 'crypto' },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', image: '', price: 0.526, change1h: -0.42, change24h: -2.18, change7d: 1.72, marketCap: 29_300_000_000, volume: 1_280_000_000, rank: 7, assetType: 'crypto' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: '', price: 0.142, change1h: 0.66, change24h: 3.91, change7d: -1.82, marketCap: 20_500_000_000, volume: 1_410_000_000, rank: 8, assetType: 'crypto' },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', image: '', price: 7.18, change1h: -0.12, change24h: 1.08, change7d: 6.21, marketCap: 17_600_000_000, volume: 386_000_000, rank: 9, assetType: 'crypto' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: '', price: 0.452, change1h: 0.33, change24h: 2.42, change7d: 3.11, marketCap: 16_100_000_000, volume: 441_000_000, rank: 10, assetType: 'crypto' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: '', price: 34.62, change1h: 1.12, change24h: 6.84, change7d: 8.26, marketCap: 13_700_000_000, volume: 612_000_000, rank: 11, assetType: 'crypto' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: '', price: 14.88, change1h: -0.31, change24h: -1.64, change7d: 4.52, marketCap: 8_730_000_000, volume: 498_000_000, rank: 12, assetType: 'crypto' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: '', price: 6.72, change1h: 0.22, change24h: 1.16, change7d: -2.38, marketCap: 9_650_000_000, volume: 221_000_000, rank: 13, assetType: 'crypto' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: '', price: 0.000018, change1h: 0.45, change24h: 3.12, change7d: -4.15, marketCap: 10_500_000_000, volume: 320_000_000, rank: 14, assetType: 'crypto' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', image: '', price: 5.42, change1h: 0.95, change24h: 4.82, change7d: 12.40, marketCap: 5_900_000_000, volume: 280_000_000, rank: 15, assetType: 'crypto' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', image: '', price: 384.20, change1h: 0.15, change24h: 1.92, change7d: 3.84, marketCap: 7_580_000_000, volume: 195_000_000, rank: 16, assetType: 'crypto' },
  { id: 'leo-token', symbol: 'LEO', name: 'UNUS SED LEO', image: '', price: 5.82, change1h: 0.02, change24h: 0.15, change7d: -0.42, marketCap: 5_410_000_000, volume: 2_400_000, rank: 17, assetType: 'crypto' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: '', price: 74.50, change1h: -0.12, change24h: 0.85, change7d: 2.14, marketCap: 5_570_000_000, volume: 310_000_000, rank: 18, assetType: 'crypto' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: '', price: 10.26, change1h: 0.71, change24h: 4.26, change7d: 11.84, marketCap: 6_160_000_000, volume: 388_000_000, rank: 19, assetType: 'crypto' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', image: '', price: 0.000011, change1h: 1.45, change24h: 8.42, change7d: 18.50, marketCap: 4_620_000_000, volume: 840_000_000, rank: 20, assetType: 'crypto' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Artificial Superintelligence', image: '', price: 1.48, change1h: 2.15, change24h: 12.40, change7d: 24.50, marketCap: 3_720_000_000, volume: 490_000_000, rank: 21, assetType: 'crypto' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', image: '', price: 8.42, change1h: 0.32, change24h: 2.15, change7d: 5.12, marketCap: 3_940_000_000, volume: 112_000_000, rank: 22, assetType: 'crypto' },
  { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic', image: '', price: 23.40, change1h: -0.15, change24h: 0.92, change7d: 1.84, marketCap: 3_450_000_000, volume: 145_000_000, rank: 23, assetType: 'crypto' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', image: '', price: 0.098, change1h: 0.11, change24h: 1.24, change7d: 2.95, marketCap: 2_880_000_000, volume: 88_000_000, rank: 24, assetType: 'crypto' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', image: '', price: 1.84, change1h: 1.82, change24h: 9.42, change7d: 21.40, marketCap: 4_950_000_000, volume: 620_000_000, rank: 25, assetType: 'crypto' },
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', image: '', price: 0.174, change1h: 0.45, change24h: 3.82, change7d: 7.92, marketCap: 4_210_000_000, volume: 142_000_000, rank: 26, assetType: 'crypto' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', image: '', price: 6.85, change1h: 0.62, change24h: 4.15, change7d: 10.84, marketCap: 3_210_000_000, volume: 195_000_000, rank: 27, assetType: 'crypto' },
  { id: 'blockstack', symbol: 'STX', name: 'Stacks', image: '', price: 1.72, change1h: 0.38, change24h: 2.94, change7d: 6.42, marketCap: 2_540_000_000, volume: 98_000_000, rank: 28, assetType: 'crypto' },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', image: '', price: 0.088, change1h: -0.05, change24h: 0.45, change7d: 1.15, marketCap: 2_340_000_000, volume: 18_000_000, rank: 29, assetType: 'crypto' },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', image: '', price: 4.25, change1h: 0.18, change24h: 1.84, change7d: 3.42, marketCap: 2_410_000_000, volume: 125_000_000, rank: 30, assetType: 'crypto' },
  { id: 'render-token', symbol: 'RENDER', name: 'Render', image: '', price: 6.15, change1h: 1.25, change24h: 7.14, change7d: 15.80, marketCap: 3_120_000_000, volume: 240_000_000, rank: 31, assetType: 'crypto' },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', image: '', price: 0.056, change1h: 0.12, change24h: 1.15, change7d: 2.84, marketCap: 2_020_000_000, volume: 45_000_000, rank: 32, assetType: 'crypto' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', image: '', price: 0.58, change1h: 0.42, change24h: 3.15, change7d: 8.42, marketCap: 1_920_000_000, volume: 185_000_000, rank: 33, assetType: 'crypto' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', image: '', price: 2140.00, change1h: 0.85, change24h: 4.82, change7d: 11.25, marketCap: 1_980_000_000, volume: 92_000_000, rank: 34, assetType: 'crypto' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos Hub', image: '', price: 4.82, change1h: -0.12, change24h: 0.74, change7d: 1.45, marketCap: 1_880_000_000, volume: 72_000_000, rank: 35, assetType: 'crypto' },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', image: '', price: 0.024, change1h: 0.15, change24h: 1.42, change7d: 3.12, marketCap: 1_950_000_000, volume: 48_000_000, rank: 36, assetType: 'crypto' },
  { id: 'dogwifhat', symbol: 'WIF', name: 'dogwifhat', image: '', price: 2.45, change1h: 2.14, change24h: 11.40, change7d: 28.50, marketCap: 2_450_000_000, volume: 520_000_000, rank: 37, assetType: 'crypto' },
  { id: 'okb', symbol: 'OKB', name: 'OKB', image: '', price: 38.40, change1h: 0.05, change24h: 0.42, change7d: -1.15, marketCap: 2_300_000_000, volume: 8_000_000, rank: 38, assetType: 'crypto' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', image: '', price: 0.182, change1h: 0.65, change24h: 4.12, change7d: 9.84, marketCap: 1_740_000_000, volume: 82_000_000, rank: 39, assetType: 'crypto' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', image: '', price: 1.42, change1h: 0.38, change24h: 2.85, change7d: 7.14, marketCap: 1_680_000_000, volume: 115_000_000, rank: 40, assetType: 'crypto' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', image: '', price: 22.40, change1h: 1.15, change24h: 6.84, change7d: 14.20, marketCap: 2_180_000_000, volume: 165_000_000, rank: 41, assetType: 'crypto' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', image: '', price: 0.000024, change1h: 1.84, change24h: 9.15, change7d: 22.40, marketCap: 1_620_000_000, volume: 340_000_000, rank: 42, assetType: 'crypto' },
  { id: 'floki', symbol: 'FLOKI', name: 'FLOKI', image: '', price: 0.00018, change1h: 1.25, change24h: 7.42, change7d: 18.20, marketCap: 1_740_000_000, volume: 210_000_000, rank: 43, assetType: 'crypto' },
  { id: 'theta-token', symbol: 'THETA', name: 'Theta Network', image: '', price: 1.34, change1h: 0.22, change24h: 1.94, change7d: 4.82, marketCap: 1_340_000_000, volume: 38_000_000, rank: 44, assetType: 'crypto' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', image: '', price: 5.82, change1h: 0.74, change24h: 4.65, change7d: 12.80, marketCap: 1_180_000_000, volume: 145_000_000, rank: 45, assetType: 'crypto' },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', image: '', price: 1.62, change1h: 0.42, change24h: 3.12, change7d: 8.42, marketCap: 1_450_000_000, volume: 92_000_000, rank: 46, assetType: 'crypto' },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom / Sonic', image: '', price: 0.48, change1h: 1.12, change24h: 6.42, change7d: 16.50, marketCap: 1_350_000_000, volume: 128_000_000, rank: 47, assetType: 'crypto' },
  { id: 'thorchain', symbol: 'RUNE', name: 'THORChain', image: '', price: 3.84, change1h: 0.95, change24h: 5.84, change7d: 13.40, marketCap: 1_290_000_000, volume: 110_000_000, rank: 48, assetType: 'crypto' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', image: '', price: 0.85, change1h: 1.35, change24h: 7.92, change7d: 19.40, marketCap: 1_150_000_000, volume: 184_000_000, rank: 49, assetType: 'crypto' },
  { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', image: '', price: 0.34, change1h: 0.65, change24h: 4.25, change7d: 10.50, marketCap: 1_220_000_000, volume: 95_000_000, rank: 50, assetType: 'crypto' },
]

export const fallbackAssets: MarketAsset[] = [...fallbackCryptoAssets, ...fallbackStockAssets]

type CoinGeckoAsset = {
  id: string
  symbol: string
  name: string
  image?: string
  current_price?: number
  market_cap?: number
  market_cap_rank?: number
  total_volume?: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
}

export async function fetchMarket(): Promise<MarketAsset[]> {
  try {
    const endpoint = new URL('https://api.coingecko.com/api/v3/coins/markets')
    endpoint.searchParams.set('vs_currency', 'usd')
    endpoint.searchParams.set('order', 'market_cap_desc')
    endpoint.searchParams.set('per_page', '50')
    endpoint.searchParams.set('page', '1')
    endpoint.searchParams.set('sparkline', 'false')
    endpoint.searchParams.set('price_change_percentage', '1h,24h,7d')

    const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Market feed returned ${response.status}`)
    const data = (await response.json()) as CoinGeckoAsset[]
    if (!Array.isArray(data) || data.length < 10) throw new Error('Market feed returned too few assets')

    const cryptoLive: MarketAsset[] = data.map((asset, index) => ({
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: asset.name,
      image: asset.image ?? '',
      price: asset.current_price ?? 0,
      change1h: asset.price_change_percentage_1h_in_currency ?? 0,
      change24h: asset.price_change_percentage_24h_in_currency ?? 0,
      change7d: asset.price_change_percentage_7d_in_currency ?? 0,
      marketCap: asset.market_cap ?? 0,
      volume: asset.total_volume ?? 0,
      rank: asset.market_cap_rank ?? index + 1,
      assetType: 'crypto' as const,
    }))

    return [...cryptoLive, ...fallbackStockAssets]
  } catch {
    return fallbackAssets
  }
}

export function changeFor(asset: MarketAsset, window: MarketWindow) {
  if (window === '1h') return asset.change1h
  if (window === '7d') return asset.change7d
  return asset.change24h
}

export function formatPrice(value: number) {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toLocaleString(undefined, { minimumSignificantDigits: 2, maximumSignificantDigits: 5 })}`
}

export function compactMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function buildFallbackChart(asset: MarketAsset, days: number): ChartPoint[] {
  const pointCount = days === 1 ? 96 : days === 7 ? 168 : 180
  const interval = (days * 24 * 60 * 60) / pointCount
  const now = Math.floor(Date.now() / 1000)
  const totalChange = days === 1 ? asset.change24h : days === 7 ? asset.change7d : asset.change7d * 1.8
  const startPrice = asset.price / (1 + totalChange / 100)
  const seed = asset.symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / Math.max(1, pointCount - 1)
    const wave = Math.sin(index * 0.41 + seed) * 0.008 + Math.sin(index * 0.13 + seed / 2) * 0.005
    const value = startPrice * (1 + (totalChange / 100) * progress + wave)
    return { time: Math.floor(now - (pointCount - 1 - index) * interval), value: Number(value.toFixed(asset.price < 1 ? 6 : 2)) }
  })
}

export async function fetchChart(asset: MarketAsset, days: number): Promise<ChartPoint[]> {
  if (asset.id.startsWith('stock-')) {
    return buildFallbackChart(asset, days)
  }
  try {
    const endpoint = new URL(`https://api.coingecko.com/api/v3/coins/${asset.id}/market_chart`)
    endpoint.searchParams.set('vs_currency', 'usd')
    endpoint.searchParams.set('days', String(days))
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Chart feed returned ${response.status}`)
    const data = (await response.json()) as { prices?: [number, number][] }
    if (!Array.isArray(data.prices) || data.prices.length === 0) throw new Error('Chart feed returned empty prices')
    return data.prices.map(([timestamp, price]) => ({ time: Math.floor(timestamp / 1000), value: price }))
  } catch {
    return buildFallbackChart(asset, days)
  }
}

export function buildFallbackBook(asset: MarketAsset): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const currentPrice = asset.price
  const spreadPercent = 0.0008
  const bestBid = currentPrice * (1 - spreadPercent)
  const bestAsk = currentPrice * (1 + spreadPercent)

  const bids: OrderBookLevel[] = Array.from({ length: 8 }, (_, i) => {
    const price = bestBid * (1 - i * 0.0012)
    const size = (asset.marketCap / 1e11) * (1.5 + Math.sin(i * 1.7) * 0.8 + Math.random() * 0.5)
    return { price, size, total: 0 }
  })

  const asks: OrderBookLevel[] = Array.from({ length: 8 }, (_, i) => {
    const price = bestAsk * (1 + i * 0.0012)
    const size = (asset.marketCap / 1e11) * (1.5 + Math.cos(i * 1.7) * 0.8 + Math.random() * 0.5)
    return { price, size, total: 0 }
  })

  let bidSum = 0
  for (const b of bids) {
    bidSum += b.size
    b.total = bidSum
  }

  let askSum = 0
  for (const a of asks) {
    askSum += a.size
    a.total = askSum
  }

  return { bids, asks }
}

export async function fetchOrderBook(asset: MarketAsset): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
  return buildFallbackBook(asset)
}
