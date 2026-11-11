"""Forumnik 1.5 — настольная программа для подготовки жалоб на форум Radmir.

Интерфейс — HTML/CSS/JavaScript (папка ui), окно — pywebview.
Python отвечает за то, что браузер сам не умеет: файлы данных, буфер обмена,
диалоги, резервные копии, трей, автозапуск и проверку обновлений.
"""
from __future__ import annotations

import ctypes
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import traceback
import urllib.request
import webbrowser
from ctypes import wintypes
from datetime import datetime
from pathlib import Path

import webview

APP_NAME = "Forumnik"
APP_VERSION = "1.5"
RELEASE_API = "https://api.github.com/repos/L1ton47/Forumnik/releases/latest"

BASE_DIR = Path(__file__).resolve().parent
PAGE = BASE_DIR / "ui" / "index.html"
LOG_FILE = BASE_DIR / "Forumnik_error.log"


def data_dir() -> Path:
    root = os.environ.get("APPDATA")
    path = Path(root) / APP_NAME if root else Path.home() / ".forumnik"
    path.mkdir(parents=True, exist_ok=True)
    return path


DATA_DIR = data_dir()
DATA_FILE = DATA_DIR / "data.json"
BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

try:  # трей необязателен
    import pystray
    from PIL import Image, ImageDraw
    TRAY_OK = True
except Exception:  # noqa: BLE001
    TRAY_OK = False


def _dialog(kind: str):
    """Совместимость pywebview 5.x / 6.x: FileDialog.OPEN/SAVE или webview.OPEN_DIALOG/SAVE_DIALOG."""
    enum = getattr(webview, "FileDialog", None)
    if enum is not None:
        return getattr(enum, kind)
    return getattr(webview, f"{kind}_DIALOG")


class AppAPI:
    """API, доступное из JavaScript как window.pywebview.api."""

    def __init__(self) -> None:
        self.window = None
        self._dirty = False
        self._quitting = False
        self._tray = None
        self._lock = threading.Lock()
        self.settings: dict = {}
        self._load_settings_from_disk()

    # ---------- данные ----------
    def _load_settings_from_disk(self) -> None:
        try:
            self.settings = json.loads(DATA_FILE.read_text(encoding="utf-8")).get("settings", {})
        except Exception:  # noqa: BLE001
            self.settings = {}

    def load_data(self):
        try:
            return DATA_FILE.read_text(encoding="utf-8")
        except FileNotFoundError:
            return None
        except Exception:  # noqa: BLE001
            return None

    def save_data(self, text: str) -> dict:
        try:
            parsed = json.loads(text)  # не пишем мусор поверх данных
            with self._lock:
                tmp = DATA_FILE.with_suffix(".tmp")
                tmp.write_text(text, encoding="utf-8")
                tmp.replace(DATA_FILE)
            self.settings = parsed.get("settings", {})
            self._apply_tray()
            return {"ok": True}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    def set_dirty(self, value: bool) -> None:
        self._dirty = bool(value)

    def get_data_info(self) -> dict:
        size = sum(f.stat().st_size for f in DATA_DIR.rglob("*") if f.is_file())
        return {"dir": str(DATA_DIR), "size": round(size / 1024, 1)}

    def open_data_folder(self) -> dict:
        return self._open_path(DATA_DIR)

    def _open_path(self, path: Path) -> dict:
        try:
            if sys.platform == "win32":
                os.startfile(str(path))  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", str(path)])
            else:
                subprocess.Popen(["xdg-open", str(path)])
            return {"ok": True}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    # ---------- файлы ----------
    def save_text_file(self, text: str, filename: str) -> dict:
        if self.window is None:
            return {"ok": False, "error": "Окно программы ещё не готово."}
        try:
            name = Path(str(filename)).name
            types = ("JSON files (*.json)",) if name.lower().endswith(".json") else ("Text files (*.txt)",)
            selected = self.window.create_file_dialog(_dialog("SAVE"), save_filename=name, file_types=types)
            if not selected:
                return {"ok": False, "cancelled": True}
            target = selected[0] if isinstance(selected, (list, tuple)) else selected
            Path(target).write_text(str(text), encoding="utf-8-sig" if types[0].startswith("Text") else "utf-8")
            return {"ok": True, "path": str(target)}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    def open_text_file(self) -> dict:
        if self.window is None:
            return {"ok": False, "error": "Окно программы ещё не готово."}
        try:
            selected = self.window.create_file_dialog(_dialog("OPEN"), file_types=("JSON files (*.json)",))
            if not selected:
                return {"ok": False, "cancelled": True}
            target = selected[0] if isinstance(selected, (list, tuple)) else selected
            return {"ok": True, "text": Path(target).read_text(encoding="utf-8-sig")}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    # ---------- браузер / буфер обмена ----------
    def open_url(self, url: str) -> dict:
        url = str(url)
        if not url.lower().startswith(("http://", "https://")):
            return {"ok": False, "error": "Разрешены только http/https ссылки."}
        try:
            webbrowser.open(url)
            return {"ok": True}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    def copy_text(self, text: str) -> dict:
        """Копирует текст в буфер обмена Windows как Unicode (CF_UNICODETEXT)."""
        if sys.platform != "win32":
            return {"ok": False, "error": "Автоматическое копирование доступно в Windows."}

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

        buffer = ctypes.create_unicode_buffer(str(text))
        size = ctypes.sizeof(buffer)
        memory = kernel32.GlobalAlloc(0x0002, size)  # GMEM_MOVEABLE
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
            if not user32.SetClipboardData(13, memory):  # CF_UNICODETEXT
                return {"ok": False, "error": "Не удалось записать текст в буфер обмена."}
            return {"ok": True}
        finally:
            user32.CloseClipboard()

    # ---------- резервные копии ----------
    def create_backup(self, reason: str = "manual") -> dict:
        try:
            if not DATA_FILE.exists():
                return {"ok": False, "error": "Данных для копии пока нет."}
            reason = "".join(c for c in str(reason) if c.isalnum())[:12] or "manual"
            name = f"forumnik_{datetime.now():%Y%m%d_%H%M%S}_{reason}.json"
            shutil.copy2(DATA_FILE, BACKUP_DIR / name)
            self._trim_backups()
            return {"ok": True, "name": name}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    def _trim_backups(self) -> None:
        keep = int(self.settings.get("backup", {}).get("keep", 10) or 10)
        files = sorted(BACKUP_DIR.glob("forumnik_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        for old in files[max(1, keep):]:
            try:
                old.unlink()
            except OSError:
                pass

    def list_backups(self) -> list:
        files = sorted(BACKUP_DIR.glob("forumnik_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        labels = {"start": "при запуске", "exit": "при выходе", "manual": "вручную", "beforerestore": "перед восстановлением"}
        out = []
        for p in files:
            parts = p.stem.split("_")
            reason = labels.get(parts[-1], parts[-1])
            out.append({
                "name": p.name,
                "created": datetime.fromtimestamp(p.stat().st_mtime).strftime("%d.%m.%Y %H:%M:%S"),
                "size": round(p.stat().st_size / 1024, 1),
                "reason": reason,
            })
        return out

    def _backup_path(self, name: str) -> Path | None:
        path = (BACKUP_DIR / Path(str(name)).name)
        return path if path.is_file() and path.parent == BACKUP_DIR else None

    def restore_backup(self, name: str) -> dict:
        path = self._backup_path(name)
        if path is None:
            return {"ok": False, "error": "Копия не найдена."}
        try:
            text = path.read_text(encoding="utf-8")
            json.loads(text)
            self.create_backup("beforerestore")
            with self._lock:
                DATA_FILE.write_text(text, encoding="utf-8")
            self._load_settings_from_disk()
            return {"ok": True, "text": text}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    def delete_backup(self, name: str) -> dict:
        path = self._backup_path(name)
        if path is None:
            return {"ok": False, "error": "Копия не найдена."}
        path.unlink()
        return {"ok": True}

    # ---------- обновления ----------
    def check_update(self) -> dict:
        try:
            request = urllib.request.Request(RELEASE_API, headers={"User-Agent": f"Forumnik/{APP_VERSION}", "Accept": "application/vnd.github+json"})
            with urllib.request.urlopen(request, timeout=8) as response:  # noqa: S310
                data = json.loads(response.read().decode("utf-8"))
            return {"ok": True, "tag": data.get("tag_name", ""), "name": data.get("name", ""), "body": data.get("body", ""), "url": data.get("html_url", "")}
        except Exception as error:  # noqa: BLE001
            return {"ok": False, "error": str(error)}

    # ---------- автозапуск ----------
    def _run_command(self) -> str:
        if getattr(sys, "frozen", False):
            return f'"{sys.executable}"'
        exe = Path(sys.executable)
        pythonw = exe.with_name("pythonw.exe")
        runner = pythonw if pythonw.exists() else exe
        return f'"{runner}" "{Path(__file__).resolve()}"'

    def get_autostart(self) -> dict:
        if sys.platform != "win32":
            return {"ok": False}
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_READ) as key:
                winreg.QueryValueEx(key, APP_NAME)
                return {"ok": True, "enabled": True}
        except FileNotFoundError:
            return {"ok": True, "enabled": False}
        except OSError:
            return {"ok": True, "enabled": False}

    def set_autostart(self, enabled: bool) -> dict:
        if sys.platform != "win32":
            return {"ok": False, "error": "Автозапуск доступен только в Windows."}
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE) as key:
                if enabled:
                    winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, self._run_command())
                else:
                    try:
                        winreg.DeleteValue(key, APP_NAME)
                    except FileNotFoundError:
                        pass
            return {"ok": True}
        except OSError as error:
            return {"ok": False, "error": str(error)}

    # ---------- трей ----------
    def tray_available(self) -> bool:
        return TRAY_OK

    def _tray_image(self):
        image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((4, 4, 60, 60), radius=14, fill=(76, 141, 255, 255))
        draw.rectangle((22, 16, 30, 48), fill="white")
        draw.rectangle((22, 16, 46, 24), fill="white")
        draw.rectangle((22, 29, 40, 36), fill="white")
        return image

    def _apply_tray(self) -> None:
        wanted = bool(self.settings.get("tray")) and TRAY_OK
        if wanted and self._tray is None:
            menu = pystray.Menu(
                pystray.MenuItem("Открыть Forumnik", lambda: self.show_window(), default=True),
                pystray.MenuItem("Выход", lambda: self.quit_app()),
            )
            self._tray = pystray.Icon(APP_NAME, self._tray_image(), "Forumnik", menu)
            threading.Thread(target=self._tray.run, daemon=True).start()
        elif not wanted and self._tray is not None:
            self._stop_tray()

    def _stop_tray(self) -> None:
        if self._tray is not None:
            try:
                self._tray.stop()
            except Exception:  # noqa: BLE001
                pass
            self._tray = None

    def show_window(self) -> None:
        if self.window is not None:
            self.window.show()
            try:
                self.window.restore()
            except Exception:  # noqa: BLE001
                pass

    def quit_app(self) -> None:
        self._quitting = True
        self._exit_backup()
        self._stop_tray()
        if self.window is not None:
            self.window.destroy()

    # ---------- события окна ----------
    def _exit_backup(self) -> None:
        if self.settings.get("backup", {}).get("onExit", True):
            self.create_backup("exit")

    def on_minimized(self) -> None:
        if self._tray is not None and self.settings.get("tray"):
            self.window.hide()

    def on_closing(self):
        """Возврат False отменяет закрытие окна."""
        if self._quitting:
            return True
        if self._tray is not None and self.settings.get("tray") and self.settings.get("trayOnClose"):
            self.window.hide()
            return False
        if self._dirty and self.settings.get("confirmExit", True):
            ok = self.window.create_confirmation_dialog(
                "Forumnik",
                "Есть незавершённая жалоба. Черновик сохранён, но текст ещё не сформирован.\n\nВыйти из программы?",
            )
            if not ok:
                return False
        self._exit_backup()
        self._stop_tray()
        return True


def main() -> None:
    if not PAGE.is_file():
        raise FileNotFoundError(f"Не найден интерфейс программы: {PAGE}")

    api = AppAPI()
    window = webview.create_window(
        title=f"Forumnik {APP_VERSION}",
        url=PAGE.as_uri(),
        js_api=api,
        width=1240,
        height=840,
        min_size=(980, 680),
        background_color="#0b1220",
    )
    api.window = window
    window.events.closing += api.on_closing
    window.events.minimized += api.on_minimized
    api._apply_tray()
    webview.start(debug=False)
    api._stop_tray()


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
