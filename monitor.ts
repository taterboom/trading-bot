import { Database, KItem } from "./worker"

function calDelta(kItems: KItem[]) {
  if (kItems.length === 0) return 0
  const preItem = kItems[kItems.length - 2]
  const currentItem = kItems[kItems.length - 1]
  if (!preItem || !currentItem) {
    return 0
  }

  return (currentItem[1] - preItem[2]) / preItem[2]
}

type Warning = [1 | 5 | 30, number]

// 异常下跌：
// 1分钟内下降超过0.4%
// 5分钟内跌幅超过0.7%
// 30分钟跌幅超过1.3%
function getWarinings(data: Database[string]) {
  const minute1Change = calDelta(data[1])
  const minute5Change = calDelta(data[5])
  const minute30Change = calDelta(data[30])
  const warnings: Warning[] = []
  if (minute1Change < -0.004) {
    warnings.push([1, minute1Change])
  }
  if (minute5Change < -0.007) {
    warnings.push([5, minute5Change])
  }
  if (minute30Change < -0.013) {
    warnings.push([30, minute30Change])
  }
  return warnings
}

export function monitor(data: Database) {
  const warningInfo: [string, Warning[]][] = Object.entries(data)
    .map(([code, info]) => {
      const warnings = getWarinings(info)
      if (warnings.length === 0) {
        return undefined as never
      }
      return [code, warnings] as [string, Warning[]]
    })
    .filter(Boolean)

  const title = `🔴 ${warningInfo.map((item) => item[0]).join("、")} 异常下跌`
  const body = warningInfo
    .map(
      (item) => `${item[0]} 
    ${item[1].map((warning: Warning) => `${warning[0]}分钟跌幅${warning[1]}`).join("\n")}
`
    )
    .join("------")

  console.log("!!!!", title, body)
  // mailer(title, body)
}
