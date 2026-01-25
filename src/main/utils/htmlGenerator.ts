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
    <title>${title} | Mocky Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      :root {
        --header-height: 60px;
        --bg-color: #ffffff; /* Clean White Background for professionalism */
        --header-bg: #1f2937; /* Dark Gray Header */
        --text-color: #111827; /* Near Black */
        --border-color: #e5e7eb;
        --primary-brand: #3b82f6; /* Trustworthy Blue */
      }
      body {
        margin: 0;
        margin-top: var(--header-height);
        padding: 0;
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* Professional Solid Header */
      .mocky-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: var(--header-height);
        background-color: var(--header-bg);
        border-bottom: 1px solid #374151;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 100;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mocky-logo {
        font-weight: 700;
        font-size: 18px;
        color: #f3f4f6; /* Light Gray Text */
        letter-spacing: -0.25px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        -webkit-text-fill-color: initial;
      }

      .separator {
        width: 1px;
        height: 16px;
        background-color: #4b5563; /* Header Separator */
      }

      .doc-title {
        font-size: 14px;
        font-weight: 500;
        color: #d1d5db; /* Gray 300 */
      }

      .header-right {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
  </head>
  <body>
    <header class="mocky-header">
      <div class="header-left">
        <span class="mocky-logo">Mocky</span>
        <div class="separator"></div>
        <span class="doc-title">${title}</span>
      </div>
      <div class="header-right">
        Powered by Mocky
      </div>
    </header>

    <div id="redoc-container"></div>

    <script>
      ${redocScript}
    </script>
    <script>
      const spec = ${specJson};
      const options = {
        scrollYOffset: 60,
        hideDownloadButton: true,
        expandResponses: '200,201',
        theme: {
          colors: {
            primary: {
              main: '#3b82f6' // Standard Blue
            },
            success: {
              main: '#10b981' // Emerald
            },
            http: {
              get: '#0ea5e9', // Sky
              post: '#10b981', // Emerald
              put: '#f59e0b', // Amber
              delete: '#ef4444' // Red
            }
          },
          sidebar: {
            backgroundColor: '#f8fafc', // Slate 50 (Very light gray)
            width: '260px',
            textColor: '#334155', // Slate 700
            activeTextColor: '#3b82f6', // Primary Blue
            groupItems: {
              textTransform: 'uppercase',
              fontWeight: '600',
              textColor: '#64748b' // Slate 500
            }
          },
          rightPanel: {
            backgroundColor: '#1e293b', // Slate 800 (Dark panel for contrast)
            width: '40%',
            textColor: '#f1f5f9' // Slate 100
          },
          typography: {
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            headings: {
              fontFamily: '"Inter", sans-serif',
              fontWeight: '700',
              lineHeight: '1.3',
              color: '#111827' // Gray 900
            },
            code: {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px'
            }
          },
          logo: {
            maxHeight: '0px'
          }
        }
      };
      Redoc.init(spec, options, document.getElementById('redoc-container'));
    </script>
  </body>
</html>`
}
