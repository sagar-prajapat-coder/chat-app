export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fistAndLastInitials = (name) => {
  if (!name) return "";
  const words = name.trim().split(" ");
  const first = words[0]?.charAt(0)?.toUpperCase() || "";
  const last = words.length > 1 ? words[words.length - 1]?.charAt(0)?.toUpperCase() : "";
  return first + last;
}