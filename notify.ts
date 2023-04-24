import dayjs from "dayjs"
import { mailer } from "./mailer"
import { StrategyConfig } from "./strategies"
import { KItem } from "./worker"

// TODO clear
const emailFlag = new Set()

export function notify(strategy: StrategyConfig, kItems: KItem[]) {
  const id = `${dayjs().date()}-${strategy.code}-${strategy.strategy}-${
    strategy.level
  }-${strategy.options.join(",")}`
  if (emailFlag.has(id)) {
    return
  }
  emailFlag.add(id)

  const title = `🔴 ${strategy.code} ${strategy.strategy} 指标已达到!`
  const body = `当前价格: ${kItems[kItems.length - 1][0]} 
options: ${strategy.options} 
level: ${strategy.level} 
extra: ${strategy.extra} `
  mailer(title, body)
}
