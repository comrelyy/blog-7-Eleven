import { createInstallationToken, getInstallationId, signAppJwt } from './github-client'
import { GITHUB_CONFIG } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'
const LEGACY_PRIVATE_KEY_CACHE_KEY = 'github_private_key'

// 续签提前量：到期前 5 分钟视为"快过期"，主动重签发
const RENEW_THRESHOLD_MS = 5 * 60 * 1000

type CachedToken = { token: string; expiresAt: string }

// 清掉前一版本可能写入 sessionStorage 的 PEM 残留
if (typeof sessionStorage !== 'undefined') {
	try {
		sessionStorage.removeItem(LEGACY_PRIVATE_KEY_CACHE_KEY)
	} catch {}
}

function getTokenFromCache(): CachedToken | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		const raw = sessionStorage.getItem(GITHUB_TOKEN_CACHE_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw)
		if (typeof parsed?.token !== 'string' || typeof parsed?.expiresAt !== 'string') return null
		return parsed
	} catch {
		return null
	}
}

function saveTokenToCache(record: CachedToken): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(GITHUB_TOKEN_CACHE_KEY, JSON.stringify(record))
	} catch (error) {
		console.error('Failed to save token to cache:', error)
	}
}

function clearTokenCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_TOKEN_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear token cache:', error)
	}
}

function isTokenFresh(record: CachedToken | null): record is CachedToken {
	if (!record) return false
	const expiresAtMs = Date.parse(record.expiresAt)
	if (Number.isNaN(expiresAtMs)) return false
	return expiresAtMs - Date.now() > RENEW_THRESHOLD_MS
}

export function clearAllAuthCache(): void {
	clearTokenCache()
}

async function issueAndCacheToken(privateKey: string): Promise<CachedToken> {
	const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
	const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
	const record = await createInstallationToken(jwt, installationId)
	saveTokenToCache(record)
	return record
}

export async function generateAndCacheToken(): Promise<void> {
	const privateKey = useAuthStore.getState().privateKey
	if (!privateKey) return

	try {
		await issueAndCacheToken(privateKey)
	} catch (error) {
		console.error('Failed to generate and cache token:', error)
	}
}

export function hasAuth(): boolean {
	return isTokenFresh(getTokenFromCache())
}

/**
 * 统一的认证 Token 获取
 * - 缓存内 token 未到 5 分钟窗口直接复用
 * - 快过期且内存里仍有 PEM，自动续签
 * - 已过期且 PEM 不在内存，抛错提示重新导入
 */
export async function getAuthToken(): Promise<string> {
	const cached = getTokenFromCache()
	if (isTokenFresh(cached)) {
		return cached.token
	}

	const privateKey = useAuthStore.getState().privateKey
	if (!privateKey) {
		clearTokenCache()
		throw new Error('密钥已过期或未导入，请重新在首页导入 .pem')
	}

	toast.info(cached ? '令牌即将到期，正在续签...' : '正在签发令牌...')
	const fresh = await issueAndCacheToken(privateKey)
	return fresh.token
}
