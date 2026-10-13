/** Open shopping apps / sites without API keys */

export function openExternal(url: string): void {
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  } catch {
    window.location.href = url
  }
}

/** Try app scheme then https fallback after a short delay */
export function openAppOrWeb(appUrl: string, webUrl: string): void {
  const start = Date.now()
  const timer = window.setTimeout(() => {
    // If still visible, scheme likely failed
    if (Date.now() - start < 1800) openExternal(webUrl)
  }, 900)
  const onBlur = () => {
    window.clearTimeout(timer)
    window.removeEventListener('visibilitychange', onVis)
  }
  const onVis = () => {
    if (document.hidden) onBlur()
  }
  window.addEventListener('visibilitychange', onVis)
  try {
    window.location.href = appUrl
  } catch {
    window.clearTimeout(timer)
    openExternal(webUrl)
  }
}

export function openTaobao(keyword?: string): void {
  const q = (keyword ?? '').trim()
  if (q) {
    const enc = encodeURIComponent(q)
    openAppOrWeb(
      `taobao://s.taobao.com?q=${enc}`,
      `https://s.taobao.com/search?q=${enc}`,
    )
  } else {
    openAppOrWeb('taobao://', 'https://www.taobao.com/')
  }
}

export function openPinduoduo(keyword?: string): void {
  const q = (keyword ?? '').trim()
  if (q) {
    const enc = encodeURIComponent(q)
    openAppOrWeb(
      `pinduoduo://com.xunmeng.pinduoduo/search_result.html?search_key=${enc}`,
      `https://mobile.yangkeduo.com/search_result.html?search_key=${enc}`,
    )
  } else {
    openAppOrWeb('pinduoduo://com.xunmeng.pinduoduo/index.html', 'https://mobile.yangkeduo.com/')
  }
}

export function openPurchaseLink(link: string): void {
  const u = link.trim()
  if (!u) return
  const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`
  openExternal(withProto)
}
