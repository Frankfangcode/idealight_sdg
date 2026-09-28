把六段关卡影片放在這個資料夾，檔名如下：

  intro-L1.mp4   關卡 1｜B-9 空了
  intro-L2.mp4   關卡 2｜好學生不會偷東西
  intro-L3.mp4   關卡 3｜22:14 的共用帳號
  intro-L4.mp4   關卡 4｜消失的三十一秒
  intro-L5.mp4   關卡 5｜蛋糕到底去了哪裡
  intro-L6.mp4   關卡 6｜沒有人單獨偷走，誰該負責？

規格：16:9、1920x1080 以上、24fps 以上、H.264 (yuv420p)、AAC。
放進來之前先做 faststart（moov 搬到檔頭），否則用 server 開會等整支下載完才播：

  ffmpeg -i 你的檔案.mp4 -c copy -movflags +faststart intro-L1.mp4

目前版本庫沒有正式影片。未放入素材時，頁面會顯示待準備，不能當成已看完跳過。
測試用影片只存在隔離測試環境，不得當作正式素材。

Windows 試播：在專案根目錄執行 php api/tools/prepare_demo_media.php。
使用 Git 內的 video.mp4 複製七個實體檔案，已有檔案不覆蓋；不需 symlink 權限。
七份複製檔只留本機，不必重複提交。正式施測前仍需各關正式影片。

2026-09-28 更正：沒有額外角色介紹影片。現行開場直接顯示六人圖文介紹，再進調查須知；intro-guide.mp4 僅是舊版試播檔，不再由開場播放，不要用無關素材代替。第一關的正式影片使用 intro-L1.mp4。
