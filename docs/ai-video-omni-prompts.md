# 六關故事 Omni 影片生成提示詞（逐鏡頭）

整理日期：2026-09-27。依據[製作指南](ai-video-production-guide.md)、[六關製片工作稿](ai-video-story-brief.md)，以及使用者指定 Word 的「第 N 關開頭影片」段落。本檔只提供**送進 Omni 類多參考圖影片模型的鏡頭提示詞**。旁白、字幕、時間碼、姓名、群組文字和證據卡都在 CapCut 用文字層加入，不交給模型畫字。

> 本檔還沒實際送進 Omni 測試。提示詞是生成起點，每個成品仍須依各鏡頭的「驗收」逐項檢查；若畫出不能揭露的內容，即使畫面好看也要丟棄。

---

## 0. 使用方式

### 0.1 每一鏡怎麼送

1. 依該鏡的「參考圖」欄位，上傳對應圖片到 Omni 的參考圖槽。
2. 把提示詞裡的 `@一承`、`@COLD6` 等標記，改成介面實際使用的寫法（例如 `@圖1`、`[Image 1]`、`<<<image_1>>>`）。
3. 貼上「提示詞」段落，最後接上 **0.3 共同風格尾句**。
4. 若介面有負面提示詞欄位，貼上 **0.4 共同負面詞**與該鏡的「額外禁止」。
5. 聲音全關（或生成後靜音）。對白、旁白與音效都在 CapCut 另外處理。
6. 每鏡先生成 1 次 5 秒／720p，確認動作與人物正確後，再用 1080p 重生或放大。

### 0.2 參考圖槽對照

| 標記 | 檔案 | 內容／本晚固定造型 |
|---|---|---|
| `@一承` | `assets/img/game/char_1.jpg` | 陳一承，男，生活股股長。短黑髮、深色夾克、藏青色襯衫，手持值勤夾板。 |
| `@二寧` | `assets/img/game/char_2.jpg` | 葉二寧，女，食品科學系。黑髮低包頭、米白襯衫、深灰長開襟毛衣。 |
| `@三川` | `assets/img/game/char_3.jpg` | 高三川，男，社群管理員。蓬鬆黑髮、炭灰連帽衫，手上常拿手機。 |
| `@四影` | `assets/img/game/char_4.jpg` | 羅四影，男，攝影社。凌亂短黑髮、深棕工裝夾克、黑 T 恤，斜背黑色相機。 |
| `@五澄` | `assets/img/game/char_5.jpg` | 許五澄，女，資工系。黑色長直髮、圓框眼鏡、黑色毛衣，拿筆電。 |
| `@六禾` | `assets/img/game/char_6.jpg` | 蔡六禾，女，樓層總務。黑髮綁低馬尾、藏青工作背心、灰色長袖，斜背**藏青色保冷袋**。 |
| `@予安` | `media/refs/ref_su_yuan.jpeg` | 蘇予安，女，失主。齊瀏海黑色短髮、米白連帽衫、燕麥色針織開襟外套。 |
| `@資訊組` | `media/refs/ref_it_staff.jpeg` | 校方資訊組人員，中年男性，眼鏡、藏青 POLO 衫、紅色識別證，拿平板。 |
| `@廚房` | `media/refs/ref_kitchen.jpeg` | 七舍公共廚房：左側 COLD-6、中央不鏽鋼**公共料理桌**與高腳凳、右側流理台與布告欄、左邊走廊透紅光。 |
| `@COLD6` | `media/refs/ref_cold6.jpeg` | COLD-6 智慧冰箱：不鏽鋼框、玻璃門、**鉸鏈在左、把手在右**；內部是格狀小櫃，門右上有小螢幕。 |
| `@蛋糕盒` | `media/refs/ref_cake_box.jpeg` | 月蝕千層蛋糕禮盒：霧黑方盒、月蝕圓形圖樣、金色緞帶蝴蝶結、上方透明窗可見莓果、側面白色姓名貼紙與紅色「私人物品」貼紙。 |

**B-9 位置鎖定**：`@COLD6` 下半部，第二列最右側那一格（參考圖中亮琥珀色的格子）。所有關卡都必須是這一格。

**同一晚的連續性**：L1、L4、L5、L6 若拍到當晚（週五晚上），人物服裝一律依上表，六禾的保冷袋一律斜背在右肩。L2 是隔天，可以換衣服，但為了觀眾辨識仍建議沿用。

### 0.3 共同風格尾句（每鏡都貼在最後）

```
Style: realistic investigative documentary, Taiwanese university dormitory at night, cool teal-grey fluorescent lighting with faint red accent light from the corridor, subdued natural color grade, 35mm lens look, natural skin texture, calm and neutral mood. 16:9 horizontal. Keep every person, outfit, prop and room layout identical to the reference images. No on-screen text, no subtitles, no captions, no timestamps, no logos, no watermark. Silent, no dialogue, no music.
```

### 0.4 共同負面詞

```
text, letters, numbers, Chinese characters, subtitles, captions, timestamp overlay, UI text, watermark, logo, extra people, duplicated person, face morphing, changing outfit, changing hairstyle, extra fingers, deformed hands, second cake box, cake box changing color, fridge door hinge on the right, horror lighting, villain expression, smirk, exaggerated guilty look, dramatic zoom, lens flare, slow motion
```

### 0.5 不交給 Omni 的畫面

以下畫面直接在 CapCut（或 Remotion）用文字層、形狀與圖示製作，比 AI 生成準確：

- 系統紀錄卡：`22:47:09｜B-9 標籤狀態異常`、`22:47:18｜人工確認｜標籤狀態已接受`、`22:14:03｜ice-admin｜…` 等。
- 群組聊天畫面、指控字幕、匿名留言、還原訊息。
- 時間碼跳格（`22:46:52 → 22:47:23`）、重量曲線（約 1.7 公斤）、門禁紀錄、代收紀錄。
- 關卡片名卡與結尾「請根據目前的資訊開始調查」。

本檔中標示 **〔剪輯製作〕** 的鏡頭都屬於這一類。部分鏡頭提供 Omni 可生成的**空白背景板**，文字再疊上去。

---

## L1｜B-9 空了（目標 60–80 秒）

**本關可揭露**：廚房與 COLD-6、予安放入蛋糕、六人先後出現在附近、23:00 空櫃與透明膠帶、監視器沒對到冰箱內部、四影的十二秒片段、兩筆系統紀錄。
**本關絕對不拍**：六禾從 B-9 拿出蛋糕、二寧移盒、橘色貼紙、公共料理桌上的蛋糕、夜食會、分食、任何人操作平板。

| 鏡頭 | 秒數 | 內容 | 對應旁白（Word） |
|---|---|---|---|
| L1-01 | 5 | 空廚房建立鏡頭 | 霧城大學七舍使用 COLD-6… |
| L1-02 | 5 | COLD-6 格櫃特寫 | （同上） |
| L1-03 | 5 | 予安放入蛋糕 | 週五晚上，住戶蘇予安… |
| L1-04 | 4 | 蛋糕在 B-9 的特寫 | 盒上貼有姓名與「私人物品」標籤 |
| L1-05a–f | 各 3 | 六人各自經過 | 晚上十點後，陳一承…先後出現 |
| L1-06 | 5 | 予安回來發現空櫃 | 23:00 點左右… |
| L1-07 | 4 | 透明膠帶特寫 | 只剩一小段被撕下的透明膠帶 |
| L1-08 | 4 | 走廊監視器視角 | 走廊監視器沒有正對冰箱內部 |
| L1-09 | 〔剪輯製作〕 | 系統紀錄 22:47:09 | COLD-6 的系統紀錄則顯示… |
| L1-10a–c | 5+2+4 | 四影的十二秒片段 | 羅四影交出一段十二秒影片… |
| L1-11 | 〔剪輯製作〕 | 值勤紀錄 22:47:18 | 陳一承匯出值勤紀錄… |

### L1-01｜空廚房建立鏡頭

- **參考圖**：`@廚房`、`@COLD6`
- **鏡位**：廣角，視線高度，從門口往內；極慢推近。
- **提示詞**：
```
Use @廚房 as the exact room and @COLD6 as the exact refrigerator. Wide establishing shot from the kitchen doorway at eye level, night. The shared dormitory kitchen is empty and quiet: the stainless steel smart refrigerator with a glass door and grid of small compartments stands on the left wall, a stainless steel shared cooking table with bar stools in the center, sink counter and a cork notice board on the right. Fluorescent tubes hum overhead; a faint red glow spills in from the corridor on the far left. The camera slowly dollies forward about half a meter. Nothing else moves. End frame: the refrigerator and the shared table both clearly visible, no people.
```
- **額外禁止**：people, cake on the table, open fridge door
- **驗收**：冰箱在左、料理桌在中央；桌上沒有東西；冰箱門關著。

### L1-02｜COLD-6 格櫃特寫

- **參考圖**：`@COLD6`
- **鏡位**：中近景，正面，緩慢由上往下搖到下半部。
- **提示詞**：
```
Use @COLD6 as the exact refrigerator. Medium close-up, straight-on, of the smart refrigerator's glass door. Behind the glass is a grid of small labeled-looking compartments holding food containers. The small screen at the upper right of the door glows softly with an abstract blank interface. The camera tilts slowly down from the upper compartments to the lower half, ending on the lower section where the rightmost compartment in the second row glows a soft amber. Door stays closed; hinge on the left, handle on the right. No people.
```
- **額外禁止**：readable labels, open door
- **驗收**：停在下半部第二列最右格（B-9）；螢幕沒有可讀文字。

### L1-03｜予安放入蛋糕

- **參考圖**：`@予安`、`@COLD6`、`@蛋糕盒`
- **鏡位**：側後方中景，從冰箱右側 45 度拍，看得到手和格櫃。
- **提示詞**：
```
Use @予安 as the exact woman, @COLD6 as the refrigerator and @蛋糕盒 as the exact cake box. Medium shot from a 45-degree angle beside the refrigerator. The young woman with a short black bob and bangs, cream hoodie and oatmeal knit cardigan, holds the matte black cake box with a gold ribbon bow in both hands. She opens the glass door (hinge on the left) and carefully slides the box into the lower-section compartment, second row, rightmost. She presses the side of the box once to make sure it sits flat, then closes the door. Calm, ordinary movement. End frame: door closed, the black box with gold ribbon visible through the glass in that compartment.
```
- **額外禁止**：other people, a second box, box changing shape
- **驗收**：放入的是 B-9；盒子黑色＋金緞帶；只有一個人。

### L1-04｜蛋糕在 B-9 的特寫

- **參考圖**：`@蛋糕盒`、`@COLD6`
- **鏡位**：透過玻璃門的特寫，靜態，極輕微推近。
- **提示詞**：
```
Use @蛋糕盒 as the exact cake box inside the compartment of @COLD6. Close-up through the glass door of the refrigerator: the matte black cake box with the eclipse circle graphic and gold ribbon bow sits inside the lower compartment. On its side are a plain white name label and a red rectangular sticker, both blank, and a short strip of clear tape holds the white label in place. The camera pushes in very slowly. Cool refrigerator light, soft reflections on the glass. Nothing moves.
```
- **額外禁止**：readable text on labels, hands
- **驗收**：看得到白色姓名貼紙、紅色貼紙與透明膠帶（L1-07 會接這段膠帶）。貼紙文字「蘇予安」「私人物品」在 CapCut 加標註，不要求模型寫字。

### L1-05a–f｜六人先後經過

同一個模板拍六次，每次只換人物與動作。**全部都是日常動作，不看冰箱內部、不碰冰箱。**

- **參考圖**：`@廚房` ＋ 當位角色
- **鏡位**：固定機位，交誼廳到廚房之間的走廊，中景，人物由畫面一側走到另一側或短暫停留。
- **提示詞模板**：
```
Use @廚房 as the exact location and [角色標記] as the exact person with the same outfit. Fixed camera, medium-wide shot of the corridor between the dormitory lounge and the shared kitchen at night; the kitchen doorway and part of the smart refrigerator are visible in the background. [動作]. Natural pace, neutral expression, the person does not look at the camera. Only this one person in frame.
```

| 鏡頭 | 角色 | `[動作]` 填入 |
|---|---|---|
| L1-05a | `@一承` | The young man in a dark jacket walks past the kitchen doorway holding a clipboard, glances at the room like a routine patrol and keeps walking out of frame right. |
| L1-05b | `@二寧` | The young woman with a low bun and dark cardigan walks into frame carrying a small reusable tote, pauses near the kitchen doorway for a moment, then walks on. |
| L1-05c | `@三川` | The young man in a charcoal hoodie walks slowly through the corridor looking at his phone, thumb scrolling, and exits toward the lounge. |
| L1-05d | `@四影` | The young man in a dark brown utility jacket with a black camera on a shoulder strap walks through the corridor and briefly adjusts the camera strap. |
| L1-05e | `@五澄` | The young woman with long straight hair and round glasses walks past carrying a closed laptop against her chest, heading away from the kitchen. |
| L1-05f | `@六禾` | The young woman with a low ponytail, navy work vest and a navy cooler bag on her right shoulder walks toward the kitchen doorway and out of frame. |

- **額外禁止**：opening the fridge, carrying a cake box, two people in frame
- **驗收**：每鏡只有一人；六人都沒有可疑動作或表情；六禾的保冷袋是扁的空袋外觀，看不出內容。剪輯時六鏡各 2–3 秒快速接，或排成六格拼貼。

### L1-06｜予安回來發現空櫃

- **參考圖**：`@予安`、`@COLD6`
- **鏡位**：越過予安肩膀看向冰箱下半部的過肩鏡頭。
- **提示詞**：
```
Use @予安 as the exact woman and @COLD6 as the refrigerator. Over-the-shoulder shot from behind the young woman with the short black bob and oatmeal cardigan. She walks up to the refrigerator and bends slightly toward the lower section. The rightmost compartment in the second row of the lower section is completely empty. She stops, leans closer to the glass, and her hand rises slowly to her mouth in quiet disbelief. Other compartments still hold food containers. End frame: the empty compartment in focus, her shoulder soft in the foreground.
```
- **額外禁止**：cake box anywhere, other people, crying, screaming
- **驗收**：B-9 空，其他格有東西；畫面裡沒有任何蛋糕盒，公共料理桌不入鏡。

### L1-07｜透明膠帶特寫

- **參考圖**：`@COLD6`
- **鏡位**：微距特寫，打開的空格內部。
- **提示詞**：
```
Use @COLD6 as the refrigerator. Macro close-up inside the empty lower compartment of the smart refrigerator, glass door open. On the metal shelf edge lies one short, torn strip of clear adhesive tape, slightly curled, catching the cold light. A woman's fingertip enters the frame and stops just before touching it, then withdraws. Shallow depth of field.
```
- **額外禁止**：white label, red sticker, crumbs, cake pieces
- **驗收**：只有一小段透明膠帶；沒有碎屑或蛋糕痕跡（會暗示在原地被吃掉）。

### L1-08｜走廊監視器視角

- **參考圖**：`@廚房`
- **鏡位**：天花板角落高角度監視器畫面，只拍到冰箱側面與外框，看不到內部。
- **提示詞**：
```
Use @廚房 as the exact kitchen. Security-camera style footage from a high corner of the corridor ceiling, looking diagonally into the kitchen doorway. Slight wide-angle distortion, lower resolution, muted colors. The smart refrigerator is seen only from its side edge; its glass front and interior are not visible from this angle. The shared table is partly blocked by the door frame. The scene is empty and still, only a faint flicker of the fluorescent light.
```
- **額外禁止**：timestamp overlay, REC icon, people
- **驗收**：看不到冰箱內部。監視器時間碼、REC 標誌在 CapCut 加。

### L1-09｜〔剪輯製作〕系統紀錄 22:47:09

- 背景板可用 L1-02 最後一幀做深色模糊。
- 文字層：`COLD-6 系統紀錄`／`22:47:09｜B-9 標籤狀態異常`。停留至少 3 秒。

### L1-10a–c｜羅四影的十二秒片段

這段是四影交出的影片，要看起來像**手持相機拍的業餘片段**。三個鏡頭分開生成，剪輯時接成約 11–12 秒，加「羅四影提交影片」來源標籤與片段內時間碼。**與 L4 共用同一組冰箱、門向、六禾服裝。**

**L1-10a｜六禾開門、伸手（約 5 秒）**

- **參考圖**：`@六禾`、`@COLD6`、`@廚房`
- **鏡位**：手持，從廚房門口斜後方，六禾在畫面右半，冰箱門打開後**擋住下半部格櫃**。
- **提示詞**：
```
Use @六禾 as the exact woman with the same navy work vest, grey long sleeves, low ponytail and navy cooler bag on her right shoulder. Use @COLD6 and @廚房. Handheld amateur camera footage with slight shake, filmed from the kitchen doorway at a diagonal behind her. She opens the refrigerator's glass door (hinge on the left) and the open door swings toward the camera, blocking the view of the lower compartments. She bends and reaches her right hand down toward the lower section behind the door. Her hand and whatever is in the compartment are hidden by the door. The clip ends while her arm is still reaching in.
```
- **額外禁止**：cake box visible, taking anything out, hand coming back with an object, looking at camera
- **驗收**：**完全看不到她拿出任何東西**；手的末端被門遮住；片段在伸手中結束。

**L1-10b｜鏡頭晃開（約 2 秒）**

- **參考圖**：`@廚房`
- **提示詞**：
```
Use @廚房. Handheld amateur camera footage: the camera suddenly swings away to the left, a fast blurred pan across the corridor wall and the red-lit hallway, as if the person filming turned around. Motion blur, slight exposure pumping. No people clearly visible.
```
- **驗收**：只有晃動與模糊；沒有清楚的人或冰箱。

**L1-10c｜切回來，B-9 已空（約 4 秒）**

- **參考圖**：`@COLD6`、`@廚房`
- **提示詞**：
```
Use @COLD6 and @廚房. Handheld amateur camera footage, same angle as before from the kitchen doorway, framed tightly on the refrigerator. The glass door is now closed. Through the glass, the rightmost compartment in the second row of the lower section is empty; the other compartments still hold containers. Nobody stands at the refrigerator. The frame stays tight on the fridge; the shared cooking table is out of frame. Slight handheld drift.
```
- **額外禁止**：cake box on a table, people, fridge door open
- **驗收**：構圖**不帶到公共料理桌**（避免提早露出 L4 線索）；B-9 空。
- **剪輯**：10a→10b 用硬切或相機晃動轉場，10b→10c **不做淡入淡出**，保持「有接縫」的感覺，但不刻意加跳格特效（跳格是 L3 才揭露的資訊）。

### L1-11｜〔剪輯製作〕值勤紀錄 22:47:18

- 文字層：`陳一承匯出值勤紀錄`／最後一行 `22:47:18｜人工確認｜標籤狀態已接受`。
- 結尾中性字卡：「請根據目前的資訊開始調查。」不加「犯人就在其中」之類的句子。

---

## L2｜好學生不會偷東西（目標 40–60 秒）

**本關可揭露**：隔天群組轉傳、定格指控字幕、六禾輸入又收回訊息、會議中捏保冷袋背帶與語速變快、匿名留言。
**本關絕對不拍**：確認六禾有罪或無罪的畫面、兩瓶氣泡水的影像（留到 L4）、任何人操作系統。

| 鏡頭 | 秒數 | 內容 | 對應旁白 |
|---|---|---|---|
| L2-01 | 5 | 早晨宿舍，多支手機同時亮起 | 隔天早上，十二秒影片被大量轉傳 |
| L2-02 | 〔剪輯製作〕 | 群組定格＋指控字幕 | 有人把畫面停在… |
| L2-03 | 5 | 六禾打字又收回（手部） | 蔡六禾先輸入… |
| L2-04 | 5 | 宿舍會議全景 | 她在宿舍會議裡… |
| L2-05 | 4 | 手捏保冷袋背帶特寫 | 一直捏著保冷袋的背帶 |
| L2-06 | 〔剪輯製作〕 | 匿名留言 | 另一個匿名帳號留言… |

### L2-01｜早晨，手機同時亮起

- **參考圖**：`@廚房`（僅作宿舍色調參考）
- **提示詞**：
```
Morning in the same Taiwanese university dormitory, soft grey daylight through the window. A montage-like single shot: the camera slowly pans across a lounge table and a corridor bench where several smartphones lie face-up; one after another their screens light up with a notification glow. Hands of different students pick up two of the phones. Screens show only abstract bright blur, nothing readable. Faces are not shown.
```
- **額外禁止**：readable screen content, faces
- **驗收**：螢幕內容不可讀（CapCut 另外合成）。

### L2-02｜〔剪輯製作〕群組定格指控

- 做法：聊天介面外框 ＋ L1-10a 中「伸手」那一幀的定格截圖 ＋ 疊字 `總務拿走 2,680 元蛋糕？`。
- 旁邊加小字來源標示：`群組轉傳內容｜未經查證`。

### L2-03｜六禾打字又收回

- **參考圖**：`@六禾`
- **鏡位**：越肩特寫到手機，只看到手與手機，臉在畫面外或失焦。
- **提示詞**：
```
Use @六禾 for the sleeve and vest details: grey long sleeves and navy work vest. Close-up over the shoulder of a young woman holding a smartphone in both hands. Her thumbs type a short message quickly, pause, hover, then press and hold on the message and it disappears from the chat. Her thumbs stay still for a moment afterward. The screen is a soft blurred chat interface with no readable characters. Her face is out of frame.
```
- **額外禁止**：readable text, face shown
- **驗收**：看得出「打字→停→收回」三個動作。收回前的文字 `我只是把那盒移到……` 由 CapCut 合成在螢幕上，停留約 1.5 秒再消失。

### L2-04｜宿舍會議全景

- **參考圖**：`@六禾`、`@一承`、`@三川`（其他人可作背景）
- **鏡位**：會議室中景，固定機位，六禾在畫面三分線上。
- **提示詞**：
```
Use @六禾, @一承 and @三川 as the exact people. A small dormitory meeting room in the morning, plain white walls, folding chairs arranged in a loose circle. Fixed camera, medium-wide shot. @六禾 sits on the right third of the frame with the navy cooler bag on her lap, talking a little faster than normal with small hand gestures, eyes moving between the others. @一承 sits across holding a clipboard, listening. @三川 sits at the edge holding his phone. Other students are soft and out of focus in the background. Everyone's expressions are neutral and attentive, no one is accusing or smirking.
```
- **額外禁止**：pointing fingers, angry faces, crying, dramatic lighting
- **驗收**：六禾看起來是緊張的日常樣子，不是心虛的反派表情；其他人不指責。

### L2-05｜捏保冷袋背帶特寫

- **參考圖**：`@六禾`
- **提示詞**：
```
Use @六禾 for the exact navy cooler bag and navy work vest. Extreme close-up of a young woman's hand on the shoulder strap of a navy cooler bag resting on her lap. Her fingers slowly squeeze and release the strap several times, twisting it slightly. Shallow depth of field, soft morning light. Nothing else in focus.
```
- **額外禁止**：bag opening, cake box visible
- **驗收**：保冷袋是關著的，看不到內容。

### L2-06｜〔剪輯製作〕匿名留言

- 文字層：匿名頭像＋`新冰箱不會說謊；懂系統的人才有辦法讓紀錄看起來正常。`
- 來源標示：`匿名帳號留言｜未經查證`。

---

## L3｜22:14 的共用帳號（目標 60–80 秒）

**本關可揭露**：資訊組調閱資料、ice-admin 登入與模板更新、五澄的門禁紀錄與自動登入設定、值勤碼略過機制、六禾在一樓簽收、影片時間碼跳格 31 秒、兩行系統訊息。
**本關絕對不拍**：五澄或任何人實際操作平板、31 秒缺口內的畫面、誰輸入值勤碼。

| 鏡頭 | 秒數 | 內容 | 對應旁白 |
|---|---|---|---|
| L3-01 | 5 | 資訊組調閱資料 | 校方資訊組查看… |
| L3-02 | 5 | 共用維護平板（無人） | 22:14:03「ice-admin」登入… |
| L3-03 | 〔剪輯製作〕 | 登入與模板更新紀錄 | （同上） |
| L3-04 | 4 | 自習室門禁感應器 | 許五澄說自己的門禁紀錄… |
| L3-05 | 4 | 平板自動登入（無人） | 維護平板保留了自動登入設定 |
| L3-06 | 5 | 操作手冊特寫 | 管理員帳號可輸入四位數值勤碼… |
| L3-07 | 4 | 一樓代收區（空） | 蔡六禾在 22:14 左右正在簽收… |
| L3-08 | 〔剪輯製作〕 | 影片時間碼跳格 | 羅四影的原始檔… |
| L3-09 | 〔剪輯製作〕 | 兩行系統訊息 | 同一時間系統另有兩行訊息… |

### L3-01｜資訊組調閱資料

- **參考圖**：`@資訊組`
- **提示詞**：
```
Use @資訊組 as the exact man: middle-aged, glasses, navy polo shirt, red ID badge on a lanyard. A small university IT office at night, desk with two monitors. He sits and scrolls through a long list on the monitor with a mouse, then leans closer and stops scrolling. Monitor content is abstract blurred rows of light, not readable. Medium shot from the side, slow push-in toward the screen.
```
- **額外禁止**：readable screen text, other people
- **驗收**：螢幕不可讀。

### L3-02｜共用維護平板（無人）

- **參考圖**：`@廚房`、`@COLD6`
- **提示詞**：
```
Use @廚房 and @COLD6. Medium close-up of a maintenance tablet mounted on a wall bracket next to the smart refrigerator in the shared kitchen at night. The tablet screen is on and glowing with a plain abstract dashboard, no readable text. No one is near it; no hands in frame. The camera slowly pushes in toward the tablet. Fluorescent light flickers faintly.
```
- **額外禁止**：hands, people, person touching the tablet
- **驗收**：**畫面裡沒有任何人或手**。這是「帳號與裝置」，不是操作者。

### L3-03｜〔剪輯製作〕登入與模板更新紀錄

- 文字層兩行：`22:14:03｜ice-admin｜公共廚房共用平板登入`、`22:14:26｜B-9 標籤模板更新`。

### L3-04｜自習室門禁感應器

- **參考圖**：無（可用 `@廚房` 做色調）
- **提示詞**：
```
Close-up of a card reader beside the glass door of a dormitory study room at night. A hand with a black sweater sleeve taps an access card on the reader; the reader's small light turns green. The door opens slightly. Only the hand and sleeve are visible, no face. Inside the room, blurred desks and a warm lamp.
```
- **額外禁止**：face, readable card text
- **驗收**：只拍門禁動作；旁白與文字層標明是「五澄的說法與門禁紀錄」。

### L3-05｜平板自動登入（無人）

- **參考圖**：`@COLD6`
- **提示詞**：
```
Use @COLD6. Close-up of the wall-mounted maintenance tablet next to the refrigerator. The screen is dark, then wakes up by itself and goes straight to the dashboard without any login screen, glowing softly. No hands, no people. Static camera.
```
- **額外禁止**：hands, fingers, people
- **驗收**：看得出「自己亮起、直接進入」；無人。

### L3-06｜操作手冊特寫

- **提示詞**：
```
Top-down close-up of a thin printed equipment manual lying open on a stainless steel counter at night. A finger slowly slides down a paragraph and stops beside a diagram of four empty square boxes representing a four-digit code. The printed lines are abstract grey bars, not readable. Soft fluorescent light.
```
- **額外禁止**：readable text, real numbers
- **驗收**：文字不可讀；CapCut 疊上「管理員可用四位數值勤碼略過警示｜紀錄只顯示『人工確認』，不留姓名」。

### L3-07｜一樓代收區（空）

- **提示詞**：
```
A dormitory ground-floor parcel reception counter at night: shelves of cardboard parcels, a clipboard sign-in sheet on the counter, and one small insulated cold-chain parcel box beside it. Nobody is there. Static wide shot, cool fluorescent light, a pen lying on the clipboard.
```
- **額外禁止**：people, readable text on the sheet
- **驗收**：無人。CapCut 疊上「一樓代收區紀錄｜22:14 左右｜蔡六禾簽收冷藏包裹」。

### L3-08｜〔剪輯製作〕時間碼跳格

- 用 L1-10a 最後一幀＋L1-10c 第一幀，中間放時間碼 `22:46:52` → `22:47:23`，並標出「少了 31 秒」。
- 來源標籤照 Word 寫「羅四影的原始檔」；不要宣稱它未經剪輯，也不要補出缺口畫面。

### L3-09｜〔剪輯製作〕兩行系統訊息

- `22:47:09｜B-9 私人物品標籤不一致`
- `22:47:18｜人工確認｜警示已略過`

---

## L4｜消失的三十一秒（目標 65–85 秒）

**本關可揭露**：電梯口備份相機畫面、六禾拿出兩瓶公共飲料、二寧移盒到公共料理桌、橘色貼紙緊靠蛋糕、紅色警示、一承與三川的話、一承輸入值勤碼、**幾分鐘後**蛋糕不見。
**本關絕對不拍**：誰貼上橘色貼紙、誰從桌上拿走蛋糕、六人分食、保冷袋裡裝了什麼。

**機位鎖定**：L4-02 到 L4-08 全部是**同一個電梯口備份相機**的固定高角度畫面（黑白偏綠或低飽和），從走廊斜看進廚房，同時看得到冰箱正面與公共料理桌。建議先生成 L4-02，確認構圖後，把它的第一幀當後續鏡頭的起始畫面（首幀參考），保持完全相同的機位。

| 鏡頭 | 秒數 | 內容 | 對應旁白 |
|---|---|---|---|
| L4-01 | 4 | 電梯口備份相機外觀 | 校方從電梯口備份相機… |
| L4-02 | 5 | 六禾拿出兩瓶氣泡水 | 蔡六禾從冰箱拿出的只是… |
| L4-03 | 3 | 氣泡水特寫 | 貼有「公共飲料」標籤 |
| L4-04 | 5 | 二寧把蛋糕移到料理桌 | 接著葉二寧… |
| L4-05 | 4 | 蛋糕與橘色貼紙特寫 | 盒上的姓名貼紙仍在… |
| L4-06 | 4 | COLD-6 紅色警示 | COLD-6 隨即跳出紅色警示 |
| L4-07 | 5 | 一承看一眼、三川在門口催 | 陳一承看了一眼說…／高三川在門口催促… |
| L4-08 | 4 | 一承輸入值勤碼 | 陳一承輸入值勤碼… |
| L4-09 | 5 | 幾分鐘後，料理桌已空 | 幾分鐘後… |

### L4-01｜電梯口備份相機

- **提示詞**：
```
A small dome security camera mounted on the ceiling near a dormitory elevator lobby at night, a tiny red indicator light blinking. Slow push-in toward the lens. Cool fluorescent light, elevator doors softly blurred in the background.
```
- **額外禁止**：brand logo, text

### L4-02｜六禾拿出兩瓶氣泡水

- **參考圖**：`@六禾`、`@COLD6`、`@廚房`
- **提示詞**：
```
Use @六禾 as the exact woman with the same navy work vest, grey long sleeves, low ponytail and navy cooler bag on her right shoulder. Use @COLD6 and @廚房. Security-camera footage from a fixed high angle at the elevator lobby, looking diagonally into the kitchen so that both the refrigerator front and the stainless steel shared cooking table are visible. Slightly desaturated, mild wide-angle distortion. She opens the refrigerator's glass door (hinge on the left), bends to a lower compartment next to the cake compartment, takes out two clear bottles of sparkling water, one in each hand, and straightens up. The black cake box with a gold ribbon is still visible in its own compartment. She steps back from the fridge holding the two bottles.
```
- **額外禁止**：touching the cake box, cake box moving, putting anything into the cooler bag
- **驗收**：兩瓶、透明氣泡水；**蛋糕盒仍在 B-9**；她沒有碰蛋糕、沒有把東西放進保冷袋。服裝與 L1-10a 一致。

### L4-03｜氣泡水特寫

- **提示詞**：
```
Close-up of two clear sparkling water bottles held in a woman's hands, grey long sleeves visible. Each bottle has a small plain white sticker on it with no readable text. Condensation droplets on the bottles. Shallow depth of field, cool light.
```
- **驗收**：CapCut 在貼紙上標註「公共飲料」。這個特寫可不是監視器質感，但剪輯時標明「備份畫面放大」。

### L4-04｜二寧把蛋糕移到料理桌

- **參考圖**：`@二寧`、`@蛋糕盒`、`@COLD6`、`@廚房`
- **提示詞**：
```
Use @二寧 as the exact woman: low bun, cream blouse, dark grey long cardigan. Use @蛋糕盒, @COLD6 and @廚房. Same fixed high-angle security-camera view from the elevator lobby, both the refrigerator and the shared cooking table visible. She opens the refrigerator door, takes the matte black cake box with the gold ribbon out of the lower-right compartment with both hands, carries it three steps to the stainless steel shared cooking table and sets it down near the edge. She gestures briefly toward the fridge as if explaining she is making room, then turns back toward the refrigerator.
```
- **額外禁止**：opening the box, putting stickers, removing labels, anyone else touching the box
- **驗收**：盒子從 B-9 到料理桌；她**沒有撕或貼任何貼紙**；盒子沒被打開。

### L4-05｜蛋糕與橘色貼紙特寫

- **參考圖**：`@蛋糕盒`、`@廚房`
- **提示詞**：
```
Use @蛋糕盒 as the exact cake box. Close-up of the stainless steel shared cooking table: the matte black cake box with the gold ribbon sits on the table, its white name label and red sticker still attached on the side. Right next to the box, touching its base, lies a bright orange rectangular sticker flat on the table surface, blank. No hands in frame. The camera holds still, then racks focus from the white name label to the orange sticker.
```
- **額外禁止**：hands, people, the orange sticker being placed, readable text
- **驗收**：姓名貼紙**還在**；橘色貼紙已經在桌上，看不到是誰放的。CapCut 標註「公共聚餐」。

### L4-06｜COLD-6 紅色警示

- **參考圖**：`@COLD6`
- **提示詞**：
```
Use @COLD6. Close-up of the small screen on the upper right of the smart refrigerator door. The screen suddenly flashes red and a red warning panel pulses on and off. The lower-right compartment of the fridge is now empty and its edge light blinks red in sync. No text is readable on the screen. No people.
```
- **額外禁止**：readable text, hands
- **驗收**：CapCut 疊文字 `B-9 私人物品標籤不一致；請確認物品歸屬。`

### L4-07｜一承看一眼、三川在門口催

- **參考圖**：`@一承`、`@三川`、`@廚房`
- **鏡位**：回到備份相機固定高角度；一承在冰箱前，三川站在廚房門口。
- **提示詞**：
```
Use @一承 and @三川 as the exact people with the same outfits. Use @廚房. Same fixed high-angle security-camera view from the elevator lobby. The young man in the dark jacket with a clipboard stands in front of the refrigerator, glances up at the red flashing screen for a second and says something short with a slight shrug. At the kitchen doorway, the young man in the charcoal hoodie leans in, points toward the shared table and then toward the corridor, talking quickly as if urging everyone to hurry. The black cake box is still on the shared table. Nobody touches the cake box.
```
- **額外禁止**：touching the cake box, laughing, sly glances
- **驗收**：兩人都沒碰蛋糕；表情平常。兩句對白用字幕（標「備份影像收音」）：
  - 陳一承：「下午也誤報兩次，應該又是標籤感應問題。」
  - 高三川：「等一下要夜間點名，先把桌子收乾淨比較要緊，明天再慢慢檢查。」

### L4-08｜一承輸入值勤碼

- **參考圖**：`@一承`、`@COLD6`
- **提示詞**：
```
Use @一承 and @COLD6. Medium close-up from the side: the young man in the dark jacket taps four times on the refrigerator's small door screen with his index finger. The red warning on the screen changes to a calm grey-blue panel. He turns away from the refrigerator and walks out of frame. The cake box is not in this frame.
```
- **額外禁止**：readable digits, the cake box
- **驗收**：按四下；紅轉灰藍。CapCut 疊 `警示已略過`，並配 `22:47:18`。

### L4-09｜幾分鐘後，料理桌已空

- **參考圖**：`@廚房`
- **鏡位**：同一備份相機高角度，但這是**另一段時間**，剪輯時先放「幾分鐘後」字卡再接。
- **提示詞**：
```
Use @廚房. Same fixed high-angle security-camera view from the elevator lobby, a few minutes later. The kitchen is empty of people. The stainless steel shared cooking table is bare: no cake box, only a small bright orange sticker left lying on the table surface. The refrigerator screen shows a calm grey-blue panel. Nothing moves except a faint fluorescent flicker.
```
- **額外禁止**：people, hands, cooler bag, anyone carrying a box
- **驗收**：**完全看不到帶走者**；這個鏡頭不能放在 31 秒片段內，前面一定要有「幾分鐘後」轉場。

---

## L5｜蛋糕到底去了哪裡（目標 60–80 秒）

**本關可揭露**：重量感測變化、予安當晚照片、下午兩次誤報是空層架測試、五澄的清理提醒已讀未回、自習室團體照中同品牌外盒、部分還原訊息。
**本關絕對不拍**：看清團體照裡盒子上的姓名、有人正在吃蛋糕、完整群組、匿名訊息的發話者。

| 鏡頭 | 秒數 | 內容 | 對應旁白 |
|---|---|---|---|
| L5-01 | 5 | 調查小組分開核對資料 | 調查小組把不同來源的資料分開核對 |
| L5-02 | 〔剪輯製作〕 | 重量曲線 B-9 / 料理桌 | B-9 的重量感測顯示… |
| L5-03 | 5 | 予安手機裡的照片 | 蘇予安當晚拍的照片… |
| L5-04 | 5 | 下午空層架測試 | 下午兩次標籤誤報… |
| L5-05 | 4 | 五澄看著舊訊息（手機） | 許五澄找到自己先前傳給值勤群的訊息 |
| L5-06 | 6 | 自習室團體照 | 團體照片拍到六人桌上… |
| L5-07 | 〔剪輯製作〕 | 部分還原訊息 | 校方也還原部分被刪除的群組訊息 |

### L5-01｜調查小組分開核對資料

- **參考圖**：`@資訊組`
- **提示詞**：
```
Use @資訊組 as the exact man. Top-down shot of a meeting table at night: printed log sheets, a tablet, a smartphone and a few photos are laid out in separate groups. The man's hands move one sheet into its own group and place a small marker between the groups. All printed content is blurred abstract bars. Slow overhead drift.
```
- **額外禁止**：readable text

### L5-02｜〔剪輯製作〕重量曲線

- 兩條線：`B-9 重量` 先下降；`公共料理桌` 在相近時間上升約 `1.7 公斤`，幾分鐘後回到原值。只畫形狀，不加推論字眼。

### L5-03｜予安手機裡的照片

- **參考圖**：`@予安`、`@蛋糕盒`
- **提示詞**：
```
Use @予安 for the oatmeal cardigan sleeve and @蛋糕盒 for the exact box. Close-up of a young woman's hands holding a smartphone. On the screen is a sharp photo of the matte black cake box with the gold ribbon, its white name label and red sticker fully intact on the side. Her fingers zoom into the labels in the photo. The labels in the photo are blank shapes.
```
- **額外禁止**：readable text
- **驗收**：CapCut 在照片上標註「蘇予安」「私人物品」。

### L5-04｜下午空層架測試

- **參考圖**：`@COLD6`
- **提示詞**：
```
Use @COLD6. Afternoon daylight in the shared kitchen. Medium close-up of the smart refrigerator: the lower-right compartment is completely empty. Its edge light blinks red twice, then returns to normal. No objects in the compartment, no people. The camera is static.
```
- **額外禁止**：cake box, any object in that compartment
- **驗收**：色調要明顯是**下午**（與當晚區分）；格子裡是空的。CapCut 標註「下午 誤報 ×2｜空層架測試」。

### L5-05｜五澄看著舊訊息

- **參考圖**：`@五澄`
- **提示詞**：
```
Use @五澄 as the exact young woman: long straight black hair, round glasses, black sweater. Medium close-up in a dim study room. She scrolls up on her phone, stops, and looks at the screen for a moment with a serious, thoughtful expression, then slowly lowers the phone. The screen is blurred and unreadable.
```
- **額外禁止**：tablet, typing on a laptop, readable text
- **驗收**：她只是在看手機，不操作平板。CapCut 合成訊息 `測試後請登出共用平板，並清除『公共聚餐』標籤模板。` 與「已讀」標記、「無人回報完成」。

### L5-06｜自習室團體照

建議**先生成一張靜態圖**（用 Omni 的圖片模式或其他生圖工具），再讓 Omni 做極慢推近；或直接讓 Omni 產出「幾乎不動」的影片。

- **參考圖**：`@一承`、`@二寧`、`@三川`、`@四影`、`@五澄`、`@六禾`、`@蛋糕盒`
- **提示詞**：
```
Use the six reference people @一承, @二寧, @三川, @四影, @五澄, @六禾 with their exact outfits. Use @蛋糕盒 for the box design. A casual group photo taken at night in a dormitory study room: the six students sit and stand around a study table, smiling lightly at the camera like an ordinary snapshot. On the table sits a closed matte black cake box with a gold ribbon, seen from a low side angle so that its label side faces away from the camera; the name label cannot be seen. Warm desk lamp light mixed with cool overhead light. The image is almost still; the camera pushes in extremely slowly toward the box.
```
- **額外禁止**：open box, cake slices, forks, plates, people eating, visible name label, a seventh person
- **驗收**：六人都在、造型正確；**盒子關著、姓名貼紙不可見**；沒有叉子或盤子。

### L5-07｜〔剪輯製作〕部分還原訊息

- 殘缺聊天畫面，大部分訊息打馬賽克或顯示「已刪除」，只清楚一則：`今晚要不要把那盒一起吃了？`
- 發話者頭像與名稱**模糊不可辨**；標註 `部分還原｜發話者未確認`。

---

## L6｜沒有人單獨偷走，誰該負責？（目標 80–100 秒）

**本關可揭露**：完整真相：夜食會、六人知情同意、各自行為、四影剪掉 31 秒、自習室共同分食、予安的提問。
**本關仍不做**：在畫面上標示誰的證詞合理或有瑕疵、替觀眾下責任結論、配上審判感的音樂或特寫。

| 鏡頭 | 秒數 | 內容 | 對應旁白 |
|---|---|---|---|
| L6-01 | 5 | 還原資料匯整 | 校方最後還原了完整群組備份… |
| L6-02 | 〔剪輯製作〕 | 夜食會群組 | 六人私下組成名為「夜食會」的群組… |
| L6-03 | 4 | 五澄離開、平板沒登出 | 許五澄未登出共用平板… |
| L6-04 | 3 | 二寧移盒（重用 L4-04） | 葉二寧把蛋糕移到公共料理桌 |
| L6-05 | 3 | 一承略過（重用 L4-08） | 陳一承看見私人物品警示後仍人工略過 |
| L6-06 | 4 | 三川在群組打字 | 高三川催促大家迅速收桌… |
| L6-07 | 5 | 六禾把保冷袋帶到自習室 | 蔡六禾把裝有蛋糕的保冷袋帶到自習室 |
| L6-08 | 5 | 四影剪輯片段 | 羅四影事後剪掉關鍵三十一秒… |
| L6-09 | 6 | 自習室共同分食 | 自習室影像… |
| L6-10 | 4 | 回收包裝 | 回收包裝證實… |
| L6-11 | 7 | 予安在調查會議提問 | 蘇予安在調查會議上問… |

### L6-01｜還原資料匯整

- **參考圖**：`@資訊組`
- **提示詞**：
```
Use @資訊組 as the exact man. In the IT office at night, he sits in front of two monitors that each show a vertical timeline of blurred abstract blocks. He drags the last block into place so the two timelines line up, then sits back. Screens unreadable. Medium shot, slow push-in.
```

### L6-02｜〔剪輯製作〕夜食會群組

- 群組名稱 `夜食會`；成員六人頭像。
- 顯示「沒人會追究的小物共享」「被問時只說自己看到的片段」「今晚一起分食」三類訊息的**摘要字卡**，不需要逐字捏造聊天內容。Word 沒寫出具體訊息原文，影片只呈現旁白已說的事實。

### L6-03｜五澄離開、平板沒登出

- **參考圖**：`@五澄`、`@COLD6`、`@廚房`
- **提示詞**：
```
Use @五澄 as the exact young woman with long straight hair, round glasses and black sweater, holding her laptop. Use @COLD6 and @廚房. Earlier in the evening in the shared kitchen. She finishes checking the wall-mounted maintenance tablet beside the refrigerator, turns and walks out of the kitchen with her laptop. The tablet screen stays on and glowing behind her. Medium-wide shot, static camera.
```
- **額外禁止**：the cake box, other people, readable text
- **驗收**：重點是「她離開，平板仍亮」。時間要標在 22:14 **以前**（例如字卡「先前的測試後」），不要讓她出現在 22:14:03 登入那一刻。

### L6-04 與 L6-05｜重用 L4 素材

- 直接重用 L4-04、L4-08 的片段，加淡色框線與角色名字卡，保持同一晚的連續性。不另外生成。

### L6-06｜三川在群組打字

- **參考圖**：`@三川`
- **提示詞**：
```
Use @三川 as the exact young man in the charcoal hoodie. Night, dormitory corridor. Close-up from the side as he types quickly on his phone with both thumbs, sends a message, then glances over his shoulder toward the lounge. The phone screen is blurred and unreadable. Neutral expression.
```
- **額外禁止**：smirk, evil grin, readable text
- **驗收**：CapCut 疊上「失竊後用二選一說法把群組注意力引向其他人」的旁白字幕；不另外捏造他的訊息原文。

### L6-07｜六禾把保冷袋帶到自習室

- **參考圖**：`@六禾`
- **提示詞**：
```
Use @六禾 as the exact young woman with the navy work vest, low ponytail and the navy cooler bag on her right shoulder. Night, dormitory corridor leading to a study room. The cooler bag now looks full and boxy, weighed down. She walks down the corridor at a normal pace, opens the study room door and goes in; the door closes behind her. Tracking shot from behind.
```
- **額外禁止**：opening the bag, cake box visible outside the bag
- **驗收**：保冷袋看起來**有東西、較重**，與 L1 的扁袋形成對比；不需拍出盒子。

### L6-08｜四影剪輯片段

- **參考圖**：`@四影`
- **提示詞**：
```
Use @四影 as the exact young man with messy short black hair, dark brown utility jacket and black T-shirt; his black camera sits on the desk. Night, a small bedroom desk with a laptop running video editing software. Over-the-shoulder shot: he drags a selection across a short section of the timeline and presses delete; the remaining clips snap together. The timeline and preview are abstract colored blocks, nothing readable. His face is calm, lit by the screen.
```
- **額外禁止**：readable text, software logo
- **驗收**：看得出「選取→刪除→接合」。CapCut 可在時間軸上疊 `31 秒` 標示。

### L6-09｜自習室共同分食

- **參考圖**：六人全部＋`@蛋糕盒`
- **提示詞**：
```
Use @一承, @二寧, @三川, @四影, @五澄 and @六禾 as the exact six people with their outfits from the same night. Use @蛋糕盒 for the box. The same dormitory study room from the group photo, night. Surveillance-style fixed high angle, slightly desaturated. The six sit around the study table sharing slices of a dark chocolate layer cake with berries on small paper plates; the opened black box with the gold ribbon lies on the table. They pass plates and forks and chat quietly. Casual, ordinary, not celebratory, not sinister.
```
- **額外禁止**：a seventh person, laughing at camera, toasting, evil expressions
- **驗收**：六人都在；同一個自習室；盒子是同一款；氣氛平淡，不演成犯罪慶祝。

### L6-10｜回收包裝

- **參考圖**：`@蛋糕盒`
- **提示詞**：
```
Use @蛋糕盒 for the exact box. Close-up at a dormitory recycling station: a flattened matte black cake box with an eclipse graphic and a loose gold ribbon lies on top of other paper waste, a small torn piece of white label still stuck to one side. A gloved hand lifts the flattened box slightly for inspection, then sets it down. Cool light.
```
- **額外禁止**：readable text
- **驗收**：看得出是同款盒子與殘留標籤。

### L6-11｜予安在調查會議提問

- **參考圖**：`@予安`
- **提示詞**：
```
Use @予安 as the exact young woman with the short black bob, cream hoodie and oatmeal cardigan. Daytime, the same small dormitory meeting room as before. Medium close-up, static. She sits with her hands folded on the table, looks around the room at people off-camera, and speaks calmly and steadily, a composed and serious expression, not crying. The camera holds on her face; the background is soft.
```
- **額外禁止**：tears, shouting, other people's faces in focus
- **驗收**：字幕照 Word：`如果沒有任何一個人能單獨完成整件事，到底誰該為了偷吃蛋糕及事後掩護負責？` 結尾停在她的鏡頭，不加答案字卡。

---

## 附錄 A｜開場說明片 `intro-guide.mp4`（選用）

這支是操作說明，**不放任何案件真相**。可只用 Omni 生成 2 個背景鏡頭，其餘用 CapCut 文字：

```
Use @廚房. Night, the empty shared dormitory kitchen, the smart refrigerator glowing softly. Very slow dolly-in from the doorway. No people. Calm, mysterious but not scary.
```

```
Top-down shot of a detective's desk at night: an open notebook, a pen, a magnifying glass and a few blurred printed sheets. A hand turns a page. Nothing readable.
```

## 附錄 B｜鏡頭生成紀錄表

每生成一次就記一行，之後估算六關成本（見製作指南第 4 節）。

| 鏡頭 | 模型／版本 | 參考圖 | 秒數／解析度 | 扣點 | 第幾次 | 可用？ | 不可用原因 |
|---|---|---|---|---|---|---|---|
| L1-10a | | | | | | | |

## 附錄 C｜送出前自我檢查

- [ ] 這鏡的內容有沒有超出當關可揭露範圍？（特別是 L1-10、L4-05、L4-09、L5-06）
- [ ] 人物服裝、髮型、保冷袋位置是否和 `0.2` 對照表一致？
- [ ] 冰箱鉸鏈在左、B-9 在下半部第二列最右？
- [ ] 畫面上有沒有模型自己畫出的字、數字或時間碼？有就重生或裁掉。
- [ ] 表情是否中性？有沒有被畫成心虛、奸笑的反派？
- [ ] L1／L4 共用事件的門向、服裝、瓶數（兩瓶）、盒子外觀是否接得上？
