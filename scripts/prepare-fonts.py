"""Prepare self-hosted WOFF2 from one reviewed registry entry per font.
Build tools: fonttools 4.68.0 + brotli 1.2.1 (not runtime dependencies).
Usage: python scripts/prepare-fonts.py SOURCE_CACHE assets/fonts/static-sources.json
Existing hash-verified WOFF2 files are reused. Pass --rebuild to regenerate all.
"""
import copy
import hashlib
import json
from pathlib import Path
import re
import sys
import urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont

root=Path(__file__).resolve().parents[1]
sources=Path(sys.argv[1]); sources.mkdir(parents=True,exist_ok=True)
manifest=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8-sig'))
catalog_path=root/'public/fonts/catalog.json'
previous={f['id']:f for f in json.loads(catalog_path.read_text(encoding='utf-8'))} if catalog_path.exists() else {}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fetch(url,destination,sha):
    assert re.match(r'https://raw\.githubusercontent\.com/[^/]+/[^/]+/[0-9a-f]{40}/',url), 'Use a pinned reviewed source'
    if not destination.exists():
        with urllib.request.urlopen(url,timeout=120) as response:
            destination.write_bytes(response.read())
    assert digest(destination).lower()==sha.lower(), f'Hash mismatch: {destination}'

def rename(font,family):
    # Preserve copyright/license records; replace all primary names, including
    # localized and WWS names. RFNs are never used by derivatives.
    names={1:family,2:'Regular',3:family+'-Regular',4:family,6:family.replace(' ','')+'-Regular',16:family,17:'Regular',18:family,21:family,22:'Regular',25:family.replace(' ','')}
    for record in list(font['name'].names):
        if record.nameID in names:
            font['name'].setName(names[record.nameID],record.nameID,record.platformID,record.platEncID,record.langID)
    for ident,value in names.items():
        font['name'].setName(value,ident,3,1,0x409)

catalog=[]
for entry in manifest:
    ident=entry['id']
    assert re.fullmatch(r'[a-z0-9-]+',ident) and entry['license']=='OFL-1.1' and entry['format']=='woff2'
    folder=root/'public/fonts'/ident; folder.mkdir(parents=True,exist_ok=True)
    license_path=folder/'OFL.txt'
    fetch(entry['licenseSource'],license_path,entry['licenseSha256'])
    assert 'SIL OPEN FONT LICENSE Version 1.1' in license_path.read_text(encoding='utf-8')
    full,sample_path=folder/'font.woff2',folder/'sample.woff2'
    old=previous.get(ident,{})
    reuse=('--rebuild' not in sys.argv and old.get('sourceSha256')==entry['sourceSha256'] and full.exists() and sample_path.exists() and digest(full)==old.get('sha256') and digest(sample_path)==old.get('sampleSha256') and old.get('family')==entry['family'])
    if reuse:
        font=TTFont(full,recalcTimestamp=False)
    else:
        source=sources/(ident+'.ttf'); fetch(entry['source'],source,entry['sourceSha256'])
        font=TTFont(source,recalcTimestamp=False); original_coverage=set(font.getBestCmap())
        if 'fvar' in font:
            font=instantiateVariableFont(font,{'wght':400},inplace=True)
        rename(font,entry['family']); font.flavor='woff2'; font.save(full)
        assert set(TTFont(full).getBestCmap())==original_coverage
        sample=copy.deepcopy(font); rename(sample,entry['family']+' Sample')
        options=subset.Options(); options.name_IDs=['*']; options.name_legacy=True; options.name_languages=['*']
        sub=subset.Subsetter(options=options); sub.populate(text=entry['sampleText']); sub.subset(sample); sample.save(sample_path)
    characters=''.join(chr(code) for code in sorted(font.getBestCmap()))
    for text in ([entry['sampleText'],'林雨晴','陈思远','张晓月'] if entry['language']=='zh' else [entry['sampleText'],'Vivian','Alexander']):
        assert all(char in characters for char in text), f'Missing required name: {ident}/{text}'
    coverage_path=folder/'coverage.json'; coverage_path.write_text(json.dumps(characters,ensure_ascii=False)+'\n',encoding='utf-8')
    source_copyright=sorted(set(record.toUnicode() for record in font['name'].names if record.nameID==0))
    languages=(['zh-Hans'] if entry['language']=='zh' else [])+(['en'] if all(ch in characters for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') else [])
    record={**entry,'resource':f'fonts/{ident}/font.woff2','sampleResource':f'fonts/{ident}/sample.woff2','licenseFile':f'fonts/{ident}/OFL.txt','coverageResource':f'fonts/{ident}/coverage.json','languages':languages,'systemFallback':['Microsoft YaHei','PingFang SC','Noto Sans CJK SC','sans-serif'],'weight':400,'glyphCount':len(characters),'bytes':full.stat().st_size,'sampleBytes':sample_path.stat().st_size,'coverageBytes':coverage_path.stat().st_size,'sha256':digest(full),'sampleSha256':digest(sample_path),'coverageSha256':digest(coverage_path),'sourceFontCopyright':source_copyright,'permissions':{'commercial':True,'webEmbedding':True,'androidBundling':True,'redistribution':True}}
    catalog.append(record)
    (folder/'NOTICE.txt').write_text((entry['copyright']+'\n\nOriginal font copyright metadata:\n'+'\n'.join(source_copyright)+'\n\nSource: '+entry['source']+'\nLicense: SIL OFL 1.1, see OFL.txt.\nDerived internal names: '+entry['family']+' / '+entry['family']+' Sample.\nWeight instantiated at 400 where applicable. Full font retains upstream cmap.\nSample subset contains only: '+entry['sampleText']+'\n').replace('\r\n','\n').replace('\r','\n'),encoding='utf-8',newline='\n')
    print(json.dumps({'id':ident,'bytes':record['bytes'],'glyphs':len(characters),'reused':reuse}),flush=True)
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
