// Douyin/Xiaohongshu share sheets embed a short or profile link in a longer
// message (e.g. "长按复制... https://v.douyin.com/xxx/ ...抖音号是…"). Pull the
// first such URL out of the whole input and, for short links, follow the
// redirect so the UID (sec_uid / profile id) can be read from the final URL.

const SHARE_RE = /https?:\/\/(?:www\.)?(?:v\.douyin\.com|douyin\.com|xhslink\.com|xiaohongshu\.com)\/[^\s，。]*/i

export interface ShareTarget {
  /** The extracted, redirect-followed URL, or null when the input has none. */
  candidate: string | null
}

/**
 * Extract a Douyin/Xiaohongshu URL from within `input` (which may be a full
 * share message) and follow short links. Returns `candidate: null` when the
 * input carries no share URL, so callers keep their normal parsing path.
 */
export async function extractShareTarget(input: string): Promise<ShareTarget> {
  const match = SHARE_RE.exec(input)
  if (!match) return { candidate: null }

  let candidate = match[0]
  if (/^https?:\/\/(?:v\.douyin\.com|xhslink\.com)\//i.test(candidate)) {
    try {
      const probe = await fetch(candidate, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'accept-language': 'zh-CN,zh;q=0.9',
        },
        signal: AbortSignal.timeout(12000),
      })
      const finalUrl = probe.url
      void probe.body?.cancel()
      if (finalUrl && /^https?:\/\//i.test(finalUrl)) candidate = finalUrl
    } catch {
      // Fall through: the candidate will fail validation with a clear message.
    }
  }
  return { candidate }
}
