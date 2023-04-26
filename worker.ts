import { Dayjs } from "dayjs"
import fs from "node:fs/promises"
import { Strategy } from "./Strategy"
import { log } from "./log"
import { notify } from "./notify"
import { getStockData } from "./sina/service"
import { StrategyConfig } from "./strategies"

// [price, high, low]
export type KItem = [number, number, number]

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

// TODO persist
const db: Record<string, { 1: KItem[]; 5: KItem[]; 30: KItem[] }> = {}

async function setDatabase(time: number, codes: string[]) {
  try {
    const data = await getStockData(codes)
    data.forEach((result, index) => {
      const currentData = db[codes[index]] || { 1: [], 5: [], 30: [] }
      const { price: priceStr } = result
      const price = +priceStr
      const kItem: KItem = [price, 0, 0]
      const k1Items = currentData[1].concat([kItem])
      const k5Items = currentData[5]
      const k30Items = currentData[30]
      if (time % 5 === 0) {
        const last5KItems = k1Items.slice(Math.max(0, k1Items.length - 5), k1Items.length)
        const k5Item: KItem = [
          price,
          Math.max(...last5KItems.map((item) => item[0])),
          Math.min(...last5KItems.map((item) => item[0])),
        ]
        k5Items.push(k5Item)
      }
      if (time % 30 === 0) {
        const last30KItems = k1Items.slice(Math.max(0, k1Items.length - 30), k1Items.length)
        const k30Item: KItem = [
          price,
          Math.max(...last30KItems.map((item) => item[0])),
          Math.min(...last30KItems.map((item) => item[0])),
        ]
        k30Items.push(k30Item)
      }
      db[codes[index]] = {
        1: k1Items,
        5: k5Items,
        30: k30Items,
      }
    })
    setImmediate(saveDb)
  } catch (err) {
    // @ts-ignore
    log("🔴 error", err?.message)
  }
}

const LEVELS = ["1", "5", "30"] as const
// one tick per minute
function execute(time: number, strategies: StrategyConfig[]) {
  LEVELS.forEach((level) => {
    if (time % +level === 0) {
      const currentLevelStrategies = strategies.filter((item) => item.level === level)
      currentLevelStrategies.forEach((item) => {
        const { code, strategy, options } = item
        const kItems = db[code][level]
        const ok = Strategy[strategy](kItems, options)
        if (ok) {
          notify(item, kItems)
        }
      })
    }
  })
}

async function runWorker(now: Dayjs, strategies: StrategyConfig[]) {
  const codes = [...new Set(strategies.map((item) => item.code))]
  let time = now.minute()
  await setDatabase(time, codes)
  execute(time, strategies)
}

function saveDb() {
  const toBeSaved = Object.entries(db).reduce((acc, [key, value]) => {
    acc[key] = {
      1: value[1].slice(Math.max(0, value[1].length - 240), value[1].length),
      5: value[5].slice(Math.max(0, value[5].length - 48), value[5].length),
      30: value[30].slice(Math.max(0, value[30].length - 8), value[30].length),
    }
    return acc
  }, {} as Record<string, { 1: KItem[]; 5: KItem[]; 30: KItem[] }>)
  fs.writeFile("./log/db.json", JSON.stringify(toBeSaved), "utf8")
}

async function initWorker() {
  try {
    const dbStr = await fs.readFile("./log/db.json", "utf8")
    log("init", "db.json found")
    Object.assign(db, JSON.parse(dbStr))
  } catch (err) {
    log("init", "db.json not found")
  }
}

const worker = {
  init: initWorker,
  run: runWorker,
}

export default worker
