import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import * as dotenv from "dotenv"
import { startCron } from "./cron"
import { getStrategies } from "./strategies"
import { worker } from "./worker"

dotenv.config()

dayjs.extend(isBetween)

const BASE_INTERVAL = 60 * 1000

async function run() {
  const now = dayjs()
  console.log("[run] ", now.format())
  const start1 = now.startOf("minute").set("hour", 9).set("minute", 30)
  const end1 = now.startOf("minute").set("hour", 11).set("minute", 30)
  const start2 = now.startOf("minute").set("hour", 13).set("minute", 0)
  const end2 = now.startOf("minute").set("hour", 17).set("minute", 0)

  const inTradingTime = (time: Dayjs) =>
    time.isBetween(start1, end1) || time.isBetween(start2, end2)

  if (inTradingTime(now)) {
    console.log("[running] ")
    const strategies = await getStrategies()
    worker(now, strategies)

    const id = setInterval(() => {
      const now = dayjs()
      if (inTradingTime(now)) {
        worker(now, strategies)
      } else {
        console.log("[stop] ", now.format())
        window.clearInterval(id)
      }
    }, BASE_INTERVAL)
  }
}

function main() {
  // now
  run()
  // cron
  startCron(run)
}

main()
