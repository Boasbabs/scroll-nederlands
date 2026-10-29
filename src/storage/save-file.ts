// Saves a file to the learner's computer the way a web page does: a link with
// `download`, clicked. Chrome treats it as its own download, so the extension
// needs no downloads permission. Browser only.

export function saveFile(name: string, file: Blob): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // The download has read the file well before then.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
