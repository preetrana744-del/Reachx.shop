from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1]; errors=[];titles=set(); pages=list(R.glob('*.html'))+list((R/'blog').glob('*.html'));urls={n.text for n in ET.parse(R/'sitemap.xml').iter() if n.tag.endswith('}loc')}
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='a' and 'href' in a:self.links.append(a['href'])
for p in pages:
 s=p.read_text();rel=p.relative_to(R).as_posix();title=re.search('<title>(.*?)</title>',s,re.S)[1];assert title not in titles,rel;titles.add(title)
 assert len(re.findall('<h1\\b',s))==1,rel
 canonical=re.search('rel="canonical" href="([^"]+)"',s)[1];assert canonical in urls,(rel,canonical)
 for raw in re.findall('<script type="application/ld\\+json">(.*?)</script>',s,re.S):json.loads(raw)
 parser=Links();parser.links=[];parser.ids=set();parser.feed(s)
 for link in parser.links:
  u=urlsplit(link)
  if u.scheme and u.netloc!='reachx.shop':continue
  if u.scheme in ['mailto','tel']:continue
  target=(R/unquote(u.path).lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append((rel,link))
  if target==p and u.fragment and unquote(u.fragment) not in parser.ids:errors.append((rel,link,'missing anchor'))
assert not errors,errors
assert len(urls)==len(pages),(len(urls),len(pages))
print('PASS',len(pages),'pages: unique titles, headings, JSON-LD, sitemap, internal destinations and anchors')
