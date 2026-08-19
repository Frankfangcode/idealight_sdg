把六段開頭影片放在這個資料夾，檔名如下：

  intro-L1.mp4   關卡 1｜B-9 空了
  intro-L2.mp4   關卡 2｜好學生不會偷東西
  intro-L3.mp4   關卡 3｜22:14 的共用帳號
  intro-L4.mp4   關卡 4｜消失的三十一秒
  intro-L5.mp4   關卡 5｜蛋糕到底去了哪裡
  intro-L6.mp4   關卡 6｜沒有人單獨偷走，誰該負責？

規格：16:9、1920x1080 以上、24fps 以上、H.264 (yuv420p)、AAC。
放進來之前先做 faststart（moov 搬到檔頭），否則用 server 開會等整支下載完才播：

  ffmpeg -i 你的檔案.mp4 -c copy -movflags +faststart intro-L1.mp4

目前狀態：intro-L1.mp4 是舊劇本〈別讓她知道〉的影片，需要依新劇本重拍後覆蓋。
每段的腳本在遊戲的影片畫面下方可以展開複製。
