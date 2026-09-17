<?php
/**
 * 設定讀取。金鑰一律走環境變數或專案根目錄的 .env，不寫進程式碼。
 *
 * 既有的 api/public/chat.php 與 evaluate.php 把 OpenAI 金鑰直接寫死在原始碼裡，
 * 而且已經進了 git（commit bb9ad6a）。那把金鑰必須到 OpenAI 後台撤銷重發——
 * 光是搬到這裡沒有用，舊 commit 裡還留著。
 *
 * .env 已在 .gitignore 內。格式：
 *   OPENAI_API_KEY=sk-...
 *   SURVEYCAKE_PRE_URL=https://www.surveycake.com/s/xxxx
 *   SURVEYCAKE_POST_URL=https://www.surveycake.com/s/yyyy
 */

function ck_env(string $key, ?string $default = null): ?string
{
    static $dotenv = null;

    $fromEnv = getenv($key);
    if ($fromEnv !== false && $fromEnv !== '') {
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

/** 取得 OpenAI 金鑰；沒設定就明確報錯，不要靜默送出無效請求。 */
function ck_openai_key(): string
{
    $key = ck_env('OPENAI_API_KEY');
    if (!$key) {
        throw new RuntimeException('未設定 OPENAI_API_KEY（請放進專案根目錄的 .env）');
    }
    return $key;
}

/**
 * 呼叫 OpenAI Chat Completions。
 * 回饋失敗不該讓受試者卡住，所以呼叫端要自行處理 null。
 */
function ck_openai_chat(array $messages, string $model = 'gpt-4o', float $temperature = 0.7): ?string
{
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 45,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . ck_openai_key(),
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model'       => $model,
            'messages'    => $messages,
            'temperature' => $temperature,
        ], JSON_UNESCAPED_UNICODE),
    ]);

    $response = curl_exec($ch);
    $status   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($response === false || $status !== 200) {
        error_log("[ck_openai] HTTP {$status} {$err} " . substr((string)$response, 0, 500));
        return null;
    }

    $data = json_decode($response, true);
    return $data['choices'][0]['message']['content'] ?? null;
}
