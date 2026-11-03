from pathlib import Path
import ctypes
import sys
import traceback
from ctypes import wintypes

import webview


BASE_DIR = Path(__file__).resolve().parent
PAGE = BASE_DIR / "ui" / "index.html"
LOG_FILE = BASE_DIR / "Forumnik_error.log"


class AppAPI:
    """Small Python API used by the JavaScript interface."""

    def __init__(self) -> None:
        self.window = None

    def save_text_file(self, text: str, filename: str) -> dict:
        """Show a native Save dialog and write the complaint as UTF-8 text."""
        if self.window is None:
            return {"ok": False, "error": "Окно программы ещё не готово."}
        try:
            selected = self.window.create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=Path(str(filename)).name,
                file_types=("Text files (*.txt)",),
            )
            if not selected:
                return {"ok": False, "cancelled": True}
            target = selected[0] if isinstance(selected, (list, tuple)) else selected
            Path(target).write_text(str(text), encoding="utf-8-sig")
            return {"ok": True, "path": str(target)}
        except Exception as error:
            return {"ok": False, "error": str(error)}

    def copy_text(self, text: str) -> dict:
        """Copy text to the Windows clipboard as Unicode (CF_UNICODETEXT)."""
        if sys.platform != "win32":
            return {
                "ok": False,
                "error": "Автоматическое копирование доступно в Windows.",
            }

        user32 = ctypes.WinDLL("user32", use_last_error=True)
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

        user32.OpenClipboard.argtypes = [wintypes.HWND]
        user32.OpenClipboard.restype = wintypes.BOOL
        user32.EmptyClipboard.argtypes = []
        user32.EmptyClipboard.restype = wintypes.BOOL
        user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
        user32.SetClipboardData.restype = wintypes.HANDLE
        user32.CloseClipboard.argtypes = []
        user32.CloseClipboard.restype = wintypes.BOOL

        kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
        kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
        kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
        kernel32.GlobalLock.restype = ctypes.c_void_p
        kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
        kernel32.GlobalUnlock.restype = wintypes.BOOL

        # CF_UNICODETEXT = 13; GMEM_MOVEABLE = 0x0002.
        clipboard_format = 13
        movable_memory = 0x0002
        buffer = ctypes.create_unicode_buffer(str(text))
        size = ctypes.sizeof(buffer)
        memory = kernel32.GlobalAlloc(movable_memory, size)
        if not memory:
            return {"ok": False, "error": "Не удалось выделить память для буфера обмена."}

        pointer = kernel32.GlobalLock(memory)
        if not pointer:
            return {"ok": False, "error": "Не удалось подготовить буфер обмена."}

        ctypes.memmove(pointer, ctypes.addressof(buffer), size)
        kernel32.GlobalUnlock(memory)

        if not user32.OpenClipboard(None):
            return {"ok": False, "error": "Не удалось открыть буфер обмена. Попробуй ещё раз."}

        try:
            if not user32.EmptyClipboard():
                return {"ok": False, "error": "Не удалось очистить буфер обмена."}
            if not user32.SetClipboardData(clipboard_format, memory):
                return {"ok": False, "error": "Не удалось записать текст в буфер обмена."}
            # Windows owns the memory after SetClipboardData succeeds.
            memory = None
            return {"ok": True}
        finally:
            user32.CloseClipboard()


def main() -> None:
    if not PAGE.is_file():
        raise FileNotFoundError(f"Не найден интерфейс программы: {PAGE}")

    api = AppAPI()
    window = webview.create_window(
        title="Forumnik 1.3",
        url=PAGE.as_uri(),
        js_api=api,
        width=1180,
        height=820,
        min_size=(900, 650),
        background_color="#0b1220",
    )
    api.window = window
    webview.start(debug=False)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        details = traceback.format_exc()
        LOG_FILE.write_text(details, encoding="utf-8")
        print("\nНе удалось запустить Forumnik. Подробности ошибки:")
        print(details)
        print(f"Журнал сохранён: {LOG_FILE}")
        raise
