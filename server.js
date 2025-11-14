require("dotenv").config();

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const path = require("path");
const cors = require("cors");

const fetchFn = (...args) =>
  (typeof fetch === "function"
    ? fetch(...args)
    : import("node-fetch").then(({ default: fetchModule }) => fetchModule(...args)));

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const MODEL_PROMPT =
  "Transform the photo into a high-end studio portrait in the style of Apple executive headshots. The subject is shown in a half-body composition, wearing professional yet minimalist attire, with a natural and confident expression. Use soft directional lighting to gently highlight the facial features, leaving subtle catchlights in the eyes. The background should be a smooth gradient in neutral tones (light gray or off-white), with clear separation between subject and background. Add a touch of refined film grain for texture, and keep the atmosphere calm, timeless, and sophisticated. Composition should follow minimalist principles, with negative space and non-centered framing for a modern look. -- no text, logos, distracting objects, clutter.";

async function callGenerationProvider(file) {
  const apiUrl = process.env.NANOBANANA_API_URL;
  const apiKey = process.env.NANOBANANA_API_KEY;

  if (!apiUrl) {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1536548665027-b96d34a005ae?auto=format&fit=crop&w=800&q=80",
      fallback: true,
    };
  }

  const form = new FormData();
  form.append("prompt", MODEL_PROMPT);
  form.append("image", file.buffer, {
    filename: file.originalname || "upload.jpg",
    contentType: file.mimetype || "image/jpeg",
  });

  if (process.env.NANOBANANA_API_NEGATIVE_PROMPT) {
    form.append("negative_prompt", process.env.NANOBANANA_API_NEGATIVE_PROMPT);
  }

  const headers = form.getHeaders();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetchFn(apiUrl, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`生成服务响应异常：${response.status} ${detail}`);
  }

  const data = await response.json().catch(async () => {
    const buffer = await response.arrayBuffer();
    return { image_base64: Buffer.from(buffer).toString("base64") };
  });

  if (data.image_url || data.imageUrl) {
    return { imageUrl: data.image_url || data.imageUrl };
  }

  if (data.image_base64 || data.imageBase64) {
    return { imageDataUrl: `data:image/png;base64,${data.image_base64 || data.imageBase64}` };
  }

  if (Array.isArray(data.output) && data.output.length > 0) {
    return { imageUrl: data.output[0] };
  }

  throw new Error("生成服务未返回可识别的图片字段。");
}

app.post("/api/generate", upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请上传一张照片。" });
    }

    const result = await callGenerationProvider(req.file);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, _next) => {
  console.error(error);
  const message = error.message || "服务器内部错误，请稍后重试。";
  res.status(error.status || 500).json({ message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`nanobanana server is running on http://localhost:${port}`);
});

