import { getStockData } from "./sina/service"

getStockData(["sh000001"])
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log("e", err)
  })

const BASE_INTERVAL = 60 * 1000
const TURNNG_POINT = 2 // 转折需要根前x个KItem比较

/**
- 第一种买点：股价低于上一笔低点（背驰必要条件），高于前1（或者2、3…）点
- 第二种买点：股价高于上一笔低点（背驰笔的低点），高于前1（或者2、3…）点
- 第一种卖点：反第一种买点
- 第二种卖点：反第二种买点
 */

function sell3(kItems: KItem[], options: [number]) {
  if (kItems.length === 0) return false
  const [buyPoint] = options
  const price = kItems[kItems.length - 1][0]
  return price <= buyPoint
}

function sell1(kItems: KItem[], options: [number, number]) {
  if (kItems.length === 0) return false
  const [lastBiHigh, turningPoint = TURNNG_POINT] = options
  const price = kItems[kItems.length - 1][0]
  const prevIndex = Math.max(0, kItems.length - 1 - turningPoint)
  const prevKItems = kItems.slice(prevIndex, kItems.length - 1)
  return (
    price >= lastBiHigh && prevKItems.length > 0 && prevKItems.every((item) => price <= item[0])
  )
}

function sell2(kItems: KItem[], options: [number, number]) {
  if (kItems.length === 0) return false
  const [lastBiHigh, turningPoint = TURNNG_POINT] = options
  const price = kItems[kItems.length - 1][0]
  const prevIndex = Math.max(0, kItems.length - 1 - turningPoint)
  const prevKItems = kItems.slice(prevIndex, kItems.length - 1)
  return (
    price <= lastBiHigh && prevKItems.length > 0 && prevKItems.every((item) => price <= item[0])
  )
}

function buy1(kItems: KItem[], options: [number, number]) {
  if (kItems.length === 0) return false
  const [lastBiLow, turningPoint = TURNNG_POINT] = options
  const price = kItems[kItems.length - 1][0]
  const prevIndex = Math.max(0, kItems.length - 1 - turningPoint)
  const prevKItems = kItems.slice(prevIndex, kItems.length - 1)
  return price <= lastBiLow && prevKItems.length > 0 && prevKItems.every((item) => price >= item[0])
}

function buy2(kItems: KItem[], options: [number, number]) {
  if (kItems.length === 0) return false
  const [lastBiLow, turningPoint = TURNNG_POINT] = options
  const price = kItems[kItems.length - 1][0]
  const prevIndex = Math.max(0, kItems.length - 1 - turningPoint)
  const prevKItems = kItems.slice(prevIndex, kItems.length - 1)
  return price >= lastBiLow && prevKItems.length > 0 && prevKItems.every((item) => price >= item[0])
}

const Strategy: Record<string, (kItems: KItem[], options: any) => boolean> = {
  sell3,
  sell1,
  sell2,
  buy1,
  buy2,
}

type StrategyConfig = {
  code: string
  level: "1" | "5" | "30"
  strategy: "sell3" | "sell1" | "sell2" | "buy1" | "buy2"
  options: any[]
}

const strategy: StrategyConfig = {
  code: "sh000001",
  level: "30",
  strategy: "sell3",
  options: [3350],
}

const strategies = [strategy]

// [price, high, low]
type KItem = [number, number, number]

/**
 * 怎么使用
 * 1. code
 * 2. 策略
 *  2.0. 级别（1/30分钟/5分钟）
 *  2.1. 卖3, buyPoint
 *  2.2. 卖1, lastBiHigh
 *  2.3. 卖2, lastBiHigh
 *  2.4. 买1, lastBiLow
 *  2.5. 买2, lastBiLow
 */

// ====== database ======
setInterval(() => {
  // setDatabase
  // tick
}, BASE_INTERVAL)

const db: Record<string, { 1: KItem[]; 5: KItem[]; 30: KItem[] }> = {
  sh000001: {
    1: [],
    5: [],
    30: [],
  },
}
// ====== database ======

const LEVELS = [1, 5, 30] as const

// one tick per minute
function tick(time: number) {
  LEVELS.forEach((level) => {
    if (time % level === 0) {
      strategies.forEach((item) => {
        const { code, strategy, options } = item
        const kItems = db[code][level]
        const result = Strategy[strategy](kItems, options)
        if (result) {
          notify(item, kItems)
        }
      })
    }
  })
}

function notify(strategy: StrategyConfig, kItems: KItem[]) {
  // send email
}
