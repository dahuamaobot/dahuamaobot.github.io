const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const generateBtn = document.getElementById("generateBtn");
const result = document.getElementById("result");
const toast = document.getElementById("toast");

let uploadedFile = null;

const previewPlaceholder = preview.innerHTML;
const resultPlaceholder = result?.innerHTML;

function restoreResultStructure() {
  if (!result || !resultPlaceholder) return;
  result.innerHTML = resultPlaceholder;
}

function showPreview(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    preview.innerHTML = "";
    const img = document.createElement("img");
    img.src = event.target.result;
    img.alt = "上传照片预览";
    preview.appendChild(img);
  };

  reader.readAsDataURL(file);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("toast--visible");

  window.setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 3200);
}

function setResultLoading(loading) {
  if (!result) return;
  const loader = result.querySelector(".result-loader");
  const placeholder = result.querySelector(".result-placeholder");

  if (loading) {
    result.setAttribute("aria-busy", "true");
    if (loader) {
      loader.hidden = false;
    }
    if (placeholder) {
      placeholder.style.opacity = "0.6";
    }
  } else {
    result.removeAttribute("aria-busy");
    if (loader) {
      loader.hidden = true;
    }
    if (placeholder) {
      placeholder.style.opacity = "";
    }
  }
}

function renderResultImage(src) {
  if (!result) return;
  result.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "result-image";

  const img = document.createElement("img");
  img.src = src;
  img.alt = "生成的 Apple 高管风肖像";

  wrapper.appendChild(img);
  result.appendChild(wrapper);
}

async function handleGenerate() {
  if (!uploadedFile) {
    showToast("请先上传一张照片，我们将为你生成 Apple 风肖像。");
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "生成中...";
    restoreResultStructure();
    setResultLoading(true);
    showToast("正在生成高端肖像，请稍候...");

    const formData = new FormData();
    formData.append("photo", uploadedFile);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "生成失败，请稍后再试。");
    }

    const data = await response.json();
    const imageSrc = data.imageUrl || data.imageDataUrl || data.image_base64;

    if (!imageSrc) {
      throw new Error("生成成功，但未返回图片。请稍后再试。");
    }

    const finalSrc =
      imageSrc.startsWith("data:") || imageSrc.startsWith("http")
        ? imageSrc
        : `data:image/png;base64,${imageSrc}`;

    renderResultImage(finalSrc);
    showToast("生成完成！欢迎下载你的高端肖像。");
  } catch (error) {
    if (result && resultPlaceholder) {
      result.innerHTML = resultPlaceholder;
    }
    showToast(error.message);
    console.error(error);
  } finally {
    setResultLoading(false);
    generateBtn.disabled = false;
    generateBtn.textContent = "生成 Apple 高管风肖像";
  }
}

fileInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    preview.innerHTML = previewPlaceholder;
    uploadedFile = null;
    if (result && resultPlaceholder) {
      result.innerHTML = resultPlaceholder;
    }
    return;
  }

  uploadedFile = file;
  showPreview(file);
});

generateBtn?.addEventListener("click", () => {
  handleGenerate();
});

["dragenter", "dragover"].forEach((type) => {
  preview.addEventListener(type, (event) => {
    event.preventDefault();
    preview.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((type) => {
  preview.addEventListener(type, (event) => {
    event.preventDefault();
    preview.classList.remove("is-dragging");
  });
});

preview.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];

  if (!file) {
    return;
  }

  fileInput.files = event.dataTransfer.files;
  uploadedFile = file;
  showPreview(file);
});
