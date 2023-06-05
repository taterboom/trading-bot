import dayjs from "dayjs"
import { exec } from "node:child_process"
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

  const flag = strategy.strategy.startsWith("sell") ? "🟢" : "🔴"

  const title = `${flag} ${strategy.code} ${strategy.strategy} 指标已达到!`
  const body = `当前价格: ${kItems[kItems.length - 1][0]} 
options: ${strategy.options} 
level: ${strategy.level} 
extra: ${strategy.extra || ""}`
  mailer(title, body)
  displayNotificationOnMac(title, body)
}

export function displayNotificationOnMac(title: string, body: string) {
  exec(`osascript -e 'display notification "${body}" with title "${title}"'`)
}
