# PokéRogue Tools

一个用于 [PokéRogue](https://pokerogue.net/) 的浏览器端存档改造工具。F12 Console 粘贴即用，不需要装任何扩展或软件。

A browser-side save editor for [PokéRogue](https://pokerogue.net/). Paste into F12 Console, no extensions or software needed.

**当前版本 / Current Version**: `v1.12.0.11`

> 版本号跟随 PokéRogue 游戏版本号走。每次游戏版本更新，脚本也会测试并发布对应版本号。目前对应 PokéRogue v1.12.0.11。
>
> Version pinned to PokéRogue game version. Each release matches a specific PokéRogue version it's been tested against. Currently targeting PokéRogue v1.12.0.11.

[中文](#中文) · [English](#english)

---

## 中文

### 功能

| 分类 | 功能 |
|------|------|
| 蛋 | 一键孵化 / 改稀有度 / 全闪光 / 送蛋 |
| 账户 | 送抽蛋券 / 图鉴全开 / Starter 全解锁 / 成就全解锁 |
| 战局 | 队伍 IV 全 31 / 道具满配 / Boss HP=1 / 加钱 / 改等级 |
| 战斗中实时精调 | 显示队伍/道具 / 回满 HP / 单只改 HP / 单只加道具 / 加 vitamin |
| 工具 | 验证服务器端 / 下载备份 / 手动设置 CSID |

### 核心特性

- **双写模式**：同时修改 localStorage 加密 cache 和服务器，避免 F5 后被覆盖
- **蛋的 species 自动配对**：改 tier 时自动分配对应 species，否则游戏会忽略 tier
- **timestamp 未来化**：确保本地 cache 优先，不被游戏主动回传覆盖
- **自动捕获 CSID**：拦截游戏请求提取活跃 clientSessionId，不用手动找
- **验证即时**：每次改动完立即从服务器 GET 回来对比，告诉你有没有生效

### 使用方法

#### 1. 准备
- 浏览器打开 [pokerogue.net](https://pokerogue.net/) 并登录
- 按 `F12` 打开开发者工具 → 切到 **Console** 标签

#### 2. 粘贴脚本
- 复制 [`pokerogue_tools.js`](./pokerogue_tools.js) 全部内容
- 粘贴到 Console，回车
- 看到 `[PRG] v1.12.0.11 ready` 即成功

> 如果 Chrome 要求输入 `allow pasting`，照打一遍回车即可（Chrome 新版本的粘贴安全提示）

#### 3. 触发 CSID 捕获
- Console 若提示 `还未捕获 CSID`
- 回到游戏界面，点一下 **"加载游戏"**（会触发游戏发请求）
- Console 看到 `[PRG] 捕获到活跃 clientSessionId` 即可

#### 4. 执行命令

```javascript
// 看命令清单
PRG.help()

// 蛋相关
PRG.giveEggs(10, 3, 1)   // 加 10 个传说蛋，1 波后孵化
PRG.setEggTier(3)        // 把所有现有蛋改成传说
PRG.hatchAll(1)          // 所有蛋 1 波后孵化
PRG.makeAllShiny()       // 所有蛋改闪光

// 账户相关
PRG.giveVouchers(99)         // 四种抽蛋券各 99 张
PRG.unlockAllDex()           // 图鉴全开
PRG.unlockAllStarters()      // Starter 全部解锁
PRG.unlockAllAchievements()  // 成就全解锁

// 战局（slot 0-4，对应游戏里 Slot 1-5）
PRG.buffParty(0)              // 队伍 IV 全 31
PRG.giveFullItems(0)          // 一键堆满全队道具
PRG.weakenBoss(0)             // 敌方 Boss HP=1 (一击必杀)
PRG.setMoney(0, 999999)       // 加钱

// 战斗中实时精调（省略 slot = 用当前 slot）
PRG.showParty()                      // 显示队伍详情（看谁掉血）
PRG.showItems()                      // 显示道具列表
PRG.heal()                           // 全队回满 HP + 清状态
PRG.setHP(0, 2, 9999)                // 队伍 index 2 的 HP 改成 9999
PRG.setLevel(0, 0, 200)              // 队伍 index 0 等级改 200
PRG.giveBalls(0, 50)                 // 各种精灵球 50 个
PRG.giveItem(0, 0, 'LEFTOVERS', 4)   // index 0 加 4 个剩饭（每回合回血）
PRG.giveItem(0, 0, 'REVIVER_SEED', 1)// 复活种子（死一次自动复活）
PRG.giveItem(0, 0, 'FOCUS_BAND', 3)  // 气势头带（残血不死触发）
PRG.giveItem(0, 0, 'SOUL_DEW', 10)   // 心之水滴（性格加成翻倍）
PRG.giveVitamin(0, 0, 1, 10)         // index 0 +10 攻击 vitamin
//  stat: 0=HP 1=Atk 2=Def 3=SpAtk 4=SpDef 5=Spd

// 全局道具（不绑定具体宝可梦）
PRG.giveGlobalItem(0, 'EXP_SHARE', 1)    // 经验共享
PRG.giveGlobalItem(0, 'AMULET_COIN', 2)  // 招财币
PRG.giveGlobalItem(0, 'MAP', 1)          // 地图
PRG.giveGlobalItem(0, 'IV_SCANNER', 1)   // 个体值扫描

// 工具
PRG.status()                  // 当前 CSID 和用户状态
PRG.verify()                  // 对比服务器 vs 本地数据
PRG.currentSlot()             // 查看当前使用的 slot 编号
PRG.backupSystemLocal()       // 下载完整 system 备份
```

#### 4.5 战斗中改东西的注意事项

游戏战斗中的 HP、道具都在**内存里**，直接改 server session 不会立刻影响屏幕上的战斗。正确流程：

1. 战斗中打开 F12 Console
2. 执行 PRG 命令（比如 `PRG.heal()` 或 `PRG.giveItem(0, 0, 'REVIVER_SEED', 1)`）
3. 立即按 F5 刷新页面
4. 游戏重新加载 → 回到**当前 wave 开头**（PokéRogue 每波自动存档）
5. 继续战斗，这时队伍/道具已经是新数据

F5 后只会丢失**当前这波的几步操作**，不是整局进度。

#### 5. 刷新游戏
每次改动完 Console 会提示 `F5 生效`。立即按 F5 刷新页面让游戏重新加载。

#### 6. 查看效果
进游戏菜单 → **蛋列表** / **扭蛋机** / **宝可梦图鉴** 等，查看是否生效。

### Tier 对照

| tier | 名称 | 预设池 | 代表宝可梦 |
|------|------|--------|-----------|
| 0 | 普通 | 约 190 种 | Caterpie, Pidgey, Zubat, Geodude ... |
| 1 | 稀有 | 约 80 种 | Pikachu, Eevee, Dratini, Larvitar ... |
| 2 | 史诗 | 约 115 种 | Dragonite, Tyranitar, Garchomp, Metagross ... |
| 3 | 传说 | 约 90 种 | Mewtwo, Lugia, Rayquaza, Zacian, Eternatus ... |

### 蛋孵化出什么宝可梦？

**重要：孵化出的宝可梦是从脚本预设的"物种池"里随机**，不是游戏完整的全体宝可梦池。

- 为什么要预设池：PokéRogue 的游戏逻辑是——蛋显示的稀有度基于 `species` 字段的本体 tier，而不是 `egg.tier` 字段。如果 `species=0`，游戏会无视你设的 tier 并随机分配
- 必须给具体 species 才能让蛋显示正确稀有度
- 脚本预设池覆盖了每个 tier 的主流代表性宝可梦

**查看某个 tier 池子里有哪些宝可梦**：

```javascript
PRG.showEggPool()        // 显示所有 tier 的池子大小
PRG.showEggPool(3)       // 列出 tier 3 (传说) 池子里所有物种 id
```

**想要池子外的特定宝可梦**：用第 4 个参数 `species` 指定物种 id：

```javascript
PRG.giveEggs(10, 3, 1, 150)              // 10 个蛋全是超梦 (species 150)
PRG.giveEggs(10, 3, 1, [150, 151, 249])  // 10 个蛋从超梦/梦幻/洛奇亚里随机
PRG.setEggTier(3, 384)                   // 把所有现有蛋改成裂空座

// 常用传说宝可梦 species id:
//   144 急冻鸟  145 闪电鸟  146 火焰鸟
//   150 超梦    151 梦幻
//   249 洛奇亚  250 凤王    251 时拉比
//   384 裂空座  493 阿尔宙斯
//   646 酋雷姆  716 哲尔尼亚斯
//   888 苍响    889 藏玛然特
//   890 无极汰那  898 蕾冠王
```

查完整列表：PokéRogue 的物种 id 和官方宝可梦编号一致，可以在 bulbapedia 或维基百科查。

### 常见问题

**Q: 粘贴脚本后 Chrome 让我输入 "allow pasting"**

Chrome 的安全限制。按它说的输入这几个字再回车就能粘贴了。只需要做一次。

**Q: 提示 "未捕获 CSID"**

脚本粘贴得比游戏启动晚，没抓到。方法：

- A. 在游戏里点一下"加载游戏"或"继续"，触发游戏发请求
- B. 执行 `await PRG.waitCSID()` 等待 15 秒
- C. 手动：F12 → Network → 过滤 `clientSessionId` → 复制值 → `PRG.setCSID("粘贴")`

**Q: 改完 F5 后游戏里没变化**

脚本已经通过**双写 localStorage** 修复（游戏启动会优先读本地 cache，之前只写服务器会被覆盖）。如果仍然遇到，执行 `PRG.verify()` 对比 server 和 local 数据，看是哪边没写入。

**Q: 蛋没变成传说，只是颜色随机**

游戏会忽略 species=0 蛋的 tier 字段并随机分配。脚本已自动给每个 tier 匹配对应的宝可梦 species，所以蛋会正确显示稀有度。

**Q: F5 后脚本还在吗？**

不在。刷新或关闭页面后需要重新粘贴。

### 免责声明

- 本工具仅供**个人单机娱乐**，请不要在排行榜、每日挑战、公开竞赛中使用
- PokéRogue 是免费开源 fan game，官方对本地改档较宽容，但不保证永远有效
- 使用前建议 `PRG.backupSystemLocal()` 备份，万一改坏了能恢复
- 账号封禁风险自负

### 项目结构

```
pokerogue-tools/
├── README.md               # 本文件
└── pokerogue_tools.js      # 主脚本，F12 粘贴即用
```

---

## English

### Features

| Category | Functions |
|----------|-----------|
| Eggs | Hatch all / set tier / make all shiny / grant eggs |
| Account | Grant vouchers / unlock full Pokédex / unlock all starters / unlock all achievements |
| Session | Max IVs / full items / Boss HP=1 / money / level |
| In-battle fine-tuning | Show party / show items / full heal / set HP / give item / give vitamin |
| Tools | Verify server state / download backup / manual CSID |

### Key Features

- **Dual-write mode**: Modifies encrypted localStorage cache AND server simultaneously — prevents F5 overwrite
- **Auto species pairing**: Setting egg tier automatically assigns matching species, otherwise game ignores tier
- **Future timestamp**: Ensures local cache has priority
- **Auto CSID capture**: Intercepts game requests to extract active clientSessionId
- **Instant verification**: Each change is verified by GET from server

### How to Use

#### 1. Prerequisites
- Open [pokerogue.net](https://pokerogue.net/) and log in
- Press `F12` → **Console** tab

#### 2. Paste the script
- Copy all contents of [`pokerogue_tools.js`](./pokerogue_tools.js)
- Paste into Console, press Enter
- See `[PRG] v1.12.0.11 ready` on success

> If Chrome asks for `allow pasting`, type it in and press Enter — only needed once

#### 3. Trigger CSID capture
- If Console shows `还未捕获 CSID`
- Go back to game and click **"Load Game"** (triggers a request)
- Console shows `[PRG] 捕获到活跃 clientSessionId` → ready

#### 4. Run commands

```javascript
// Show command list
PRG.help()

// Egg commands
PRG.giveEggs(10, 3, 1)   // +10 legendary eggs, 1-wave hatch
PRG.setEggTier(3)        // Change all eggs to legendary
PRG.hatchAll(1)          // All eggs hatch next wave
PRG.makeAllShiny()       // All eggs shiny

// Account
PRG.giveVouchers(99)         // 99 of each voucher type
PRG.unlockAllDex()           // Full Pokédex
PRG.unlockAllStarters()      // All starters + candies + egg moves
PRG.unlockAllAchievements()

// Session (slot 0-4 maps to game Slot 1-5)
PRG.buffParty(0)              // Max IVs for current team
PRG.giveFullItems(0)          // Full item loadout
PRG.weakenBoss(0)             // Current Boss HP=1 (one-shot)
PRG.setMoney(0, 999999)       // Money

// In-battle fine-tuning (omit slot = use current slot)
PRG.showParty()                      // Show team details (who's low HP?)
PRG.showItems()                      // Show items list
PRG.heal()                           // Full heal + clear status
PRG.setHP(0, 2, 9999)                // Pokémon index 2 HP to 9999
PRG.setLevel(0, 0, 200)              // Pokémon index 0 level to 200
PRG.giveBalls(0, 50)                 // 50 of each poké ball
PRG.giveItem(0, 0, 'LEFTOVERS', 4)   // 4x Leftovers on Pokémon index 0
PRG.giveItem(0, 0, 'REVIVER_SEED', 1)// Reviver Seed
PRG.giveItem(0, 0, 'FOCUS_BAND', 3)  // Focus Band x3
PRG.giveItem(0, 0, 'SOUL_DEW', 10)   // Soul Dew (nature bonus 2x)
PRG.giveVitamin(0, 0, 1, 10)         // +10 Attack vitamin on Pokémon index 0
//  stat: 0=HP 1=Atk 2=Def 3=SpAtk 4=SpDef 5=Speed

// Global items (not tied to specific Pokémon)
PRG.giveGlobalItem(0, 'EXP_SHARE', 1)    // EXP Share
PRG.giveGlobalItem(0, 'AMULET_COIN', 2)  // Amulet Coin
PRG.giveGlobalItem(0, 'MAP', 1)          // Map
PRG.giveGlobalItem(0, 'IV_SCANNER', 1)   // IV Scanner

// Tools
PRG.status()                  // Current CSID and user status
PRG.verify()                  // Compare server vs local
PRG.currentSlot()             // Which slot am I in?
PRG.backupSystemLocal()       // Download full system backup
```

#### 4.5 In-battle editing — important notes

Battle state (HP, items) lives in **game memory**. Editing server session doesn't instantly affect the ongoing battle on screen. Correct flow:

1. Open F12 Console during battle
2. Run PRG commands (e.g. `PRG.heal()` or `PRG.giveItem(0, 0, 'REVIVER_SEED', 1)`)
3. Press F5 to reload the page
4. Game reloads → returns to **current wave start** (PokéRogue auto-saves at every wave)
5. Continue the battle — your team/items are now the new values

F5 only loses the **few moves in the current wave**, not the whole run.

#### 5. Refresh the game
After each command, Console says `F5 生效`. Press F5 to reload the page so the game picks up changes.

#### 6. Check in-game
Open in-game menu → **Egg List** / **Egg Gacha** / **Pokédex** to verify.

### Tier Reference

| tier | Name | Pool size | Representative Pokémon |
|------|------|-----------|-----------------------|
| 0 | Common | ~190 species | Caterpie, Pidgey, Zubat, Geodude ... |
| 1 | Rare | ~80 species | Pikachu, Eevee, Dratini, Larvitar ... |
| 2 | Epic | ~115 species | Dragonite, Tyranitar, Garchomp, Metagross ... |
| 3 | Legendary | ~90 species | Mewtwo, Lugia, Rayquaza, Zacian, Eternatus ... |

### Which Pokémon will hatch from the eggs?

**Important: hatched Pokémon are randomly picked from a preset species pool in the script**, NOT the game's complete Pokémon pool.

- Why a preset pool: PokéRogue displays egg rarity based on the `species` field's base tier, NOT the `egg.tier` field. If `species=0`, the game ignores your tier and randomizes it
- You must provide a specific species to make the egg display the correct rarity
- The preset pool covers mainstream representative Pokémon for each tier

**View what's in each tier's pool**:

```javascript
PRG.showEggPool()        // Show all tier pool sizes
PRG.showEggPool(3)       // List all species IDs in tier 3 (Legendary) pool
```

**Want a specific Pokémon not in the pool**: use the 4th parameter `species`:

```javascript
PRG.giveEggs(10, 3, 1, 150)              // 10 eggs all Mewtwo (species 150)
PRG.giveEggs(10, 3, 1, [150, 151, 249])  // 10 eggs randomly from Mewtwo/Mew/Lugia
PRG.setEggTier(3, 384)                   // Change all existing eggs to Rayquaza

// Common legendary species IDs:
//   144 Articuno  145 Zapdos    146 Moltres
//   150 Mewtwo    151 Mew
//   249 Lugia     250 Ho-Oh     251 Celebi
//   384 Rayquaza  493 Arceus
//   646 Kyurem    716 Xerneas
//   888 Zacian    889 Zamazenta
//   890 Eternatus 898 Calyrex
```

Species IDs match official Pokédex numbers — look them up on Bulbapedia or Wikipedia for complete reference.

### FAQ

**Q: Chrome asks me to type "allow pasting"**

Chrome's security feature. Type it and press Enter — only needed once per session.

**Q: "CSID not captured" error**

Script was pasted after game startup. Fix:

- A. Click "Load Game" in-game to trigger a request
- B. Run `await PRG.waitCSID()` to wait up to 15 seconds
- C. Manual: F12 → Network → filter `clientSessionId` → copy value → `PRG.setCSID("paste")`

**Q: Changes don't show up in game after F5**

The script now **dual-writes to localStorage** (game startup reads local cache first, so writing only to server used to be overwritten). If still failing, run `PRG.verify()` to compare server vs local.

**Q: Eggs stay random instead of legendary**

Game ignores `tier` on eggs with `species=0` and randomizes it. The script auto-pairs each tier with corresponding Pokémon species, so eggs display correct rarity.

**Q: Does the script persist after F5?**

No. You need to paste it again every page reload.

### Disclaimer

- For **personal / single-player entertainment only**. Do NOT use in Daily Challenge, leaderboards, or public competitions
- PokéRogue is a free open-source fan game, usually tolerant to local save editing — not guaranteed forever
- Backup first with `PRG.backupSystemLocal()` before risky changes
- Account ban risk is on you

### Project Structure

```
pokerogue-tools/
├── README.md               # This file
└── pokerogue_tools.js      # Main script, paste into F12 Console
```

### License

MIT — Do whatever you want, no warranty.

### Acknowledgments

- [PokéRogue](https://github.com/pagefaultgames/pokerogue) — the amazing fan game
- Discovered via browser DevTools reverse-engineering

---

**Current Version**: v1.12.0.11 (pinned to PokéRogue game version) · **Last Updated**: 2026-10-07
