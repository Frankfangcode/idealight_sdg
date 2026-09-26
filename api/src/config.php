<?php
/**
 * 設定讀取。金鑰一律走環境變數或專案根目錄的 .env，不寫進程式碼。
 *
 * 既有的 api/public/chat.php 與 evaluate.php 把 OpenAI 金鑰直接寫死在原始碼裡，
 * 而且已經進了 git（commit bb9ad6a）。那把金鑰必須到 OpenAI 後台撤銷重發——
 * 光是搬到這裡沒有用，舊 commit 裡還留著。
 *
 * .env 已在 .gitignore 內。格式：
 *   LLM_API_KEY=AIza...        蛋糕實驗（見下方 LLM 區塊）
 *   OPENAI_API_KEY=sk-...      SDG 實驗的 chat.php／evaluate.php
 *   SURVEYCAKE_PRE_URL=https://www.surveycake.com/s/xxxx
 *   SURVEYCAKE_POST_URL=https://www.surveycake.com/s/yyyy
 */

function ck_env(string $key, ?string $default = null): ?string
{
    static $dotenv = null;

    $fromEnv = getenv($key);
    if ($fromEnv !== false) {
        return $fromEnv;
    }

    if ($dotenv === null) {
        $dotenv = [];
        $path = __DIR__ . '/../../.env';
        if (is_readable($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                    continue;
                }
                [$k, $v] = explode('=', $line, 2);
                $dotenv[trim($k)] = trim($v, " \t\"'");
            }
        }
    }

    return $dotenv[$key] ?? $default;
}

/** SDG 實驗（chat.php／evaluate.php）用的 OpenAI 金鑰。蛋糕實驗不用這把，見 ck_llm_key()。 */
function ck_openai_key(): string
{
    $key = ck_env('OPENAI_API_KEY');
    if (!$key) {
        throw new RuntimeException('未設定 OPENAI_API_KEY（請放進專案根目錄的 .env）');
    }
    return $key;
}

// =====================================================================
// 蛋糕實驗的 LLM（訊問的 AI 角色、AI 回饋）
//
// 走 OpenAI 相容的 /chat/completions 格式，供應商由 .env 決定，程式不綁定：
//   LLM_BASE_URL   預設 Google AI Studio（Gemini API）的 OpenAI 相容端點
//   LLM_API_KEY    該供應商的金鑰（Google AI Studio 的金鑰以 AIza 開頭）
//   LLM_MODEL      預設 gemma-4-26b-a4b-it
//   LLM_REASONING_EFFORT  預設 minimal；填 omit 代表不送這個參數（給不支援的供應商用）
//
// 這兩個預設值是 2026-09 實測出來的，不要憑感覺改：
//   - gemma-4-31b-it 首字要 18 秒左右，5 次裡還會有 1 次 HTTP 500；
//     gemma-4-26b-a4b-it 首字約 1.1 秒、總共約 1.3 秒。訊問只有 150 秒且等待不暫停計時，
//     31b 等於讓受試者一關只問得到七八句。
//   - Gemma 4 預設會先思考再回答，而且思考過程直接夾在回答裡（<thought>…</thought>），
//     不關掉的話會整段顯示在對話泡泡上，回一句「你好」也要 5～27 秒。
//     Google 的相容層只接受 reasoning_effort=minimal，none／low 都會回 400。
//
// 刻意不沿用 OPENAI_API_KEY：那把金鑰還被 SDG 實驗的 chat.php／evaluate.php 使用，
// 它們固定打 api.openai.com。兩邊共用同一個變數的話，換供應商時一定有一邊
// 會把金鑰送到別家的伺服器上。
// =====================================================================

function ck_llm_base_url(): string
{
    return rtrim(ck_env('LLM_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'), '/');
}

/** 沒設定就明確報錯，不要靜默送出無效請求。 */
function ck_llm_key(): string
{
    $key = ck_env('LLM_API_KEY');
    if (!$key) {
        throw new RuntimeException('未設定 LLM_API_KEY（請放進專案根目錄的 .env）');
    }
    return $key;
}

/** 模型名稱會隨每句回答寫進 ck_chat_messages.model，日後可追溯。 */
function ck_llm_model(): string
{
    return ck_env('LLM_MODEL', 'gemma-4-26b-a4b-it');
}

/** 組請求本體。 */
function ck_llm_body(array $messages, float $temperature, array $extra = []): string
{
    $body = ['model' => ck_llm_model(), 'messages' => $messages, 'temperature' => $temperature] + $extra;
    $effort = ck_env('LLM_REASONING_EFFORT', 'minimal');
    if ($effort !== 'omit') {
        $body['reasoning_effort'] = $effort;
    }
    return json_encode($body, JSON_UNESCAPED_UNICODE);
}

/** 拿掉回答裡的思考區塊。已經把思考調到最低，這是第二道保險。 */
function ck_llm_strip_thought(string $text): string
{
    $text = preg_replace('/<thought>.*?<\/thought>/su', '', $text);
    // 沒有結尾標籤＝思考還沒結束就被 max_tokens 截斷，後面全部不是回答
    $text = preg_replace('/<thought>.*$/su', '', $text);
    return trim($text);
}

/** 值得重試的狀態：連不上（0）或供應商端錯誤（5xx）。4xx 是我們的問題，重試沒用。 */
function ck_llm_retryable(int $status): bool
{
    return $status === 0 || $status >= 500;
}

/**
 * 呼叫 Chat Completions（非串流，AI 回饋用）。
 * 回饋失敗不該讓受試者卡住，所以呼叫端要自行處理 null。
 */
function ck_llm_chat(array $messages, float $temperature = 0.7): ?string
{
    // Google 的 Gemma 端點偶爾會立刻回 500，再打一次通常就好
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        [$status, $content] = ck_llm_chat_once($messages, $temperature);
        if ($content !== null || !ck_llm_retryable($status)) {
            return $content;
        }
    }
    return null;
}

function ck_llm_chat_once(array $messages, float $temperature): array
{
    $ch = curl_init(ck_llm_base_url() . '/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 45,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . ck_llm_key(),
        ],
        CURLOPT_POSTFIELDS => ck_llm_body($messages, $temperature),
    ]);

    $response = curl_exec($ch);
    $status   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err      = curl_error($ch);
    // 不呼叫 curl_close()：PHP 8.0 起它沒有作用，8.5 起會噴 Deprecated，
    // 在 display_errors 開啟的環境會把警告印在 JSON 前面，讓前端解析失敗。

    if ($response === false || $status !== 200) {
        error_log("[ck_llm] HTTP {$status} {$err} " . substr((string)$response, 0, 500));
        return [$status, null];
    }

    $data    = json_decode($response, true);
    $content = ck_llm_strip_thought((string)($data['choices'][0]['message']['content'] ?? ''));
    return [$status, $content === '' ? null : $content];
}

/**
 * 串流版 Chat Completions：每收到一段文字就呼叫 $onDelta。
 *
 * 訊問階段等 AI 回覆的時間不暫停計時，所以要讓第一個字盡快出現在畫面上，
 * 而不是等整段回答生成完。回傳完整文字；失敗（含一個字都沒收到）回傳 null。
 */
function ck_llm_chat_stream(array $messages, callable $onDelta, int $maxTokens = 220, float $temperature = 0.6): ?string
{
    // 只在「一個字都還沒送出去」時重試，已經開始顯示的回答不能重來。
    // 實測 Google 的 Gemma 端點有兩種失敗：半秒內回 500，或是連上之後完全不回資料。
    // 前者重試幾乎不花時間；後者靠 ck_llm_chat_stream_once 的停滯偵測在 5 秒切斷。
    // 等待不暫停計時，所以總共只給約 10 秒的額度，超過就讓角色講備援台詞，
    // 不要讓受試者為了一句回答賠掉五分之一的訊問時間。
    $startedAt = microtime(true);
    for ($attempt = 1; $attempt <= 3; $attempt++) {
        [$status, $text] = ck_llm_chat_stream_once($messages, $onDelta, $maxTokens, $temperature);
        if ($text !== null || !ck_llm_retryable($status) || microtime(true) - $startedAt > 8) {
            return $text;
        }
    }
    return null;
}

function ck_llm_chat_stream_once(array $messages, callable $onDelta, int $maxTokens, float $temperature): array
{
    $full    = ''; // 已經送給呼叫端的文字（不含思考區塊）
    $pending = ''; // 還不能送的尾巴：可能是 <thought> 標籤的前半段，或思考區塊的內容
    $inThought = false;
    $buffer = '';
    $raw    = ''; // 非 SSE 的內容（錯誤時回的是一般 JSON），留給錯誤紀錄用

    // 邊串流邊濾掉 <thought>…</thought>。標籤可能被切在兩個片段之間，
    // 所以結尾若長得像標籤的開頭就先扣著，等下一段來了再決定。
    $feed = function (string $delta) use (&$full, &$pending, &$inThought, $onDelta): void {
        $pending .= $delta;
        for (;;) {
            if ($inThought) {
                $end = strpos($pending, '</thought>');
                if ($end === false) {
                    return; // 還在思考，全部扣著
                }
                $pending   = ltrim(substr($pending, $end + 10));
                $inThought = false;
                continue;
            }
            $start = strpos($pending, '<thought>');
            if ($start !== false) {
                $out       = substr($pending, 0, $start);
                $pending   = substr($pending, $start + 9);
                $inThought = true;
            } else {
                $hold = 0;
                for ($n = min(8, strlen($pending)); $n > 0; $n--) {
                    if (str_starts_with('<thought>', substr($pending, -$n))) {
                        $hold = $n;
                        break;
                    }
                }
                $out     = $hold ? substr($pending, 0, -$hold) : $pending;
                $pending = $hold ? substr($pending, -$hold) : '';
            }
            if ($full === '') {
                // 思考區塊後面常跟著換行，Gemma 偶爾還會先吐一行 "---"；別讓泡泡以這些開頭
                $out = ltrim($out, " \t\r\n-");
            }
            if ($out !== '') {
                $full .= $out;
                $onDelta($out);
            }
            if (!$inThought) {
                return;
            }
        }
    };

    $ch = curl_init(ck_llm_base_url() . '/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT        => 30,
        // 停滯偵測：連續 5 秒收不到任何資料就切斷。實測正常首字 1～2 秒（最慢 2.1 秒），
        // 5 秒沒動靜代表對方掛著不回，繼續等只是白白燒掉受試者的時間。
        CURLOPT_LOW_SPEED_LIMIT => 1,
        CURLOPT_LOW_SPEED_TIME  => 5,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . ck_llm_key(),
        ],
        CURLOPT_POSTFIELDS => ck_llm_body($messages, $temperature, ['max_tokens' => $maxTokens, 'stream' => true]),
        // SSE 的一個事件可能被切在兩個 chunk 之間，所以先進 buffer 再按行切
        CURLOPT_WRITEFUNCTION => function ($ch, string $chunk) use (&$buffer, &$raw, $feed): int {
            $buffer .= $chunk;
            while (($pos = strpos($buffer, "\n")) !== false) {
                $line   = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);
                if (!str_starts_with($line, 'data:')) {
                    if (strlen($raw) < 500) {
                        $raw .= $line;
                    }
                    continue;
                }
                $payload = trim(substr($line, 5));
                if ($payload === '' || $payload === '[DONE]') {
                    continue;
                }
                $delta = json_decode($payload, true)['choices'][0]['delta']['content'] ?? '';
                if ($delta !== '') {
                    $feed($delta);
                }
            }
            return strlen($chunk);
        },
    ]);

    curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);

    // 串流結束後還扣著的尾巴：不在思考區塊裡就是正常文字（只是剛好長得像標籤開頭）
    if (!$inThought && $pending !== '') {
        $full .= $pending;
        $onDelta($pending);
    }

    if ($status !== 200 || $full === '') {
        error_log("[ck_llm_stream] HTTP {$status} {$err} " . substr($raw . $buffer, 0, 500));
    }
    // 標頭已經回 200 但內容停滯的情況：curl 有錯誤而一個字都沒收到，當成連線失敗處理
    if ($full === '' && $err !== '') {
        $status = 0;
    }
    return [$status, $full === '' ? null : $full];
}
