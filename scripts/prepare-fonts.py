"""Build self-hosted WOFF2 + tiny picker samples from pinned Google Fonts TTFs.

Build tool only: fonttools[woff] and brotli. No font runtime dependency.
Usage: python scripts/prepare-fonts.py SOURCE_DIRECTORY SOURCE_MANIFEST
"""
import copy
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
sources = Path(sys.argv[1])
sources.mkdir(parents=True, exist_ok=True)
manifest = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8-sig'))
specs = [
    ('mashanzheng', 'Ma Shan Zheng', 'zh', 'calligraphy', '中文书法'),
    ('longcang', 'Long Cang', 'zh', 'handwriting', '中文手写'),
    ('zhimangxing', 'Zhi Mang Xing', 'zh', 'cursive', '中文草书'),
    ('caveat', 'Caveat', 'en', 'handwriting', '英文手写'),
    ('dancingscript', 'Dancing Script', 'en', 'cursive', '英文连笔'),
    ('pacifico', 'Pacifico', 'en', 'display', '英文展示'),
]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def rename(font, family):
    # All converted/subset derivatives have a distinct primary name, including
    # Dancing Script, whose upstream license has a Reserved Font Name.
    names = {1: family, 2: 'Regular', 3: family + '-Regular', 4: family,
             6: family.replace(' ', '') + '-Regular', 16: family, 17: 'Regular'}
    for record in list(font['name'].names):
        if record.nameID in names:
            font['name'].setName(names[record.nameID], record.nameID,
                                 record.platformID, record.platEncID, record.langID)
    for ident, value in names.items():
        font['name'].setName(value, ident, 3, 1, 0x409)

catalog = []
for ident, name, language, style, label in specs:
    provenance = next(item for item in manifest if item['id'] == ident)
    source = sources / (ident + '.ttf')
    if not source.exists():
        assert provenance['source'].startswith('https://raw.githubusercontent.com/google/fonts/')
        with urllib.request.urlopen(provenance['source']) as response:
            source.write_bytes(response.read())
    assert digest(source).lower() == provenance['sourceSha256'].lower()
    font = TTFont(source, recalcTimestamp=False)
    if 'fvar' in font:
        font = instantiateVariableFont(font, {'wght': 400}, inplace=True)
    original_coverage = set(font.getBestCmap())
    folder = root / 'public' / 'fonts' / ident
    family = 'Signature Studio DS' if ident == 'dancingscript' else 'Signature Studio ' + name
    rename(font, family)
    font.flavor = 'woff2'
    full = folder / 'font.woff2'
    font.save(full)
    assert set(TTFont(full).getBestCmap()) == original_coverage
    sample = copy.deepcopy(font)
    rename(sample, family + ' Sample')
    sample_text = '林雨晴' if language == 'zh' else 'Vivian'
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(text=sample_text)
    sub.subset(sample)
    sample_path = folder / 'sample.woff2'
    sample.save(sample_path)
    catalog.append(dict(id=ident, name=name, family=family, language=language,
                        style=style, styleLabel=label, sampleText=sample_text,
                        resource=f'fonts/{ident}/font.woff2',
                        sampleResource=f'fonts/{ident}/sample.woff2',
                        license='OFL-1.1', licenseFile=f'fonts/{ident}/OFL.txt',
                        fallback=['mashanzheng'] if language == 'en' else [],
                        systemFallback=['Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'sans-serif'],
                        coverage=''.join(chr(code) for code in sorted(original_coverage)), weight=400,
                        bytes=full.stat().st_size, sampleBytes=sample_path.stat().st_size,
                        sha256=digest(full), sampleSha256=digest(sample_path), **{
                            k: v for k, v in provenance.items() if k != 'id'
                        }))
    (folder / 'NOTICE.txt').write_text(
        provenance['copyright'] + '\n\nSource: ' + provenance['source'] +
        '\nLicense: SIL OFL 1.1, see OFL.txt.\n' +
        'Derived WOFF2 names: ' + family + ' / ' + family + ' Sample.\n' +
        'Weight instantiated at 400 where applicable. Full font retains upstream cmap.\n' +
        'Sample subset contains only: ' + sample_text + '\n', encoding='utf-8')
(root / 'public' / 'fonts' / 'catalog.json').write_text(
    json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps([{k: f[k] for k in ('id', 'bytes', 'sampleBytes')} for f in catalog]))
