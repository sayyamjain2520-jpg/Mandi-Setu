export type GlobalLocale = 'en' | 'hi' | 'mr' | 'gu' | 'te' | 'ta'

type TranslationResult = Record<string, string>

const API_LOCALE: Record<Exclude<GlobalLocale, 'en'>, string> = {
  hi: 'hi',
  mr: 'mr',
  gu: 'gu',
  te: 'te',
  ta: 'ta',
}

const SCRIPT_MARKERS: Record<Exclude<GlobalLocale, 'en'>, RegExp> = {
  hi: /[\u0900-\u097F]/,
  mr: /[\u0900-\u097F]/,
  gu: /[\u0A80-\u0AFF]/,
  te: /[\u0C00-\u0C7F]/,
  ta: /[\u0B80-\u0BFF]/,
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'SVG',
  'PATH',
  'TEXTAREA',
])

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'] as const
const originalText = new WeakMap<Text, string>()
const lastTranslatedText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<Element, Record<string, string>>()
const lastTranslatedAttributes = new WeakMap<Element, Record<string, string>>()

let activeLocale: GlobalLocale = 'en'
let observer: MutationObserver | null = null
let translating = false
let timer: ReturnType<typeof setTimeout> | null = null
let runId = 0

const cacheKey = (locale: GlobalLocale, text: string) =>
  `mandi-setu-translation-v1:${locale}:${text}`

function getConfig() {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  return { supabaseUrl, anonKey }
}

function getCached(locale: GlobalLocale, text: string) {
  try {
    return localStorage.getItem(cacheKey(locale, text))
  } catch {
    return null
  }
}

function setCached(locale: GlobalLocale, text: string, value: string) {
  try {
    localStorage.setItem(cacheKey(locale, text), value)
  } catch {
    // Cache is an optimization. Translation still works without it.
  }
}

function shouldSkipElement(element: Element | null) {
  let current = element

  while (current) {
    if (SKIP_TAGS.has(current.tagName)) return true
    if (current.hasAttribute('data-no-translate') || current.classList.contains('notranslate')) return true
    if ((current as HTMLElement).isContentEditable) return true
    current = current.parentElement
  }

  return false
}

function isUsefulText(value: string) {
  const cleaned = value.trim()
  if (!cleaned) return false
  if (cleaned.length < 2) return false
  if (/^[\d\s₹$€£.,:%+\-_/()]+$/.test(cleaned)) return false
  if (/^(https?:\/\/|www\.)/i.test(cleaned)) return false
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(cleaned)) return false
  if (/^[A-Z]{1,5}[- ]?\d/.test(cleaned) && /\d/.test(cleaned)) return false
  return true
}

function isAlreadyTargetLanguage(value: string, locale: GlobalLocale) {
  if (locale === 'en') return false
  return SCRIPT_MARKERS[locale].test(value)
}

function splitWhitespace(value: string) {
  const match = value.match(/^(\s*)(.*?)(\s*)$/s)
  return {
    leading: match?.[1] ?? '',
    core: match?.[2] ?? value,
    trailing: match?.[3] ?? '',
  }
}

function collectTextNodes(root: Node) {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null = walker.nextNode()

  while (node) {
    const textNode = node as Text
    const parent = textNode.parentElement

    if (!shouldSkipElement(parent) && isUsefulText(textNode.nodeValue ?? '')) {
      const current = textNode.nodeValue ?? ''
      if (!originalText.has(textNode) || (!translating && activeLocale === 'en')) {
        originalText.set(textNode, current)
      }

      const source = originalText.get(textNode) ?? current
      if (!isAlreadyTargetLanguage(source, activeLocale)) {
        nodes.push(textNode)
      }
    }

    node = walker.nextNode()
  }

  return nodes
}

function getQueryElements(root: Node): Element[] {
  if (root instanceof Element || root instanceof Document || root instanceof DocumentFragment) {
    return Array.from(root.querySelectorAll('*'))
  }

  return []
}

function collectAttributeTargets(root: Node): Element[] {
  const elements = getQueryElements(root)
  if (root instanceof Element) elements.unshift(root)

  return elements.filter((element: Element) => {
    if (shouldSkipElement(element)) return false
    return TRANSLATABLE_ATTRIBUTES.some((attribute) => element.hasAttribute(attribute) && isUsefulText(element.getAttribute(attribute) ?? ''))
  })
}

async function requestTranslations(texts: string[], locale: Exclude<GlobalLocale, 'en'>): Promise<TranslationResult> {
  const result: TranslationResult = {}
  const missing: string[] = []

  for (const text of texts) {
    const cached = getCached(locale, text)
    if (cached !== null) result[text] = cached
    else missing.push(text)
  }

  if (!missing.length) return result

  const { supabaseUrl, anonKey } = getConfig()
  if (!supabaseUrl || !anonKey) throw new Error('Supabase VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY is missing.')

  for (let start = 0; start < missing.length; start += 80) {
    const batch = missing.slice(start, start + 80)
    const response = await fetch(`${supabaseUrl}/functions/v1/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({
        source: 'en',
        target: API_LOCALE[locale],
        texts: batch,
      }),
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      throw new Error(errorJson?.error || `Translation function failed (${response.status}).`)
    }

    const data = await response.json()
    const translated = Array.isArray(data?.translations) ? data.translations : []

    batch.forEach((source, index) => {
      const value = String(translated[index] ?? source)
      result[source] = value
      setCached(locale, source, value)
    })
  }

  return result
}

function restoreEnglish(root: Node) {
  const nodes = collectTextNodesForRestore(root)
  for (const node of nodes) {
    const source = originalText.get(node)
    if (source !== undefined) node.nodeValue = source
  }

  const elements = collectAttributeTargetsForRestore(root)
  for (const element of elements) {
    const attrs = originalAttributes.get(element)
    if (!attrs) continue
    for (const [attribute, value] of Object.entries(attrs)) {
      element.setAttribute(attribute, value)
    }
  }
}

function collectTextNodesForRestore(root: Node) {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null = walker.nextNode()
  while (node) {
    const textNode = node as Text
    if (originalText.has(textNode)) nodes.push(textNode)
    node = walker.nextNode()
  }
  return nodes
}

function collectAttributeTargetsForRestore(root: Node): Element[] {
  const elements = getQueryElements(root)
  if (root instanceof Element) elements.unshift(root)
  return elements.filter((element: Element) => originalAttributes.has(element))
}

async function translateRoot(root: HTMLElement) {
  const thisRun = ++runId
  translating = true

  try {
    observer?.disconnect()

    if (activeLocale === 'en') {
      restoreEnglish(root)
      return
    }

    const textNodes = collectTextNodes(root)
    const textSources = Array.from(new Set(textNodes.map((node) => originalText.get(node) ?? node.nodeValue ?? '').map((text) => splitWhitespace(text).core).filter(Boolean)))

    const attributeElements = collectAttributeTargets(root)
    const attributeSources: string[] = []

    for (const element of attributeElements) {
      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const current = element.getAttribute(attribute)
        if (!current || !isUsefulText(current)) continue

        const stored = originalAttributes.get(element) ?? {}
        if (stored[attribute] === undefined) stored[attribute] = current
        originalAttributes.set(element, stored)
        attributeSources.push(splitWhitespace(stored[attribute]).core)
      }
    }

    const uniqueSources = Array.from(new Set([...textSources, ...attributeSources])).filter(Boolean)
    if (!uniqueSources.length) return

    const translations = await requestTranslations(uniqueSources, activeLocale)
    if (thisRun !== runId) return

    translating = true

    for (const node of textNodes) {
      const source = originalText.get(node)
      if (source === undefined) continue
      const { leading, core, trailing } = splitWhitespace(source)
      const translated = translations[core]
      if (!translated) continue
      const next = `${leading}${translated}${trailing}`
      node.nodeValue = next
      lastTranslatedText.set(node, next)
    }

    for (const element of attributeElements) {
      const stored = originalAttributes.get(element)
      if (!stored) continue
      const last = lastTranslatedAttributes.get(element) ?? {}

      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const source = stored[attribute]
        if (!source) continue
        const { leading, core, trailing } = splitWhitespace(source)
        const translated = translations[core]
        if (!translated) continue
        const next = `${leading}${translated}${trailing}`
        element.setAttribute(attribute, next)
        last[attribute] = next
      }

      lastTranslatedAttributes.set(element, last)
    }
  } catch (error) {
    console.error('[Mandi Setu] Global translation failed:', error)
  } finally {
    translating = false
    observer?.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    })
  }
}

function schedule(root: HTMLElement) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void translateRoot(root)
  }, 120)
}

export function setGlobalLocale(locale: GlobalLocale) {
  activeLocale = locale
  const root = document.body
  if (!root) return

  schedule(root)
}

export function startGlobalTranslator() {
  if (typeof window === 'undefined' || !document.body) return () => undefined
  if (observer) return () => observer?.disconnect()

  observer = new MutationObserver((mutations) => {
    if (translating) return

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target as Text
        const current = node.nodeValue ?? ''
        const previousTranslated = lastTranslatedText.get(node)

        if (activeLocale !== 'en' && previousTranslated && current !== previousTranslated) {
          originalText.set(node, current)
          lastTranslatedText.delete(node)
        } else if (!originalText.has(node)) {
          originalText.set(node, current)
        }

        schedule(document.body)
        return
      }

      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        const element = mutation.target
        const stored = originalAttributes.get(element) ?? {}
        const last = lastTranslatedAttributes.get(element) ?? {}
        const attribute = mutation.attributeName
        if (attribute) {
          const current = element.getAttribute(attribute) ?? ''
          if (activeLocale !== 'en' && last[attribute] && current !== last[attribute]) {
            stored[attribute] = current
            delete last[attribute]
          } else if (stored[attribute] === undefined) {
            stored[attribute] = current
          }
          originalAttributes.set(element, stored)
        }
        schedule(document.body)
        return
      }

      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        schedule(document.body)
        return
      }
    }
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
  })

  return () => {
    observer?.disconnect()
    observer = null
  }
}
