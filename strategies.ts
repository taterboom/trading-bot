import { Client } from "@notionhq/client"
import { log } from "./log"

export async function findItems(): Promise<any[]> {
  const notion = new Client({ auth: process.env.NOTION_KEY })
  const databaseId = process.env.NOTION_DATABASE_ID!
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "code",
            title: {
              is_not_empty: true,
            },
          },
        ],
      },
    })
    return response.results
  } catch (error: any) {
    log("🔴 error", error.body)
    throw error.body
  }
}

export type StrategyConfig = {
  code: string
  level: "1" | "5" | "30"
  strategy: "sell3" | "sell1" | "sell2" | "buy1" | "buy2"
  options: any[]
  extra?: string
}

export async function getStrategies() {
  const results = await findItems()
  const items = results.map((item) => {
    const { code, level, strategy, options, extra } = item.properties
    return {
      code: code.title[0].plain_text,
      level: level.select.name,
      strategy: strategy.select.name,
      options: options.rich_text[0].plain_text.split(",").map((item: string) => Number(item)),
      extra: extra?.rich_text?.[0]?.plain_text,
    }
  })
  return items
}
