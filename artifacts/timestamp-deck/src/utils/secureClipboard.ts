export async function secureWriteClipboard(
  text: string,
  secureMode: boolean
) {
  if (!navigator.clipboard) {
    alert("Clipboard API not available.");
    return;
  }

  if (secureMode) {
    const ok = confirm(
      "Secure Mode is ON.\nThis will copy data to your clipboard.\nContinue?"
    );
    if (!ok) return;
  }

  await navigator.clipboard.writeText(text);
}
