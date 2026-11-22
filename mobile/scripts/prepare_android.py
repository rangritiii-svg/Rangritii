"""Turns the stock Capacitor Android project into the Rangritii app.

Run from mobile/ after `npx cap add android` (CI does this on every build), so the
generated android/ folder never has to be committed:
  - our MainActivity (Android back button goes back a page)
  - fixed debug key + release signing from GitHub secrets + CI version numbers
  - launcher icons and splash made from ../public/icons/icon-512.png
Needs Pillow (pip install pillow).
"""
import glob
import os
import shutil

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
APP = os.path.join(MOBILE, "android", "app")
RES = os.path.join(APP, "src", "main", "res")
ICON = os.path.join(MOBILE, "..", "public", "icons", "icon-512.png")
BRAND = (0x8B, 0x1E, 0x3F, 255)

# 1. native files
shutil.copy(os.path.join(MOBILE, "native", "MainActivity.java"),
            os.path.join(APP, "src", "main", "java", "com", "rangritii", "app", "MainActivity.java"))
shutil.copy(os.path.join(MOBILE, "native", "debug.keystore"), os.path.join(APP, "debug.keystore"))

# 2. signing + version
gradle_path = os.path.join(APP, "build.gradle")
gradle = open(gradle_path, encoding="utf-8").read()
STOCK = """    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }"""
OURS = """    defaultConfig {
        versionCode project.hasProperty('versionCode') ? project.versionCode.toInteger() : 1
        versionName project.hasProperty('versionName') ? project.versionName : "1.0"
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            def ks = System.getenv('RANGRITII_KEYSTORE_PATH')
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv('RANGRITII_KEYSTORE_PASSWORD')
                keyAlias System.getenv('RANGRITII_KEY_ALIAS') ?: 'rangritii'
                keyPassword System.getenv('RANGRITII_KEY_PASSWORD') ?: System.getenv('RANGRITII_KEYSTORE_PASSWORD')
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig System.getenv('RANGRITII_KEYSTORE_PATH') ? signingConfigs.release : signingConfigs.debug
        }
    }"""
if "signingConfigs" not in gradle:
    if STOCK not in gradle:
        raise SystemExit("build.gradle layout changed — update prepare_android.py")
    open(gradle_path, "w", encoding="utf-8").write(gradle.replace(STOCK, OURS))

# 3. icons + splash
src = Image.open(ICON).convert("RGBA")
inner = src.crop((40, 40, 472, 472))  # artwork without the rounded corners
for name, f in {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}.items():
    d = os.path.join(RES, f"mipmap-{name}")
    size = int(48 * f)
    src.resize((size, size), Image.LANCZOS).save(os.path.join(d, "ic_launcher.png"))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    tile = Image.new("RGBA", (size, size), BRAND)
    art = int(size * 0.86)
    tile.alpha_composite(inner.resize((art, art), Image.LANCZOS), ((size - art) // 2, (size - art) // 2))
    rnd = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rnd.paste(tile, (0, 0), mask)
    rnd.save(os.path.join(d, "ic_launcher_round.png"))
    fg_size = int(108 * f)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    art = int(fg_size * 0.62)
    fg.alpha_composite(inner.resize((art, art), Image.LANCZOS), ((fg_size - art) // 2, (fg_size - art) // 2))
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))

for p in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    w, h = Image.open(p).size
    splash = Image.new("RGB", (w, h), (255, 255, 255))
    s = int(min(w, h) * 0.28)
    icon = src.resize((s, s), Image.LANCZOS)
    splash.paste(icon, ((w - s) // 2, (h - s) // 2), icon)
    splash.save(p)

bg = os.path.join(RES, "values", "ic_launcher_background.xml")
xml = open(bg, encoding="utf-8").read()
import re
open(bg, "w", encoding="utf-8").write(re.sub(r"#[0-9A-Fa-f]{6}", "#8B1E3F", xml, count=1))

print("Rangritii Android project ready")
