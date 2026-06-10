(function (global) {
  function sanitizeFilename(value) {
    return String(value || "vibereading-note")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "vibereading-note";
  }

  function formatDate(date) {
    var d = date instanceof Date ? date : new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    var h = String(d.getHours()).padStart(2, "0");
    var min = String(d.getMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + day + " " + h + ":" + min;
  }

  function buildMarkdown(options) {
    var bookTitle = options.bookTitle || "阅读边注";
    var author = options.author || "";
    var stageLabel = options.stageLabel || "";
    var stageSubtitle = options.stageSubtitle || "";
    var note = String(options.note || "").trim();
    var createdAt = formatDate(options.createdAt);
    var lines = [
      "# " + bookTitle + " 边注",
      "",
      author ? "- 作者：" + author : "",
      stageLabel ? "- 阅读阶段：" + stageLabel : "",
      stageSubtitle ? "- 阶段提示：" + stageSubtitle : "",
      "- 保存时间：" + createdAt,
      "",
      "## 边注",
      "",
      note || "（空）",
      ""
    ];
    return lines.filter(function (line, index) {
      return line !== "" || lines[index - 1] !== "";
    }).join("\n");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 800);
  }

  function saveMarkdown(options) {
    var note = String(options.note || "").trim();
    if (!note) {
      return { ok: false, message: "边注还是空的，先写一点再保存。" };
    }
    var now = options.createdAt instanceof Date ? options.createdAt : new Date();
    var prefix = sanitizeFilename((options.filenamePrefix || options.bookTitle || "vibereading") + "-note-" + now.getTime());
    var markdown = buildMarkdown(Object.assign({}, options, { createdAt: now }));
    downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), prefix + ".md");
    return { ok: true, message: "边注已保存为 Markdown 文本。" };
  }

  global.VibeReadingNoteShare = {
    buildMarkdown: buildMarkdown,
    sanitizeFilename: sanitizeFilename,
    saveMarkdown: saveMarkdown
  };
})(typeof window !== "undefined" ? window : globalThis);
