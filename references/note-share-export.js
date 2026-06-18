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
    var bookTitle = options.bookTitle || "Reading Note";
    var author = options.author || "";
    var stageLabel = options.stageLabel || "";
    var stageSubtitle = options.stageSubtitle || "";
    var note = String(options.note || "").trim();
    var createdAt = formatDate(options.createdAt);
    var lines = [
      "# " + bookTitle + " Note",
      "",
      author ? "- Author: " + author : "",
      stageLabel ? "- Reading stage: " + stageLabel : "",
      stageSubtitle ? "- Stage hint: " + stageSubtitle : "",
      "- Saved at: " + createdAt,
      "",
      "## Note",
      "",
      note || "(empty)",
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
      return { ok: false, message: "The note is empty. Write something before saving." };
    }
    var now = options.createdAt instanceof Date ? options.createdAt : new Date();
    var prefix = sanitizeFilename((options.filenamePrefix || options.bookTitle || "vibereading") + "-note-" + now.getTime());
    var markdown = buildMarkdown(Object.assign({}, options, { createdAt: now }));
    downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), prefix + ".md");
    return { ok: true, message: "The note was saved as Markdown." };
  }

  global.VibeReadingNoteShare = {
    buildMarkdown: buildMarkdown,
    sanitizeFilename: sanitizeFilename,
    saveMarkdown: saveMarkdown
  };
})(typeof window !== "undefined" ? window : globalThis);
