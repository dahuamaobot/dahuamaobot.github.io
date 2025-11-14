# nanobanana · Apple 高管风肖像生成站点

本项目提供 nanobanana 的前端着陆页与后端接入示例，支持上传个人照片并调用生成式模型，将其转换为 Apple 高管风格的高端影棚肖像。

## 功能亮点
- 前端上传卡片支持拖拽/点击并即时预览。
- 一键调用后端接口，展示生成进度与最终结果。
- 模块化文案覆盖卖点、流程、案例、定价与 FAQ。
- 后端示例基于 Express + Multer，预留与第三方模型服务对接的接口。

## 快速开始

```bash
# 安装依赖
npm install

# 复制环境变量样例
cp env.sample .env
# 按实际情况填写 .env 中的 NANOBANANA_API_URL / NANOBANANA_API_KEY

# 启动服务（默认端口 3000）
npm run start
```

启动后访问 `http://localhost:3000` 即可体验前端界面。前端会调用 `/api/generate` 接口获取生成结果。

## 生成模型对接

后端在 `server.js` 中的 `callGenerationProvider` 函数里调用外部推理服务：

- 替换 `NANOBANANA_API_URL` 为真实模型接口地址。
- 如需身份校验，在 `.env` 中填写 `NANOBANANA_API_KEY`，后端会自动附带 `Authorization: Bearer <key>`。
- 接口默认发送字段：
  - `prompt`：固定的 Apple 高管风格描述。
  - `image`：用户上传的原始照片（二进制）。
  - 可选 `negative_prompt`：在 `.env` 中配置 `NANOBANANA_API_NEGATIVE_PROMPT`。
- 支持多种响应格式：`image_url`、`image_base64`、`output[0]` 等。可根据实际服务调整解析逻辑。

若未配置真实接口，后端会返回一张示例图，方便前端调试。

## 开发模式

```bash
npm run dev
```

使用 `nodemon` 监听后端变更。前端页面使用静态资源（`index.html`, `style.css`, `script.js`），可直接编辑刷新查看效果。

## 生产部署建议
- 将静态资源托管至 CDN 或静态站点服务。
- 在生产环境运行 `node server.js`，或部署到支持 Node.js 的平台（如 Vercel、Render、Fly.io 等）。
- 对接真实模型服务时，建议启用请求限流、鉴权以及日志监控。

## 许可证

根据实际业务需求选择合适的许可证或保留所有权利。当前默认保留所有权利。***

