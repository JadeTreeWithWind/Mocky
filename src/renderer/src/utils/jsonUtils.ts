/**
 * 驗證字串是否為有效的 JSON 格式
 * @param content - 待驗證的字串
 * @returns 錯誤訊息 (若無錯誤則為 null)
 */
export const validateJSON = (content: string): string | null => {
  if (!content.trim()) {
    return null
  }
  try {
    JSON.parse(content)
    return null
  } catch (e: unknown) {
    if (e instanceof Error) {
      return e.message
    }
    return 'Invalid JSON format'
  }
}

/**
 * 格式化 JSON 字串
 * @param content - 待格式化的 JSON 字串
 * @returns 格式化後的字串，若失敗則拋出錯誤
 */
export const prettifyJSON = (content: string): string => {
  const jsonObj = JSON.parse(content)
  return JSON.stringify(jsonObj, null, 2)
}
