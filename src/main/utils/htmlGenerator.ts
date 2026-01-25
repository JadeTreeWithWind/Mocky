import { OpenAPIV3 } from 'openapi-types'

/**
 * Redoc HTML 生成工具
 * 負責將 OpenAPI Spec 轉換為包含 Redoc UI 的完整 HTML 字串
 */

/**
 * 生成 Redoc 靜態文檔 HTML
 * @param {OpenAPIV3.Document} spec - OpenAPI Specification 物件
 * @param {string} title - 文檔標題
 * @returns {string} 完整的 HTML 字串
 */
export const generateRedocHtml = (
  spec: OpenAPIV3.Document,
  title: string,
  redocScript: string
): string => {
  const specJson = JSON.stringify(spec)

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script>
      ${redocScript}
    </script>
    <script>
      const spec = ${specJson};
      Redoc.init(spec, {
        scrollYOffset: 50
      }, document.getElementById('redoc-container'));
    </script>
  </body>
</html>`
}
