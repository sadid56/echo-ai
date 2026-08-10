import os

from agent.runner import get_system_browser_path


def test_get_system_browser_path_finds_mac_chrome_bundle(monkeypatch):
    monkeypatch.setattr("shutil.which", lambda *_args, **_kwargs: None)
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    def fake_exists(path):
        return path == chrome_path

    monkeypatch.setattr(os.path, "exists", fake_exists)

    assert get_system_browser_path() == chrome_path
