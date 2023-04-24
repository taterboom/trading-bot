## Trading-Bot

```mermaid
flowchart LR
    A1(Cron jobs) --> A2(获取行情_1分钟interval) --> Ending(执行策略)
    B1(Fetch registries from Notion) --> Ending
    Ending --> Notify(邮件通知)
```
