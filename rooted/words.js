// Rooted word data. Hand-checked; add freely.
//
// PARTS: id -> [kind, label, meaning, origin, relatives]
//   kind: "r" root, "p" prefix, "s" suffix (prefixes/suffixes are "hubs": each
//   can be used as a link only once per puzzle)
//   relatives: ids of historically related parts (cognates, or one derived from
//   the other). Linking through a relative is legal and scores 🟨.
//
// WORDS: each word written as its parts, joined with "."
//   "norm"        part whose id is exactly what's written
//   "e=ex"        written "e", but it's the part "ex"
//   "_estr"       glue: shown, but not a part you can travel through
// The pieces must spell the word exactly (tools/check.js verifies this).
window.ROOTED_PARTS = {
  // ---- roots ----
  norm:   ["r", "norm", "rule, carpenter's square", "Latin norma"],
  terr:   ["r", "terr", "earth, land", "Latin terra"],
  terreo: ["r", "terr", "frighten", "Latin terrere"],
  ped:    ["r", "ped", "foot", "Latin pes, pedis", "pod foot"],
  pod:    ["r", "pod", "foot", "Greek pous, podos", "ped foot"],
  foot:   ["r", "foot", "foot", "Old English fōt", "ped pod"],
  paed:   ["r", "ped", "child", "Greek pais, paidos"],
  vid:    ["r", "vid / vis", "see", "Latin videre", "wit ide"],
  wit:    ["r", "wit / wis", "know (\"have seen\")", "Old English witan", "vid ide"],
  ide:    ["r", "ide", "form, look", "Greek idea, from idein \"to see\"", "vid wit"],
  tele:   ["r", "tele", "far", "Greek tēle"],
  phon:   ["r", "phon", "sound, voice", "Greek phōnē"],
  son:    ["r", "son", "sound", "Latin sonus"],
  graph:  ["r", "graph / gram", "write, draw", "Greek graphein"],
  scop:   ["r", "scop / skep", "look at", "Greek skopein", "spec"],
  spec:   ["r", "spec / spic", "look", "Latin specere", "scop"],
  port:   ["r", "port", "carry", "Latin portare"],
  fer:    ["r", "fer", "carry, bear", "Latin ferre", "phor"],
  phor:   ["r", "phor", "carry, bear", "Greek pherein", "fer"],
  dict:   ["r", "dict", "say", "Latin dicere"],
  duc:    ["r", "duc / duct", "lead", "Latin ducere"],
  struct: ["r", "struct", "build", "Latin struere"],
  scrib:  ["r", "scrib / script", "write", "Latin scribere"],
  ject:   ["r", "ject", "throw", "Latin iacere"],
  mit:    ["r", "mit / miss", "send", "Latin mittere"],
  cred:   ["r", "cred", "believe, trust", "Latin credere"],
  aud:    ["r", "aud", "hear", "Latin audire"],
  voc:    ["r", "voc / vok", "voice, call", "Latin vox, vocare"],
  cord:   ["r", "cord / cour", "heart", "Latin cor, cordis", "card"],
  card:   ["r", "cardi", "heart", "Greek kardia", "cord"],
  nov:    ["r", "nov", "new", "Latin novus", "neo"],
  neo:    ["r", "neo", "new", "Greek neos", "nov"],
  nom:    ["r", "nom / noun", "name", "Latin nomen", "onym name"],
  onym:   ["r", "onym", "name", "Greek onyma", "nom name"],
  name:   ["r", "name", "name", "Old English nama", "nom onym"],
  nomos:  ["r", "nom", "law, arrangement", "Greek nomos"],
  dent:   ["r", "dent", "tooth", "Latin dens, dentis", "odont"],
  odont:  ["r", "odont", "tooth", "Greek odous, odontos", "dent"],
  bio:    ["r", "bio / be", "life", "Greek bios", "viv"],
  viv:    ["r", "viv / vit", "live, life", "Latin vivere, vita", "bio"],
  log:    ["r", "log", "word, reason, study", "Greek logos"],
  geo:    ["r", "geo / gee", "earth", "Greek gē"],
  astr:   ["r", "astr / aster", "star", "Greek astēr", "stell star"],
  stell:  ["r", "stell", "star", "Latin stella", "astr star"],
  star:   ["r", "star", "star", "Old English steorra", "astr stell"],
  naut:   ["r", "naut / naus", "ship, sailor", "Greek naus, nautēs"],
  aqu:    ["r", "aqu", "water", "Latin aqua"],
  hydr:   ["r", "hydr", "water", "Greek hydōr", "water"],
  water:  ["r", "water", "water", "Old English wæter", "hydr"],
  chron:  ["r", "chron", "time", "Greek khronos"],
  phot:   ["r", "photo / phos", "light", "Greek phōs, phōtos"],
  therm:  ["r", "therm", "heat", "Greek thermē"],
  micro:  ["r", "micro", "small", "Greek mikros"],
  man:    ["r", "man / main", "hand", "Latin manus"],
  fac:    ["r", "fac / fect / fic", "make, do", "Latin facere", "fy"],
  cap:    ["r", "cap / cept / ceiv", "take, seize", "Latin capere"],
  capit:  ["r", "capit / chief", "head", "Latin caput, capitis"],
  tract:  ["r", "tract / trait", "pull, drag", "Latin trahere"],
  rupt:   ["r", "rupt", "break", "Latin rumpere"],
  flect:  ["r", "flect / flex", "bend", "Latin flectere"],
  pend:   ["r", "pend / pens", "hang, weigh", "Latin pendere"],
  sed:    ["r", "sed / sid / sess", "sit", "Latin sedere", "hedr sit"],
  hedr:   ["r", "hedr", "seat, face", "Greek hedra", "sed sit"],
  sit:    ["r", "sit / seat", "sit", "Old English sittan", "sed hedr"],
  gen:    ["r", "gen", "birth, kind", "Latin genus, Greek genos", "nat"],
  nat:    ["r", "nat", "born", "Latin natus", "gen"],
  cid:    ["r", "cid / cis", "cut, kill", "Latin caedere"],
  mort:   ["r", "mort", "death", "Latin mors, mortis"],
  morph:  ["r", "morph", "shape", "Greek morphē"],
  form:   ["r", "form", "shape", "Latin forma"],
  path:   ["r", "path", "feeling, suffering", "Greek pathos", "pati"],
  psych:  ["r", "psych", "mind, soul", "Greek psykhē"],
  anthrop:["r", "anthrop", "human", "Greek anthrōpos"],
  phil:   ["r", "phil", "love", "Greek philos"],
  phob:   ["r", "phob", "fear", "Greek phobos"],
  dem:    ["r", "dem", "people", "Greek dēmos"],
  crat:   ["r", "crat / crac", "rule, power", "Greek kratos"],
  pan:    ["r", "pan", "all", "Greek pan"],
  poly:   ["r", "poly", "many", "Greek polys"],
  mono:   ["r", "mono", "one, alone", "Greek monos"],
  uni:    ["r", "uni", "one", "Latin unus"],
  tri:    ["r", "tri", "three", "Latin and Greek tri-"],
  quadr:  ["r", "quadr", "four", "Latin quattuor"],
  octo:   ["r", "octo / octa", "eight", "Latin and Greek okto"],
  cent:   ["r", "cent", "hundred", "Latin centum"],
  patr:   ["r", "patr / pater", "father", "Latin pater, Greek patēr", "father"],
  father: ["r", "father", "father", "Old English fæder", "patr"],
  matr:   ["r", "matr / metr / mater", "mother", "Latin mater, Greek mētēr", "mother"],
  mother: ["r", "mother", "mother", "Old English mōdor", "matr"],
  metr:   ["r", "metr / meter", "measure", "Greek metron"],
  fin:    ["r", "fin", "end, limit", "Latin finis"],
  grat:   ["r", "grat / grac / gree", "pleasing, thanks", "Latin gratus"],
  mar:    ["r", "mar", "sea", "Latin mare"],
  sol:    ["r", "sol", "sun", "Latin sol", "heli sun"],
  heli:   ["r", "heli", "sun", "Greek hēlios", "sol sun"],
  sun:    ["r", "sun", "sun", "Old English sunne", "sol heli"],
  lun:    ["r", "lun", "moon", "Latin luna"],
  loc:    ["r", "loc / lieu", "place", "Latin locus"],
  mov:    ["r", "mov / mot / mob", "move", "Latin movere"],
  pos:    ["r", "pos / pon", "put, place", "Latin ponere"],
  thes:   ["r", "thes", "a placing, a putting", "Greek thesis"],
  ten:    ["r", "ten / tain / tin", "hold", "Latin tenere"],
  vert:   ["r", "vert / vers", "turn", "Latin vertere"],
  ven:    ["r", "ven / vent", "come", "Latin venire"],
  ced:    ["r", "ced / ceed / cess", "go, yield", "Latin cedere"],
  cur:    ["r", "cur / curs / cour", "run", "Latin currere"],
  cura:   ["r", "cur(e)", "care", "Latin cura"],
  medi:   ["r", "medi", "middle", "Latin medius"],
  auto:   ["r", "auto", "self", "Greek autos"],
  cycl:   ["r", "cycl", "circle, wheel", "Greek kyklos"],
  ortho:  ["r", "ortho", "straight, correct", "Greek orthos"],
  dox:    ["r", "dox", "opinion, belief", "Greek doxa"],

  // ---- prefixes (hubs) ----
  ab:     ["p", "ab- / abs- / a-", "away from", "Latin"],
  ad:     ["p", "ad- / ac- / af- / a-", "to, toward", "Latin"],
  ante:   ["p", "ante- / an-", "before", "Latin"],
  anti:   ["p", "anti- / ant-", "against, opposite", "Greek"],
  bi:     ["p", "bi-", "two", "Latin"],
  circum: ["p", "circum-", "around", "Latin"],
  con:    ["p", "con- / com- / cor-", "with, together", "Latin"],
  contra: ["p", "contra- / contro-", "against", "Latin"],
  de:     ["p", "de-", "down, away, off", "Latin"],
  dis:    ["p", "dis- / di- / dif-", "apart, not", "Latin"],
  ex:     ["p", "ex- / e- / ef-", "out of", "Latin", "extra exo"],
  extra:  ["p", "extra- / extro-", "outside", "Latin, from ex", "ex exo"],
  exo:    ["p", "exo-", "outside", "Greek, from ex", "ex extra"],
  hyper:  ["p", "hyper-", "over, beyond", "Greek", "super"],
  hypo:   ["p", "hypo-", "under", "Greek", "sub"],
  inN:    ["p", "in- / im- / ig-", "not", "Latin", "an"],
  inI:    ["p", "in- / im-", "in, into", "Latin", "en"],
  en:     ["p", "en- / em-", "in, into", "Greek and French", "inI"],
  an:     ["p", "an- / a-", "not, without", "Greek", "inN"],
  inter:  ["p", "inter- / enter-", "between, among", "Latin"],
  intro:  ["p", "intro-", "inward", "Latin"],
  meta:   ["p", "meta-", "change, beyond", "Greek"],
  ob:     ["p", "ob- / op- / oc- / of- / o-", "against, toward", "Latin"],
  para:   ["p", "para- / par-", "beside, beyond", "Greek"],
  per:    ["p", "per-", "through, thoroughly", "Latin", "peri"],
  peri:   ["p", "peri-", "around", "Greek", "per"],
  post:   ["p", "post-", "after", "Latin"],
  pre:    ["p", "pre-", "before", "Latin"],
  pro:    ["p", "pro- / pur- / por-", "forward, for", "Latin and Greek"],
  re:     ["p", "re-", "back, again", "Latin"],
  se:     ["p", "se-", "apart, without", "Latin"],
  sub:    ["p", "sub- / sup- / suc- / sus- / sou-", "under", "Latin", "hypo"],
  super:  ["p", "super- / sur-", "over, above", "Latin", "hyper"],
  syn:    ["p", "syn- / sym-", "together, with", "Greek"],
  trans:  ["p", "trans- / tra-", "across", "Latin"],

  // ---- suffixes (hubs) ----
  al:     ["s", "-al / -ial / -ar", "relating to", "Latin -alis, -aris"],
  ous:    ["s", "-ous", "full of", "Latin -osus"],
  ion:    ["s", "-ion / -ation", "act or state of", "Latin -io"],
  ic:     ["s", "-ic / -ac", "having to do with", "Greek -ikos"],
  ity:    ["s", "-ity / -ty", "quality of", "Latin -itas"],
  able:   ["s", "-able / -ible", "able to be", "Latin -abilis"],
  er:     ["s", "-er / -or / -ier", "one who, thing that", "Latin -or, English -er"],
  ist:    ["s", "-ist", "one who does", "Greek -istēs"],
  ism:    ["s", "-ism", "belief, practice", "Greek -ismos"],
  ive:    ["s", "-ive / -ative", "tending to", "Latin -ivus"],
  ent:    ["s", "-ent / -ant", "doing, being", "Latin -ens, -ans", "ence"],
  ence:   ["s", "-ence / -ance / -ency", "state of", "Latin -entia", "ent"],
  ure:    ["s", "-ure / -ture", "act, result", "Latin -ura"],
  ory:    ["s", "-ory", "place for, relating to", "Latin -orius"],
  ize:    ["s", "-ize", "make, become", "Greek -izein"],
  ate:    ["s", "-ate", "make, do", "Latin -atus"],
  ment:   ["s", "-ment", "result, means", "Latin -mentum"],
  y:      ["s", "-y", "state, study of", "Greek -ia, English -y"],
  ia:     ["s", "-ia", "condition, things", "Greek and Latin -ia"],
  ian:    ["s", "-an / -ian / -ean", "of, from", "Latin -anus"],
  fy:     ["s", "-fy", "make", "Latin -ficare, from facere", "fac"],
};

window.ROOTED_WORDS = `
norm norm.al ab.norm.al e=ex.norm.ous e=ex.norm.ity norm.al.ize para.norm.al sub.norm.al norm.ative=ive

terr._ain terr._it.ory terr._itori.al terr._estr.ial=al extra.terr._estr.ial=al sub.terr._an.ean=ian
medi.terr._an.ean=ian terr._ace in=inI.ter=terr dis.in=inI.ter=terr terr.ier=er
terr=terreo.or=er terr=terreo.ible=able terr=terreo._i.fy terr=terreo._i.fic=fac de.ter=terreo

ped.al ped._estr.ian bi.ped cent._i.ped._e quadr._u.ped ex.ped._ite ex.ped._it.ion im=inI.ped._e
im=inI.ped._i.ment ped._i.cure=cura ped._estal
tri.pod pod._ium octo.pus=pod anti.pod._e   _platy.pus=pod
foot foot._ball _bare.foot foot._print foot._step foot._note foot._hill
 ped=paed.agog.y ortho.ped=paed.ic en.cycl._o.ped=paed.ia

vid._eo vis=vid.ion vis=vid.ible=able in=inN.vis=vid.ible=able vis=vid._it pro.vid._e pro.vid.ence
e=ex.vid.ent e=ex.vid.ence super.vis=vid._e re.vis=vid._e tele.vis=vid.ion ad.vis=vid._e
view=vid re.view=vid inter.view=vid
wit wit._ness wis=wit._dom wise=wit un.wise=wit
ide._a ide.al ide.al.ism ide._o.log.y

tele.phon._e tele.scop._e tele.graph tele.port tele.path.y tele.gram=graph
phon._e micro.phon._e sym=syn.phon.y phon.ic phon._o.graph _saxo.phon._e phon._et.ic homo.phon._e eu.phon.y
son.ic re.son.ate con.son.ant=ent dis.son.ant=ent super.son.ic son._net uni.son

graph graph.ic auto.graph photo=phot.graph bio.graph.y geo.graph.y para.graph
dia.gram=graph gram=graph._mar mono.gram=graph pro.gram=graph ortho.graph.y _calli.graph.y

scop._e micro.scop._e peri.scop._e  _kaleido.scop._e _stetho.scop._e skep=scop._t.ic
in=inI.spect=spec re.spect=spec spect=spec._acle spec._ies spec._imen spec.ial=al spec._ul.ate
intro.spect=spec.ion pro.spect=spec ex.pect=spec su=sub.spect=spec con.spic=spec._u.ous de.spis=spec._e

port port.able trans.port ex.port im=inI.port re.port sup=sub.port de.port port.er port._folio
im=inI.port.ant=ent
trans.fer re.fer in=inI.fer con.fer of=ob.fer dif=dis.fer fer._tile _coni.fer aqu._i.fer
voc._i.fer.ous suf=sub.fer pre.fer
meta.phor eu.phor.ia _sema.phor._e am=ambi.phor._a phos=phot.phor._us

dict.ion._ary pre.dict contra.dict ver.dict dict.ate ad.dict bene.dict.ion juris=jus.dict.ion e=ex.dict
pro.duct=duc con.duct=duc e=ex.duc.ate in=inI.duct=duc re.duc._e intro.duc._e aque=aqu.duct=duc
duct=duc ab.duct=duc de.duc._e se.duc._e via.duct=duc
struct.ure con.struct de.struct.ion in=inI.struct ob.struct _infra.struct.ure
scrib._e script=scrib de.scrib._e pre.scrib._e sub.scrib._e tran=trans.script=scrib post.script=scrib
manu=man.script=scrib in=inI.scrib._e circum.scrib._e script=scrib.ure
pro.ject re.ject in=inI.ject ob.ject sub.ject e=ex.ject de.ject._ed inter.ject.ion tra=trans.ject.ory
sub.mit trans.mit ad.mit e=ex.mit o=ob.mit per.mit com=con.mit re.mit dis.miss=mit miss=mit.ion
miss=mit._ile pro.mise=mit inter.mit._t.ent ad.miss=mit.ion mess=mit._age

cred._it in=inN.cred.ible=able cred.ible=able cred._o cred.ence cred._ul.ous ac=ad.cred._it creed=cred
aud._io aud.ience=ence aud.ible=able in=inN.aud.ible=able aud._it aud._it.ion aud._it.ory aud._it.or=er._ium
voc.al voc._abulary ad.voc.ate e=ex.vok=voc._e in=inI.vok=voc._e pro.vok=voc._e re.vok=voc._e
voc._at.ion voice=voc

cord.ial=al ac=ad.cord dis.cord con.cord re.cord cour=cord._age ac=ad.cord.ion
cardi=card.ac=ic cardi=card._o cardi=card._o.log.y peri.card._ium electr._o.cardi=card._o.gram=graph
nov._el nov._ice in=inI.nov.ate re.nov.ate nov._el.ty=ity nov._a super.nov._a
neo._n neo.lith.ic neo._phyte neo.log.ism neo.nat.al
nat.ive nat.ure nat.ion pre.nat.al in=inI.nat._e nat.al

nomin=nom.ate nomin=nom.al de.nomin=nom.ation=ion re.nown=nom noun=nom pro.noun=nom ig=inN.nomin=nom.y
syn.onym ant=anti.onym homo.nym=onym pseud=pseudo.onym an.onym.ous acr.onym ep=epi.onym patr.onym.ic
name _nick.name sur=super.name
astr._o.nom=nomos.y   tax._o.nom=nomos.y
a=an.the.ism a=an.morph.ous a=an.path.y a=an.sym=syn.metr.y an.arch.y a=an.tom 

dent.ist dent.al dent.ure in=inI.dent dand=dent._elion tri.dent
ortho.dont=odont.ist _mast.odon=odont peri.odont.ic odont._o.log.y

bio.log.y auto.bio.graph.y bio._me bio.ps=opt.y anti.bio._t.ic sym=syn.bio._sis micro.bio._me
micro.be=bio
viv._id re.viv._e sur=super.viv._e viv._aci.ous vit=viv.al vit=viv._amin vit=viv.al.ity re.vit=viv.al.ize

log.ic geo.log.y psych._o.log.y anthrop._o.log.y dia.log._ue mono.log._ue pro.log._ue epi.log._ue
ana.log.y apo.log.y chron._o.log.y astr._o.log.y cata.log _etym._o.log.y tri.log.y
morph._o.log.y path._o.log.y gen._ea.log.y dox._o.log.y

geo.metr.y geo.therm.al apo.gee=geo peri.gee=geo
astr._o.naut dis.aster=astr aster=astr aster=astr._isk aster=astr._oid astr.al
stell.ar=al con.stell.ation=ion inter.stell.ar=al
star star._fish star._dust _lode.star
naut.ic.al _argo.naut aqu._a.naut cosm._o.naut naus=naut._ea
aqu._a aqu._arium aqu._at.ic aqu._a.mar._ine
hydr.ant=ent hydr.ate de.hydr.ate hydr._o.gen hydr._o.phob.ia hydr._aul.ic hydr._a
water water._fall water._melon _salt.water
phob.ia claustr=clud._o.phob.ia  _arachno.phob.ia

chron.ic chron._icle syn.chron.ize ana.chron.ism chron._o.meter=metr
photo=phot phot._on photo=phot.syn.thes._is
thes._is hypo.thes._is syn.thes._is anti.thes._is par=para.en.thes._is
therm.al therm._o.meter=metr therm._os exo.therm.ic hypo.therm.ia hyper.therm.ia
micro._wave micro._chip

manu=man.al manu=man.fact=fac.ure man._i.cure=cura man._age e=ex.man.cip=cap.ate 
man._ifest man._acle mand=man.ate main=man.tain=ten
fact=fac fact=fac.ory fac._ul.ty=ity af=ad.fect=fac ef=ex.fect=fac in=inI.fect=fac per.fect=fac
de.fect=fac suf=sub.fic=fac._i.ent magn._i.fic=fac.ent fac._ile fac._il.ity fac.simil._e
magn._i.fy _puri.fy _ampli.fy
capt=cap.ure capt=cap.ive capt=cap.iv=ive.ate ac=ad.cept=cap ex.cept=cap con.cept=cap
per.cept=cap.ion re.ceiv=cap._e de.ceiv=cap._e con.ceiv=cap._e inter.cept=cap cap.able
cap._ac.ity part._i.cip=cap.ate re.cip=cap._e re.cip=cap._i.ent
capit.al capt=capit._ain de.capit.ate cape=capit chief=capit _mis.chief=capit

tract at=ad.tract con.tract ex.tract sub.tract re.tract dis.tract tract.or=er abs=ab.tract
pro.tract.or=er trait=tract por=pro.trait=tract
e=ex.rupt inter.rupt dis.rupt ab.rupt cor=con.rupt _bank.rupt rupt.ure route=rupt
re.flect de.flect in=inI.flect flex=flect flex=flect.ible=able re.flex=flect re.flect.ion
circum.flex=flect
pend.ant=ent pend._ulum de.pend sus=sub.pend ap=ad.pend._ix in=inN.de.pend.ent ex.pens=pend._e
com=con.pens=pend.ate pens=pend.ive pens=pend.ion dis.pens=pend._e pond=pend._er

sed.ent._ary sed._i.ment sess=sed.ion re.sid=sed._e pre.sid=sed.ent sub.sid=sed._e re.sid=sed._ue
ob.sess=sed pos=pot.sess=sed as=ad.sess=sed siege=sed
sit seat=sit _baby.sit
cat=cata.hedr.al poly.hedr._on tetra.hedr._on tetra.log.y octa=octo.hedr._on

gen._e gen._et.ic gen._ius gen._er.ate gen._er.al gen._er.ous gen._re gen._der 
gen._esis in=inI.gen._i.ous pro.gen._y gen._ome
gen._o.cid._e homi=homin.cid._e  de.cid._e con.cis=cid._e pre.cis=cid._e in=inI.cis=cid.ion

mort.al im=inN.mort.al mort.al.ity mort._gage mort._ic.ian post.mort._em mort._i.fy a=ad.mort.ize
morph meta.morph._osis poly.morph.ic anthrop._o.morph.ic morph._eme
form form.al re.form in=inI.form per.form trans.form uni.form con.form de.form form._ula
path._os sym=syn.path.y em=en.path.y anti.path.y psych._o.path path._et.ic homeo=homo.path.y
psych._e psych.ic  psych._edel.ic
phil.anthrop.y   biblio.phil._e phil._harmon.ic _anglo.phil._e

dem._o.crat dem._o.crac=crat.y epi.dem.ic pan.dem.ic en.dem.ic dem.agog._ue dem._o.graph.ic
auto.crat auto.crac=crat.y _bureau.crat _aristo.crat techn._o.crat the._o.crac=crat.y
pan._orama pan._acea pan.the._on pan._demonium pan._creas
poly.gon poly._math poly.glot=gloss poly._mer poly._ester
mono.tone=ton  mono.chrome=chrom mono._rail mono.lith mon=mono._k
uni.cycl._e  uni.vers=vert._e uni._on uni._que uni.ty=ity uni._te
tri.angle=angl tri.cycl._e tri._o tri._ple tri.via
quadr.ant=ent quadr._i.later.al quadr._uple s=ex.quare=quadr s=ex.quad=quadr
octa=octo.gon oct=octo._ave oct=octo._ober
cent cent._ury per.cent cent._i.meter=metr cent.enn=ann.ial=al cent._ur.ion

patr._iot patr._on patr._i.arch pater=patr._n.al ex.patr._i.ate
father  father._land
matr._ix mater=matr._n.al matr._i.arch matr._on matr._imony
mother  mother._land
metr.ic sym=syn.metr.y baro.meter=metr dia.meter=metr peri.meter=metr _kilo.meter=metr meter=metr

fin.al fin._ish fin._ite in=inN.fin._ite de.fin._e con.fin._e re.fin._e fin._ale fin.ance=ence af=ad.fin.ity
grat._itude con.grat._ul.ate grat._is in=inN.grat._e grat._i.fy grace=grat grate=grat._ful
grat._uit.ous a=ad.gree=grat
mar._ine sub.mar._ine mar._itime ultra.mar._ine mar._ina
sol.ar=al sol._stice _para.sol sol._arium
heli._um  peri.heli._on ap=apo.heli._on heli._o.centr.ic
sun sun.flower=flor sun._rise sun._shine sun._burn sun._set
lun.ar=al lun._at.ic lun._acy

loc.al loc.ate loc.ation=ion al=ad.loc.ate dis.loc.ate re.loc.ate loc._o.mot=mov.ive loc._ale loc._us
lieu=loc.ten.ant=ent
mov._e re.mov._e mot=mov.ion e=ex.mot=mov.ion pro.mot=mov._e de.mot=mov._e mot=mov.ive mot=mov.or=er
mob=mov._ile mo=mov.ment re.mot=mov._e mot=mov.or=er.cycl._e mob=mov auto.mob=mov._ile
pos._it.ion com=con.pos._e ex.pos._e pro.pos._e op=ob.pos._ite de.pos._it com=con.pon=pos.ent
ex.pon=pos.ent op=ob.pon=pos.ent pur=pro.pos._e sup=sub.pos._e pos.ture=ure
ten.ant=ent con.tain=ten ob.tain=ten re.tain=ten de.tain=ten sus=sub.tain=ten con.tin=ten.ent
con.tin=ten._ue ten._aci.ous ten.or=er abs=ab.tain=ten ten._et ten.ure enter=inter.tain=ten per.tain=ten

vert._ex vert.ic.al con.vert in=inI.vert re.vert di=dis.vert ad.vert._ise extro=extra.vert intro.vert
vers=vert._e con.vers=vert.ation=ion re.vers=vert._e ad.vers=vert._e anni=ann.vers=vert._ary
di=dis.vers=vert._e trans.vers=vert._e vers=vert._us vert._igo contro=contra.vers=vert.y a=ab.vers=vert.ion
ad.vent=ven ad.vent=ven.ure e=ex.vent=ven in=inI.vent=ven pre.vent=ven con.ven._e con.ven._i.ent
inter.ven._e re.ven._ue a=ad.ven._ue sou=sub.ven._ir circum.vent=ven ven._ue
ced._e ante.ced.ent pre.ced._e re.ced._e pro.ceed=ced ex.ceed=ced suc=sub.ceed=ced con.ced._e se.ced._e
inter.ced._e ac=ad.cess=ced pro.cess=ced suc=sub.cess=ced ex.cess=ced re.cess=ced pre.ced.ent
an=ante.ces=ced._t.or=er
cur._r.ent oc=ob.cur re.cur con.cur ex.curs=cur.ion curs=cur.or=er pre.curs=cur.or=er cours=cur._e
cour=cur.ier=er cur._riculum in=inI.cur corr=cur._idor
cure=cura cur=cura._i.ous se.cure=cura ac=ad.cur=cura.ate pro.cure=cura cur=cura.ate cur=cura._at.or=er

medi._a medi._um medi.an=ian medi.ate inter.medi.ate im=inN.medi.ate medi._ev.al medi._ocre
auto._mat.ic auto.psy=opt auto._pilot
cycl._e bi.cycl._e re.cycl._e cycl._one cycl.ops=opt
ortho.dox para.dox hetero.dox
`;

// ---- second batch (Nov 14, 2026) ----
Object.assign(window.ROOTED_PARTS, {
  act:    ["r", "act / ag / ig", "do, drive", "Latin agere", "agog"],
  agog:   ["r", "agog / agon", "lead, contest", "Greek agein, agōn", "act"],
  nav:    ["r", "nav", "ship", "Latin navis", "naut"],
  legR:   ["r", "leg / lect / lig", "read, choose, gather", "Latin legere", "log"],
  legL:   ["r", "leg / loy", "law", "Latin lex, legis"],
  jus:    ["r", "jus / jur / jud", "law, right", "Latin ius, iuris"],
  pel:    ["r", "pel / puls / peal", "drive, push", "Latin pellere"],
  press:  ["r", "press", "press", "Latin premere, pressus"],
  tend:   ["r", "tend / tens / tent", "stretch", "Latin tendere", "ten ton"],
  ton:    ["r", "ton", "stretching, pitch", "Greek tonos", "tend ten"],
  tonare: ["r", "ton", "thunder", "Latin tonare"],
  clud:   ["r", "clud / clus / clos / claus", "shut", "Latin claudere"],
  cad:    ["r", "cad / cas / cid / cay", "fall", "Latin cadere"],
  sci:    ["r", "sci", "know", "Latin scire"],
  sens:   ["r", "sens / sent / scent", "feel", "Latin sentire"],
  sequ:   ["r", "sequ / secu / sec / sue", "follow", "Latin sequi"],
  solv:   ["r", "solv / solu / sol", "loosen", "Latin solvere", "lys"],
  lys:    ["r", "lys / ly", "loosening", "Greek lysis", "solv"],
  spir:   ["r", "spir / pir", "breathe", "Latin spirare"],
  grad:   ["r", "grad / gress / gred", "step, go", "Latin gradi, gradus"],
  fract:  ["r", "fract / frag / frail", "break", "Latin frangere"],
  greg:   ["r", "greg", "flock", "Latin grex, gregis"],
  corp:   ["r", "corp", "body", "Latin corpus"],
  carn:   ["r", "carn", "flesh", "Latin caro, carnis"],
  vor:    ["r", "vor / vour", "eat, swallow", "Latin vorare"],
  herb:   ["r", "herb", "grass, plant", "Latin herba"],
  omni:   ["r", "omni", "all", "Latin omnis"],
  pot:    ["r", "pot / poss / pos", "able, powerful", "Latin potis, posse"],
  ess:    ["r", "ess / sent / ent / est", "be", "Latin esse"],
  simil:  ["r", "simil / simul / sembl", "like, same", "Latin similis", "homo same"],
  homo:   ["r", "homo / homeo", "same", "Greek homos", "simil same"],
  same:   ["r", "same", "same", "Old Norse samr", "simil homo"],
  homin:  ["r", "homi / hum", "human being", "Latin homo, hominis"],
  hetero: ["r", "hetero", "other, different", "Greek heteros"],
  vac:    ["r", "vac", "empty", "Latin vacare"],
  val:    ["r", "val / vail", "be strong, be worth", "Latin valere"],
  equ:    ["r", "equ / equi", "equal, even", "Latin aequus"],
  noct:   ["r", "nox / noct", "night", "Latin nox, noctis", "night"],
  night:  ["r", "night", "night", "Old English niht", "noct"],
  luc:    ["r", "luc / lum / lus", "light", "Latin lux, lumen", "lun leuk light"],
  leuk:   ["r", "leuk", "white", "Greek leukos", "luc light"],
  light:  ["r", "light", "light", "Old English leoht", "luc leuk"],
  dom:    ["r", "dom / domin", "house, master", "Latin domus, dominus"],
  mill:   ["r", "mill / mil", "thousand", "Latin mille"],
  ann:    ["r", "ann / enn", "year", "Latin annus"],
  dec:    ["r", "dec", "ten", "Latin decem"],
  plic:   ["r", "plic / plex / ply / ploy", "fold, weave", "Latin plicare, plectere"],
  du:     ["r", "du / dou", "two", "Latin duo", "bi di"],
  di:     ["p", "di-", "two, double", "Greek", "bi du"],
  multi:  ["r", "multi", "many", "Latin multus"],
  cult:   ["r", "cult", "till, tend", "Latin colere, cultus"],
  agri:   ["r", "agri", "field", "Latin ager, agri"],
  lingu:  ["r", "lingu / langu", "tongue, language", "Latin lingua"],
  gloss:  ["r", "gloss / glot", "tongue", "Greek glōssa"],
  tom:    ["r", "tom", "cut", "Greek tomē"],
  sect:   ["r", "sect / seg", "cut", "Latin secare"],
  techn:  ["r", "techn", "art, skill", "Greek tekhnē", "tect"],
  tect:   ["r", "tect", "builder", "Greek tektōn", "techn"],
  the:    ["r", "the / thus", "god", "Greek theos"],
  div:    ["r", "div", "god", "Latin divus"],
  chrom:  ["r", "chrom", "color", "Greek khrōma"],
  soma:   ["r", "som", "body", "Greek sōma"],
  phys:   ["r", "phys", "nature", "Greek physis"],
  top:    ["r", "top", "place", "Greek topos"],
  iso:    ["r", "iso", "equal", "Greek isos"],
  baro:   ["r", "bar", "weight, heavy", "Greek barys, baros", "grav"],
  grav:   ["r", "grav / grief / griev", "heavy", "Latin gravis", "baro"],
  magn:   ["r", "magn", "great", "Latin magnus", "mega"],
  mega:   ["r", "mega / megal", "great", "Greek megas", "magn"],
  anim:   ["r", "anim", "breath, mind, life", "Latin anima, animus"],
  mania:  ["r", "mania / mani", "madness", "Greek mania"],
  pyr:    ["r", "pyr", "fire", "Greek pyr", "fire"],
  fire:   ["r", "fire", "fire", "Old English fyr", "pyr"],
  arch:   ["r", "arch", "rule, first, chief", "Greek arkhē"],
  mon:    ["r", "mon", "warn, remind, show", "Latin monere"],
  polis:  ["r", "polis / polit / polic", "city", "Greek polis"],
  necro:  ["r", "necro", "dead body", "Greek nekros"],
  cosm:   ["r", "cosm", "order, world, adornment", "Greek kosmos"],
  cin:    ["r", "cine / kine", "move", "Greek kinein", "cit"],
  cit:    ["r", "cit", "set in motion, summon", "Latin ciere, citare", "cin"],
  cogn:   ["r", "cogn / gnor / not / no", "know", "Latin (g)noscere", "gno know"],
  gno:    ["r", "gno", "know", "Greek gignōskein", "cogn know"],
  know:   ["r", "know", "know", "Old English cnawan", "cogn gno"],
  urb:    ["r", "urb", "city", "Latin urbs"],
  civ:    ["r", "civ / cit", "citizen", "Latin civis"],
  reg:    ["r", "reg / rect / roy / reig", "rule, straight", "Latin regere, rex", "right"],
  right:  ["r", "right", "straight, correct", "Old English riht", "reg"],
  angl:   ["r", "angl", "corner, bend", "Latin angulus"],
  sacr:   ["r", "sacr / sanct", "holy", "Latin sacer, sanctus"],
  lat:    ["r", "lat", "carried", "Latin latus (the past of ferre)", "fer"],
  pet:    ["r", "pet / peat", "seek, aim at", "Latin petere"],
  quer:   ["r", "quer / quir / quest / quis", "seek, ask", "Latin quaerere"],
  rog:    ["r", "rog", "ask", "Latin rogare"],
  pac:    ["r", "pac / peac / peas", "peace", "Latin pax, pacis"],
  bell:   ["r", "bell", "war", "Latin bellum"],
  ger:    ["r", "ger / gest", "carry, do", "Latin gerere"],
  bene:   ["r", "bene", "well", "Latin bene"],
  mal:    ["r", "mal", "bad, badly", "Latin malus, male"],
  vol:    ["r", "vol", "wish, will", "Latin velle, volo"],
  fid:    ["r", "fid / fy", "trust, faith", "Latin fides, fidere"],
  fort:   ["r", "fort", "strong", "Latin fortis"],
  lev:    ["r", "lev / liev", "light, raise", "Latin levis, levare"],
  celer:  ["r", "celer", "swift", "Latin celer"],
  temp:   ["r", "temp", "time", "Latin tempus"],
  sen:    ["r", "sen", "old", "Latin senex"],
  frat:   ["r", "frat / fri", "brother", "Latin frater", "brother"],
  brother:["r", "brother", "brother", "Old English brōþor", "frat"],
  host:   ["r", "host / hosp / hot", "guest, stranger, host", "Latin hospes, hostis", "guest"],
  guest:  ["r", "guest", "guest", "Old Norse gestr", "host"],
  tang:   ["r", "tang / tact / tag / teg / tir", "touch", "Latin tangere"],
  fus:    ["r", "fus / fund", "pour", "Latin fundere, fusus"],
  flu:    ["r", "flu / flux", "flow", "Latin fluere"],
  flor:   ["r", "flor / flour / flower", "flower", "Latin flos, floris"],
  dendr:  ["r", "dendr", "tree", "Greek dendron", "tree"],
  tree:   ["r", "tree", "tree", "Old English trēow", "dendr"],
  lith:   ["r", "lith", "stone", "Greek lithos"],
  paleo:  ["r", "paleo", "old", "Greek palaios"],
  zo:     ["r", "zo", "animal, life", "Greek zōion"],
  proto:  ["r", "proto / prot", "first", "Greek prōtos"],
  typ:    ["r", "typ", "impression, model", "Greek typos"],
  neur:   ["r", "neur", "nerve", "Greek neuron"],
  derm:   ["r", "derm", "skin", "Greek derma"],
  tax:    ["r", "tax / tact", "arrangement", "Greek taxis"],
  hem:    ["r", "hem / em", "blood", "Greek haima"],
  ocul:   ["r", "ocul / ocl", "eye", "Latin oculus", "opt eye"],
  opt:    ["r", "opt / ops / ps", "eye, sight", "Greek ōps, optos", "ocul eye"],
  eye:    ["r", "eye", "eye", "Old English ēage", "ocul opt"],
  loqu:   ["r", "loqu / locu", "speak", "Latin loqui"],
  solus:  ["r", "sol", "alone", "Latin solus"],
  liber:  ["r", "liber / liver", "free", "Latin liber"],
  neg:    ["r", "neg", "deny, not", "Latin negare, nec"],
  sign:   ["r", "sign", "mark", "Latin signum"],
  cav:    ["r", "cav", "hollow", "Latin cavus"],
  mur:    ["r", "mur", "wall", "Latin murus"],
  intra:  ["p", "intra-", "within", "Latin"],
  vena:   ["r", "ven / vein", "vein", "Latin vena"],
  aer:    ["r", "aer", "air", "Greek aēr"],
  dynam:  ["r", "dynam / dynas", "power", "Greek dynamis"],
  insul:  ["r", "insul / isol", "island", "Latin insula"],
  paene:  ["r", "pen", "almost", "Latin paene"],
  ultim:  ["r", "ultim", "last, farthest", "Latin ultimus", "ultra"],
  ultra:  ["p", "ultra-", "beyond", "Latin", "ultim"],
  via:    ["r", "via / vi / voy", "road, way", "Latin via", "veh way"],
  veh:    ["r", "veh / vect", "carry", "Latin vehere", "via way"],
  way:    ["r", "way", "road, path", "Old English weg", "via veh"],
  vad:    ["r", "vad / vas", "go", "Latin vadere"],
  it:     ["r", "it", "go", "Latin ire, itum"],
  ambi:   ["p", "ambi- / amb- / amphi-", "both, around", "Latin and Greek"],
  ambul:  ["r", "ambul / ambl", "walk", "Latin ambulare"],
  somn:   ["r", "somn", "sleep", "Latin somnus", "hypn"],
  hypn:   ["r", "hypn", "sleep", "Greek hypnos", "somn"],
  am:     ["r", "am / ami / em", "love, friend", "Latin amare, amicus"],
  ver:    ["r", "ver", "true", "Latin verus"],
  bon:    ["r", "bon / boun", "good", "Latin bonus"],
  dur:    ["r", "dur", "hard, lasting", "Latin durus, durare"],
  firm:   ["r", "firm", "strong, steady", "Latin firmus"],
  prim:   ["r", "prim / prin / prem", "first", "Latin primus"],
  quint:  ["r", "quint", "fifth", "Latin quintus", "pent"],
  novem:  ["r", "nov", "nine", "Latin novem"],
  tetra:  ["r", "tetra", "four", "Greek tetra-", "quadr"],
  pent:   ["r", "pent", "five", "Greek pente", "quint"],
  hex:    ["r", "hex", "six", "Greek hex"],
  gon:    ["r", "gon", "angle (\"knee\")", "Greek gōnia, gony", "genu"],
  genu:   ["r", "genu", "knee", "Latin genu", "gon"],
  dia:    ["p", "dia-", "through, across", "Greek"],
  ana:    ["p", "ana-", "up, back, again", "Greek"],
  cata:   ["p", "cata- / cat-", "down, thoroughly", "Greek"],
  epi:    ["p", "epi- / ep-", "upon, over", "Greek"],
  apo:    ["p", "apo- / ap-", "away, off", "Greek"],
  eu:     ["p", "eu-", "good, well", "Greek"],
  centr:  ["r", "centr / center", "center", "Greek kentron"],
  fug:    ["r", "fug", "flee", "Latin fugere"],
  hemi:   ["p", "hemi-", "half", "Greek", "semi"],
  semi:   ["p", "semi-", "half", "Latin", "hemi"],
  spher:  ["r", "spher", "ball", "Greek sphaira"],
  pseudo: ["r", "pseud", "false", "Greek pseudēs"],
  un:     ["p", "un-", "not", "Old English", "inN an"],
  porta:  ["r", "port", "gate, harbor", "Latin porta, portus", "port"],
  part:   ["r", "part", "part, share", "Latin pars, partis"],
  acr:    ["r", "acr", "top, tip", "Greek akros"],
  biblio: ["r", "bibl", "book", "Greek biblion"],
  electr: ["r", "electr", "amber", "Greek ēlektron"],
  retro:  ["p", "retro-", "backward", "Latin"],
  circ:   ["r", "circ", "ring", "Latin circus", "circum"],
  circum: ["p", "circum-", "around", "Latin", "circ"],
  tract:  ["r", "tract / trait / tra", "pull, drag", "Latin trahere"],
});

window.ROOTED_WORDS += `
act act.ion act.ive act.or=er re.act re.act.ion trans.act trans.act.ion ex.act inter.act inter.act.ion
act._u.al act._u.ate counter=contra.act pro.act.ive retro.act.ive ag=act.ent ag=act._enda ag=act._ile ag=act._it.ate
_lit.ig=act.ate ex.ig=act.ent
syn.agog._ue agon=agog.y prot=proto.agon=agog.ist ant=anti.agon=agog.ist
nav._y nav.al nav.ig=act.ate circum.nav.ig=act.ate nav.ig=act.ation=ion

lect=legR.ure leg=legR.ible=able il=inN.leg=legR.ible=able leg=legR._end col=con.lect=legR se.lect=legR
e=ex.lect=legR e=ex.lect=legR.ion neg.lect=legR intel=inter.lect=legR intel=inter.lig=legR.ent
e=ex.leg=legR.ant=ent di=dis.lig=legR.ent lect=legR._ern re.col=con.lect=legR dia.lect=legR
leg=legL.al il=inN.leg=legL.al leg=legL._is.lat._e leg=legL._itim.ate _privi.leg=legL._e loy=legL.al
sacr._i.leg=legR._e
jus._t jus._tice in=inN.jus._tice jus._ti.fy jur=jus.y in=inN.jur=jus.y per.jur=jus.y jur=jus.ist
jud=jus._ge jud=jus._ici.al=al pre.jud=jus._ice ad.jud=jus._ic.ate

com=con.pel ex.pel pro.pel re.pel dis.pel pro.pel._l.er=er im=inI.puls=pel._e puls=pel._e
re.puls=pel.ive com=con.puls=pel.ory ap=ad.peal=pel
press.ure ex.press im=inI.press de.press com=con.press op=ob.press sup=sub.press re.press
ex.press.ion im=inI.press.ion press

tend ex.tend ex.tens=tend.ion in=inI.tend in=inI.tens=tend._e in=inI.tent=tend.ion at=ad.tend
at=ad.tent=tend.ion pre.tend con.tend tens=tend.ion tent=tend tens=tend._e super.in=inI.tend.ent
tend._on
tone=ton ton.ic in=inI.ton.ation=ion bari=baro.tone=ton
de.ton=tonare.ate as=ex.ton=tonare._ish as=ex.toun=tonare._d

in=inI.clud._e ex.clud._e con.clud._e se.clud._e pre.clud._e ex.clus=clud.ive con.clus=clud.ion
re.clus=clud._e clos=clud._e clos=clud._et dis.clos=clud.ure en.clos=clud.ure claus=clud._e

ac=ad.cid=cad.ent in=inI.cid=cad.ent co=con.in=inI.cid=cad._e de.cay=cad cas=cad._cade
oc=ob.cas=cad.ion cas=cad.ual=al de.cad.ent=ent

sci.ence con.sci.ence con.sci.ous un.con.sci.ous omni.sci.ent pre.sci.ent sci.ent.ist
sens._e sens._it.ive sens.ation=ion sent=sens._i.ment con.sent=sens dis.sent=sens re.sent=sens
sent=sens.ence _non.sens._e sens.ory scent=sens con.sens=sens._us
sequ.ence con.sequ.ence sub.sequ.ent sequ._el per.secu=sequ._te ex.ecu=sequ._te con.secu=sequ.tive=ive
sec=sequ._ond pur=pro.sue=sequ en.sue=sequ suit=sequ

solv._e solu=solv._t.ion dis.solv._e re.solv._e ab.solv._e solu=solv.ble=able ab.solu=solv._te
re.solu=solv._t.ion aero=aer.sol=solv
ana.lys._is para.lys._is cata.ly=lys._st dia.lys._is electr._o.lys._is ana.ly=lys.ze=ize

spir._it in=inI.spir._e ex.pir=spir._e re.spir=spir.ation=ion con.spir=spir._e per.spir=spir._e
a=ad.spir._e trans.pir=spir._e in=inI.spir.ation=ion spir._it.ual=al

grad._e grad.ual=al grad._u.ate de.grad._e pro.gress=grad re.gress=grad ag=ad.gress=grad.ive
di=dis.gress=grad con.gress=grad trans.gress=grad e=ex.gress=grad in=inI.gred=grad._i.ent

fract.ure fract.ion frag=fract._ile frag=fract.ment re.fract in=inI.fract.ion frail=fract
greg._ari.ous con.greg.ate se.greg.ate ag=ad.greg.ate e=ex.greg._i.ous
corp._se corp._s corp._or.al=al corp._or.ation=ion in=inI.corp._or.ate corp._us
carn._ival carn._i.vor._e in=inI.carn.ate carn.ation=ion carn._age re.in=inI.carn.ation=ion
herb._i.vor._e omni.vor._e vor._aci.ous de.vour=vor
herb herb.al herb._i.cid._e
omni._bus omni.pot.ent omni.pre.sent=ess
pot.ent=ent pot.ent._i.al=al im=inN.pot.ent=ent poss=pot.ible=able im=inN.poss=pot.ible=able

pre.sent=ess ab.sent=ess ess.ence ess._ent.ial=al inter.est=ess re.pre.sent=ess pre.s=ess.ence
ab.s=ess.ence ent=ess.ity

simil.ar=al simil._e as=ad.simil.ate dis.simil.ar=al simul=simil.ate simul=simil._tane.ous
as=ad.sembl=simil._e re.sembl=simil._e en.sembl=simil._e
homo.gen._e.ous same
hum=homin.an=ian hum=homin.an=ian.ity hum=homin._ane homin._id
hetero.gen._e.ous

vac.ant=ent vac.ation=ion vac._uum e=ex.vac._u.ate vac.ate
val._ue val._id in=inN.val._id val._i.ant=ent e=ex.val._u.ate equ._i.val.ent pre.vail=val
a=ad.vail=val.able val.or=er ambi.val.ent
equ.al equ.ation=ion equ.ator=er ad.equ.ate equ._ilibrium equ._i.nox=noct
noct._urn.al noct._urne night night._fall _mid.night
luc._id e=ex.luc._id.ate trans.luc.ent il=inI.lum=luc._in.ate lum=luc._in.ous
leuk.em=hem.ia leuk._ocyte
light star.light=light _day.light light._house sun.light light._ning

dom._est.ic dom._in.ate dom._ain dom._in.ion con.dom._in._ium pre.dom._in.ant=ent dom._e
mill._ion mill.enn=ann._ium mill._i.meter=metr mill._i.ped._e mil=mill._e
ann._u.al=al ann._als ann._u.ity=ity per.enn=ann.ial=al bi.enn=ann.ial=al
 dec._im.al dec._im.ate dec._ember nov=novem._ember nov=novem._ena

com=con.plic.ate du.plic.ate multi.ply=plic im=inI.ply=plic ap=ad.ply=plic re.ply=plic ex.plic._it
im=inI.plic._it com=con.plex=plic per.plex=plic em=inI.ploy=plic dis.play=plic de.ploy=plic
ap=ad.plic.ation=ion ac=ad.com=con.plic._e
du.al du._o du._et du._bi.ous dou=du._bt dou=du._ble
 di._ox._ide di._phthong
multi._ple multi._tude multi.medi._a multi.cult._ur.al multi.lingu.al
cult.ure cult._iv.ate agri.cult.ure cult _horti.cult.ure
agr=agri._ari.an=ian
langu=lingu._age lingu._ist.ic bi.lingu.al lingu._ine
gloss._ary gloss epi.glot=gloss._tis
ana.tom.y
epi.tom._e _dicho.tom.y tom._e en.tom._o.log.y _append.ec=ex.tom.y
sect.ion sect.or=er in=inI.sect dis.sect inter.sect bi.sect seg=sect.ment viv._i.sect.ion
techn._o.log.y techn._ique techn._ic.al poly.techn.ic techn._ic.ian=ian
arch._i.tect arch._i.tect.ure tect._on.ic
the._o.log.y mono.the.ism poly.the.ism en.thus=the._iasm
div._ine div._in.ity
chrom._e chrom._at.ic chrom._o.som=soma._e poly.chrom._e
psych._o.som=soma._at.ic
phys.ic=ic phys._ic.al phys._ic.ian=ian phys._ique meta.phys._ics phys._io.log.y
top.ic top._o.graph.y _u.top.ia iso.top._e ec=ex.top.ic
iso._metr.ic iso.bar=baro iso._sceles
grav._e grav._it.y grav._it.ate ag=ad.grav.ate grief=grav griev=grav._e
magn._itude magn._ate magn._um magn.anim.ous
mega._phon._e megal=mega._o.mania mega.lith mega._byte
anim.al anim.ate anim.ation=ion un=uni.anim.ous in=inN.anim.ate equ.anim.ity anim._os.ity
mania mania._c  pyr._o.mania
pyr._e pyr._o.techn.ic
fire fire._work _camp.fire _wild.fire fire._place
mon.arch an.arch.ist  arch._a.ic arch._ive  arch._angel
mon._it.or=er mon._u.ment ad.mon._ish sum=sub.mon pre.mon._it.ion de.mon._str.ate mon._ster
re.mon._str.ate
polit=polis.ic._s polic=polis._e polic=polis._y metr=matr._o.polis cosm._o.polit=polis.an=ian
acr._o.polis necro.polis
necro._mancer
cosm._os cosm.ic cosm._et.ic micro.cosm
cine=cin._ma kine=cin._t.ic tele.kine=cin._sis
cit._e ex.cit._e re.cit._e in=inI.cit._e cit.ation=ion
re.cogn.ize cogn._it.ive in=inN.cogn._ito ig=inN.nor=cogn._e ig=inN.nor=cogn.ant=ent not=cogn._ice
not=cogn.ion no=cogn._ble not=cogn._ori.ous re.con.no=cogn._iter
dia.gno._sis pro.gno._sis a=an.gno._st.ic
know know._ledge _ac.know._ledge un.know._n
urb.an=ian sub.urb sub.urb.an=ian urb._ane
civ._il civ.ic civ._il.ian=ian civ._il.iz=ize.ation=ion cit=civ._y
reg.al reg._ul.ate reg._ime reg.ion cor=con.rect=reg di=dis.rect=reg e=ex.rect=reg rect=reg.angle=angl
rect=reg.or=er reg.ent=ent reig=reg._n roy=reg.al roy=reg.al.ty=ity di=dis.rect=reg.ion
right _up.right _copy.right
angl._e angul=angl.ar=al quadr.angl._e
sacr._ed sacr._i.fic=fac._e sanct=sacr._uary sanct=sacr._i.fy sanct=sacr.ion
trans.lat._e re.lat._e re.lat.ion col=con.lat._e ob.lat._e
com=con.pet._e pet._it.ion re.peat=pet ap=ad.pet._ite im=inI.pet._us per.pet._u.al=al com=con.pet.ent
quer._y quest=quer.ion in=inI.quir=quer._e ac=ad.quir=quer._e re.quir=quer._e con.quer
ex.quis=quer._ite re.quest=quer quest=quer in=inI.quis=quer._it.ive ac=ad.quis=quer._it.ion
in=inI.quest=quer
inter.rog.ate ar=ad.rog.ant=ent pre.rog._at.ive de.rog._at.ory ab.rog.ate sur=sub.rog.ate
pac._i.fy pac._if.ic peac=pac._e ap=ad.peas=pac._e
re.bel=bell re.bell.ion bell._i.ger=ger.ent=ent bell._icose ante.bell._um
ger._und di=dis.gest=ger sug=sub.gest=ger gest=ger.ure re.gist=ger._er con.gest=ger.ion jest=ger
bene.fit=fac bene.vol.ent=ent bene.fic=fac.ial=al bene.fac=fac._t.or=er ben=bene.ign=gen
mal._ice mal._ici.ous male=mal.vol.ent=ent  _dis.mal mal._aria
vol._unt._eer vol._untary
fid._el.ity con.fid._e con.fid.ent in=inN.fid._el dif=dis.fid.ent de.fy=fid
fort fort._i.fy ef=ex.fort com=con.fort fort._itude fort._ress fort._e
lev._it.ate e=ex.lev.ate e=ex.lev._at.or=er re.lev.ant=ent re.liev=lev._e lev._er al=ad.lev._i.ate
ac=ad.celer.ate de.celer.ate
temp._orary con.temp._orary temp._o temp._or.al ex.temp._orane.ous temp._est
sen._i.or=er sen._ile sen._ate sen._at.or=er
frat._ern.al frat._ern.ity frat._ri.cid._e fri=frat._ar
brother brother._hood
host hosp=host._it.al hosp=host._it.al.ity host._el hot=host._el host._ile hosp=host._ice
guest
tang.ible=able in=inN.tang.ible=able con.tact=tang tact=tang tact=tang._ile con.tag=tang._i.ous
in=inN.teg=tang._er en=inN.tir=tang._e
fus._e con.fus._e re.fus._e in=inI.fus._e dif=dis.fus._e trans.fus.ion pro.fus._e re.fund=fus
flu._id flu.ent in=inI.flu.ence in=inI.flu._enza af=ad.flu.ent super.flu.ous flu flux=flu
re.flux=flu con.flu.ence flu._ctu.ate
flor._a flor.al flor.ist flour=flor._ish flower=flor
_rhodo.dendr._on phil._o.dendr._on dendr._ite
tree tree._top
lith._o.graph paleo.lith.ic lith._ium
paleo._nto.log.y paleo.zo.ic
zo._o zo._o.log.y zo._diac proto.zo._a
proto._col proto.typ=typ._e prot=proto._on
typ._e typ._ic.al arch._e.typ._e typ._o.graph.y 
neur._o.log.y neur._on neur._ot.ic neur._o.sci.ence
derm._at._o.log.y epi.derm._is hypo.derm.ic _pachy.derm taxi=tax.derm.y
syn.tax tact=tax._ic._s
hem._o._globin an.em=hem.ia 
ocul.ar=al bi.nocul=ocul.ar=al mon=mono.ocl=ocul._e in=inI.ocul.ate
opt.ic opt._ic.ian=ian opt._o.metr.y syn.ops=opt._is _my.op=opt.ia
eye eye._brow eye._sight eye._lid
e=ex.loqu.ent=ent loqu._aci.ous col=con.loqu._i.al=al e=ex.locu=loqu.tion=ion
circum.locu=loqu.tion=ion soli=solus.loqu._y _ventri.loqu.ist
solo=solus soli=solus._tary soli=solus._tude de.sol=solus.ate
liber.ty=ity liber.al liber.ate de.liver=liber
neg.ate neg._at.ive re.neg._e
sign sign.al sign.ature=ure de.sign re.sign as=ad.sign in=inI.sign.ia sign._i.fic=fac.ant=ent
sign._i.fy
cav._e cav.ity ex.cav.ate con.cav._e cav._ern
mur.al intra.mur.al
vein=vena intra.ven=vena.ous ven=vena.ous
aer.ial=al aer._o.bi=bio.c=ic aer._o.dynam.ic
dynam.ic dynam._ite dynas=dynam._t.y dynam._o therm._o.dynam.ic._s
insul.ate pen=paene.insul._a isol=insul.ate insul.ar=al
pen=paene.ultim.ate
ultim.ate ultim._at._um
ultra._violet ultra.sound=son ultra.son.ic
via ob.vi=via.ous pre.vi=via.ous de.vi=via.ate con.voy=via voy=via._age en=inI.voy=via
veh._icle con.vect=veh.ion vect=veh.or=er
way _high.way _al.way._s
in=inI.vad._e e=ex.vad._e per.vas=vad.ive in=inI.vas=vad.ion e=ex.vas=vad.ion
ex.it trans.it in=inI.it.ial=al in=inI.it._i.ate it._inerary circ=circum._u.it amb=ambi.it.ion
trans.it.ion
ambi.gu=act.ous ambi._dextr.ous amph=ambi._i.bi=bio.ous amph=ambi._itheater
ambul.ance=ence ambl=ambul._e pre.ambl=ambul._e somn.ambul.ist per.ambul.ate
in=inN.somn.ia somn._ol.ent=ent
hypn._o._sis hypn._ot.ic hypn._ot.ize
am._or.ous am._ateur ami=am.able ami=am._c.able en=inN.em=am._y
ver._i.fy ver._y ver._ac.ity ver._it.able
bon._us boun=bon.ty=ity bon._anza
dur.able dur.ation=ion en=inI.dur._e dur._ing ob.dur.ate dur._ess
firm con.firm af=ad.firm in=inN.firm in=inN.firm.ary=ory firm._a.ment
prim._e prim._ary prim._it.ive prim.ate prem=prim._ier prin=prim.ce=cap prin=prim.cip=cap._le
prin=prim.cip=cap.al
quint._et quint.ess.ence
pent._a.gon 
hex._a.gon hex._a.gram=graph
tri.gon._o.metr.y dia.gon.al
genu.flect
center=centr centr.al con.centr.ate ec=ex.centr.ic centr._i.fug.al epi.center=centr _ego.centr.ic
fug._it.ive re.fug._e re.fug._ee _subter.fug._e
hemi.spher._e semi.circ._le semi.fin.al semi._colon
spher._e _atmo.spher._e
pseudo pseud=pseudo._o.sci.ence
port=porta.al op=ob.port=porta._un.ity
part part._icle part._i.al=al de.part a=ad.part.ment im=inI.part part._it.ion part._y
acr._obat acr._o.phob.ia
bibl=biblio._e biblio._graph.y
electr.ic electr._ic.ity electr._on
retro.spect=spec
circ._le circ._us circ._ul.ate

stat=sta._e stat=sta.ion stat=sta._us stat=sta._ue stat=sta._ute stat=sta.ic ec=ex.stas=sta.y
therm._o.stat=sta sta.ble=able e=ex.sta._blish e=ex.stat=sta._e in=inI.sta._nt in=inI.sta._nce
con.sta._nt di=dis.sta._nt di=dis.sta._nce circum.sta._nce sub.sta._nce sub.stit=sta._ute
con.stit=sta._ute in=inI.stit=sta._ute in=inI.stit=sta._ut.ion super.stit=sta.ion de.stit=sta._ute
con.sist=sta re.sist=sta in=inI.sist=sta per.sist=sta as=ad.sist=sta ex.ist=sta ex.ist=sta.ence
ob.sta._cle ob.stin=sta.ate ar=ad.re.st=sta contra.st=sta co=con.st=sta sta._y sta._ge stat=sta.ure
stat=sta._istics
stand _under.stand _with.stand
hab._it hab._itat in=inI.hab._it ex.hib=hab._it pro.hib=hab._it in=inI.hib=hab._it re.hab
hab._itu.al ab=hab._il.ity
dorm.ant=ent dorm._it.ory
mem.ory re.mem._ber mem._o mem._oir com=con.mem._or.ate mem._or.able mem._ori.al
a=an.mnes=mne.ia mne._mon.ic a=an.mnes=mne._ty
ment=mens.al ment=mens.ion de.ment=mens com=con.ment=mens com=con.ment=mens._ary ment=mens.al.ity
mind re.mind _master.mind
strict re.strict di=dis.strict con.strict string=strict.ent strain=strict re.strain=strict
con.straint=strict stress=strict di=dis.stress=strict pre.stig=strict._e
tort.ure dis.tort con.tort ex.tort re.tort torqu=tort._e tor=tort.ment tort._u.ous
pugn._aci.ous re.pugn.ant=ent im=inI.pugn pug=pugn._il.ist
punct.ure punct._u.al punct._u.ate pung=punct.ent _acu.punct.ure point=punct ap=ad.point=punct
dis.ap=ad.point=punct poign=punct.ant=ent _pin.point=punct
ex.claim=clam pro.claim=clam ac=ad.claim=clam clam.or=er claim=clam re.claim=clam ex.clam.ation=ion
plac._id plac.ate com=con.plac.ent pleas=plac._e pleas=plac.ant=ent pleas=plac.ure
im=inN.plac.able plac._ebo
doct=doc.or=er doct=doc._rine doc._u.ment doc._ile in=inI.doct=doc._rin.ate doc.ent
disc._iple disc._ipline
ex.empt red=re.eem=empt red=re.empt.ion pre.empt pro.mpt=empt ex.ample=empt _s.ample=empt
ex.empl=empt._ary
err.or=er err err._at.ic ab.err.ation=ion err._one.ous
fals._e fals._i.fy fall=fals._acy in=inN.fall=fals.ible=able fault=fals de.fault=fals fail=fals
fail=fals.ure
flam._e flam._m.able in=inI.flam._m.able flam._boy.ant=ent flagr=flam.ant=ent
con.flagr=flam.ation=ion flam._ingo in=inI.flam._m.ation=ion
grand grand._iose grand._eur ag=ad.grand.ize grand.father grand.mother
ad.her=hes._e co=con.her=hes._e in=inI.her=hes.ent ad.hes.ive co=con.hes.ion hes._it.ate
junct.ion junct.ure con.junct.ion join=junct joint=junct ad.join=junct re.join=junct
in=inI.junct.ion sub.junct.ive junt=junct._a
yoke yog._a yog._i
lav._at.ory di=dis.lut=lav._e pol=pro.lut=lav._e laun=lav._dry laun=lav._der de.lug=lav._e
ab.lut=lav.ion lav._ish
liter.al liter._at.ure liter.ate il=inN.liter.ate al=ad.liter.ation=ion ob.liter.ate letter=liter
com=con.mand de.mand re.mand com=con.mend=mand re.com=con.mend=mand mand._at.ory
merg._e sub.merg._e e=ex.merg._e im=inI.mers=merg._e e=ex.merg.ency=ence merg.er
migr.ate im=inI.migr.ant=ent e=ex.migr.ate migr._at.ory im=inI.migr.ation=ion
mir._acle ad.mir._e mir._age mir._ror marv=mir._el mir._acul.ous ad.mir.able
mix=misc mixt=misc.ure misc._ellane.ous pro.misc._u.ous
mod._e mod._el mod._er.ate mod._ern mod._est mod._i.fy ac=ad.com=con.mod.ate com=con.mod.ity
mod._ule
mut.ate mut.ant=ent com=con.mut._e mut._u.al im=inN.mut.able per.mut.ation=ion com=con.mut.er
con.nect dis.con.nect an=ad.nex=nect nex=nect._us con.nect.ion
number=numer numer.al numer.ous e=ex.numer.ate in=inN.numer.able
oper.ate co=con.oper.ate oper._a opus=oper oper.ation=ion man.euver=oper
or=ora.al ora._cle ora.tion=ion ora._t.or=er ad.or=ora._e
order=ordin ordin._ary extra.ordin._ary co=con.ordin.ate sub.ordin.ate ordin.ance=ence
in=inN.ordin.ate
ori.ent ori._gin ori._gin.al ab.ort=ori ab.ori._gin.al ori.ent.ation=ion dis.ori.ent
par par.ity com=con.par._e com=con.par._ison dis.par.ity pair=par peer=par _um.pir=par._e
dis.par._age
pati.ent pati.ence pass=pati.ion com=con.pass=pati.ion pass=pati.ive com=con.pat=pati.ible=able
im=inN.pati.ent
pict.ure de.pict pict._ori.al paint=pict pig=pict.ment pict.ure._sque
plen.ty=ity plen._ti.ful=full com=con.plet=plen._e de.plet=plen._e re.plet=plen._e re.plen._ish
plen._ary sup=sub.ple=plen.ment im=inI.ple=plen.ment ac=ad.com=con.pl=plen._ish
com=con.pli=plen.ment com=con.ple=plen.ment plur=plen.al plus=plen sur=super.plus=plen
full fill=full ful=full.fill=full
com=con.prehend ap=ad.prehend prehens=prehend._ile com=con.pris=prehend._e
sur=super.pris=prehend._e enter=inter.pris=prehend._e pris=prehend._on im=inI.pris=prehend._on
com=con.prehens=prehend.ive ap=ad.prent=prehend._ice
prob._e prob.able prob.ation=ion prov=prob._e ap=ad.prov=prob._e proof=prob ap=ad.prov=prob.al
dis.prov=prob._e
com=con.put._e com=con.put.er dis.put._e re.put._e re.put.ation=ion de.put.y am=ambi.put.ate
quiet=quies tran=trans.quil=quies ac=ad.quit=quies quit=quies re.qui=quies._em
tran=trans.quil=quies.ity
radic.al e=ex.radic.ate radish=radic
root
rid._icule rid._icul.ous de.rid._e de.ris=rid.ion
rot.ate rot.ation=ion rot._ary rot._unda roll=rot en=inI.roll=rot cont=contra.rol=rot role=rot
sal._i.ent as=ad.sault=sal in=inI.sult=sal re.sult=sal ex.ult=sal _somer.sault=sal
re.sil=sal._i.ent
salv.ation=ion salv._age salu=salv._te salu=salv._t.ation=ion sav=salv._e saf=salv._e
sav=salv._i.or=er
sat._is.fy sat._is.fact=fac.ion sat._ur.ate sat._ire in=inN.sat._i.able
a=ad.scend de.scend tran=trans.scend de.scend.ant=ent scal=scend._e e=ex.scal=scend.ate
scan=scend con.de.scend
serv._e serv._ice serv.ant=ent con.serv._e pre.serv._e ob.serv._e re.serv._e de.serv._e
con.serv._at.ive re.serv._oir ob.serv._at.ory _des.sert=serv
soci.al soci._e.ty=ity as=ad.soci.ate soci._o.log.y anti.soci.al dis.soci.ate soci.able
sort as=ad.sort con.sort re.sort sorc=sort._ery
re.spond re.spons=spond._e spons=spond.or=er cor=con.re.spond spous=spond._e de.spond.ent
re.spons=spond.ible=able
di=dis.stinct ex.tinct=stinct in=inI.stinct di=dis.stingu=stinct._ish ex.tingu=stinct._ish
per.suad._e dis.suad._e per.suas=suad.ive suav=suad._e
sweet sweet.heart
con.sum._e as=ad.sum._e re.sum._e pre.sum._e con.sum.er as=ad.sumpt=sum.ion
pre.sumpt=sum._u.ous
sum=summ summ._ary summ._it summ._ar.ize con.summ.ate
surg._e in=inI.surg.ent re.surrect=surg in=inI.surrect=surg.ion sourc=surg._e re.sourc=surg._e
tac._it tac._iturn re.tic=tac.ent
pro.tect=teg de.tect=teg de.tect=teg.ive pro.tect=teg.ion tog=teg._a til=teg._e
pro.tect=teg.ive
term=termin termin.al termin.ate de.termin._e ex.termin.ate termin._o.log.y
de.termin.ation=ion
test._i.fy test._imony con.test pro.test test._a.ment at=ad.test de.test
text text._ile text.ure con.text text._book tiss=text._ue
tim._id in=inI.tim._id.ate
tot.al tot.al.ity
trib._ute con.trib._ute dis.trib._ute at=ad.trib._ute trib._utary re.trib._ut.ion trib._e
trib._un.al
in=inI.trud._e pro.trud._e in=inI.trus=trud.ive ex.trud._e
threat
dis.turb turb._ul.ent turb._ine per.turb turb._o troubl=turb._e turb._ul.ence
vag._ue vag._abond extra.vag.ant=ent vag._r.ant=ent
verb verb.al pro.verb verb._ose ad.verb verb._atim
word _fore.word
vest in=inI.vest in=inI.vest.ment tra=trans.vest.y di=dis.vest
vestig._e in=inI.vestig.ate in=inI.vestig.ation=ion
vict.ory vict.or=er con.vinc=vict._e con.vict e=ex.vict in=inN.vinc=vict.ible=able
pro.vinc=vict._e vanqu=vict._ish
volat._ile voll=volat._ey
re.volv._e e=ex.volv._e in=inI.volv._e re.volu=volv.tion=ion e=ex.volu=volv.tion=ion
volu=volv._me re.volt=volv re.volv.er con.volu=volv._ted
vulg.ar=al di=dis.vulg._e
corn=cornu._et corn=cornu._u.cop.ia corn=cornu._ea corn=cornu._er
horn horn._et uni.corn=cornu
corn=korn _pop.corn=korn
grain=gran gran._ite gran._ule _pome.gran.ate gran._ul.ar=al
capr._ice capr._ici.ous capr._i.corn=cornu
avi.ation=ion avi._ary avi._at.or=er
cand._le cand._id cand._id.ate cand.or=er in=inI.cand._esc.ent
fig.ure fict=fig.ion ef=ex.fig.y fig.ment con.fig.ure dis.fig.ure fict=fig.ion.al
re.lax lax re.leas=lax._e leas=lax._e
lud._icr.ous e=ex.lud._e de.lud._e al=ad.lud._e il=inI.lus=lud.ion de.lus=lud.ion inter.lud._e
pre.lud._e col=con.lus=lud.ion
de.sper.ate de.spair=sper pro.sper pro.sper.ous de.sper.ation=ion
miser miser.y miser.able com=con.miser.ate
funct.ion dys.funct.ion de.funct mal.funct.ion funct.ion.al
cop._y cop._i.ous
aesthe._t.ic an.esthes=aesthe.ia an.esthe=aesthe._t.ic kin=cin.esthe=aesthe._t.ic
nost.alg.ia an.alg._es.ic neur.alg.ia
all.egor=agor.y para.llel=all all.erg.y ali._as ali._en ali._bi
alter alter._n.ate alter._n.ative=ive alter._c.ation=ion altr=alter._u.ism
agor._a.phob.ia cat=cata.egor=agor.y cat=cata.egor=agor.ize
en=inI.erg.y erg._o.nom=nomos.ic _metall.urg=erg.y _lit.urg=erg.y org=erg._an org=erg._an.ize
org=erg._an.ism
work _net.work _home.work work._shop
caust.ic hol._o.caust caut=caust._er.ize
chir._o.pract.or=er
pract._ice pract.ic.al prag=pract._mat.ic im=inN.pract.ic.al
in=inI.clin._e de.clin._e re.clin._e clim=clin.ate clim=clin._ax clin.ic clin.ic.al
crypt crypt.ic en.crypt apo.cryph=crypt._a
pter._o.dactyl dactyl
helix=helic helic._o.pter
deca._de dec=deca.athl._on
athl._ete athl._et.ic pent.athl._on tri.athl._on
dys.lex.ia dys.top.ia
lex._icon
sym=syn.bol pro.blem=bol para.ble=bol para.bol._a hyper.bol._e meta.bol.ism em=inI.blem=bol
ball=bol._ist.ic dia.bol.ic.al sym=syn.bol.ic
chor._us choir=chor chor._eo.graph.y
mono.gam.y poly.gam.y bi.gam.y
ger=geront.iatr.ic geront._o.log.y
psych.iatr.y pod.iatr.ist ped=paed.iatr.ic ped=paed.iatr.ic.ian=ian
miso.gyn.y gyn._ec._o.log.y andr._o.gyn.ous
andr._oid
hier.arch.y hier._o.glyph
glyph
hipp._o.potam._us hipp._o.drom._e
syn.drom._e palin.drom._e
hol._ist.ic hol._o.gram=graph cat=cata.hol.ic
idi._om idi._ot idi._o.syn._crasy
klept._o.mania
syl=syn.lab._le epi.lep=lab._sy di.lemm=lab._a astr._o.lab._e
machin=mechan._e mechan.ic mechan.ism mechan.ic.al
melan.chol.y melan._in
chol._era
mim._e mim.ic pan._to.mim._e
mis=miso.anthrop._e
myth myth._o.log.y myth.ic.al
ode mel.od=ode.y par=para.od=ode.y _rhaps.od=ode.y com=komos.ed=ode.y trag.ed=ode.y
mel._o.dram._a
dram._a dram._at.ic
trag.ic
oxy.gen oxy.mor=moros._on
mor=moros._on soph._o.mor=moros._e
phil._o.soph.y phil._o.soph.er soph._istic.ate
sarc._o.phag._us
sarc._asm sarc._ast.ic
phen=phan._omenon fan=phan._tas.y phan._tom em=inI.phas=phan._is epi.phan.y dia.phan.ous
fan=phan._cy phas=phan._e
pharmac.y pharmac.ist pharmac._eutic.al
eu.phem.ism _blas.phem.y pro.phe=phem._t pro.phe=phem._cy
phras._e para.phras._e
plas._t.ic plas._ma plas._ter
pneum._on.ia pneum._at.ic a=an.pne=pneum._a
mono.pol.y olig._o.pol.y
olig.arch.y
dia._r.rhe._a hem._or.rhag=rhe._e rhyth=rhe._m
stereo.typ._e stereo
strat.eg=agog.y strat.eg=agog.ic strat.ag=agog._em
epi.taph _ceno.taph
trop.ic trop._e en=inI.trop.y heli._o.trop._e
a=an.troph.y dys.troph.y
xen._o.phob.ia
hour=hor hor._o.scop._e
arthr._itis arthr._o.pod
pest pest._i.cid._e
eco.nom=nomos.y eco.log.y eco._system
anth._o.log.y chrys.anth._emum
chrys._alis
gastr.ic gastr._o.nom=nomos.y
heart heart.y
tooth tooth._ache
two twi=two._n twi=two._ce _be.twee=two._n twi=two.light
new new._s re.new
bear bir=bear._th bur=bear._den
wheel _cart.wheel
kin kind=kin kinder=kin._garten kin._g
eat
ed.ible=able
`;

// ---- third batch (Nov 15, 2026): the classic roots-list inventory ----
Object.assign(window.ROOTED_PARTS, {
  // Latin
  sta:    ["r", "sta / stat / stit / sist", "stand", "Latin stare, Greek statos", "stand"],
  stand:  ["r", "stand", "stand", "Old English standan", "sta"],
  hab:    ["r", "hab / hib / ab", "have, hold", "Latin habere"],
  dorm:   ["r", "dorm", "sleep", "Latin dormire"],
  mem:    ["r", "mem", "remember", "Latin memor"],
  mne:    ["r", "mne / mnes", "memory", "Greek mnēmē", "mens mind"],
  mens:   ["r", "ment / mens", "mind", "Latin mens, mentis", "mne mind"],
  mind:   ["r", "mind", "mind", "Old English gemynd", "mens mne"],
  strict: ["r", "strict / string / strain / stress", "draw tight", "Latin stringere"],
  tort:   ["r", "tort / torqu / tors", "twist", "Latin torquere"],
  pugn:   ["r", "pugn / pug", "fight, fist", "Latin pugnare"],
  punct:  ["r", "punct / pung / point", "prick, point", "Latin pungere"],
  clam:   ["r", "clam / claim", "shout", "Latin clamare"],
  plac:   ["r", "plac / pleas", "please, calm", "Latin placere"],
  doc:    ["r", "doc / doct", "teach", "Latin docere"],
  disc:   ["r", "disc", "learn", "Latin discere"],
  empt:   ["r", "empt / em / ample", "take, buy", "Latin emere"],
  err:    ["r", "err", "wander, stray", "Latin errare"],
  fals:   ["r", "fals / fall / fail / fault", "deceive, fail", "Latin fallere"],
  flam:   ["r", "flam / flagr", "flame, burn", "Latin flamma, flagrare"],
  grand:  ["r", "grand", "great", "Latin grandis"],
  hes:    ["r", "her / hes", "stick, cling", "Latin haerere"],
  junct:  ["r", "junct / jung / join", "join", "Latin iungere", "yoke yog"],
  yoke:   ["r", "yoke", "yoke", "Old English geoc", "junct yog"],
  yog:    ["r", "yog", "yoke, union", "Sanskrit yoga", "junct yoke"],
  lav:    ["r", "lav / lut / laun", "wash", "Latin lavare, luere"],
  liter:  ["r", "liter / letter", "letter", "Latin littera"],
  mand:   ["r", "mand / mend", "order, entrust", "Latin mandare"],
  merg:   ["r", "merg / mers", "dip, plunge", "Latin mergere"],
  migr:   ["r", "migr", "move, travel", "Latin migrare"],
  mir:    ["r", "mir / marv", "wonder", "Latin mirari"],
  misc:   ["r", "misc / mix", "mix", "Latin miscere"],
  mod:    ["r", "mod", "measure, manner", "Latin modus"],
  mut:    ["r", "mut", "change", "Latin mutare"],
  nect:   ["r", "nect / nex", "tie, bind", "Latin nectere"],
  numer:  ["r", "numer / number", "number", "Latin numerus"],
  oper:   ["r", "oper / opus", "work", "Latin opus, operis"],
  ora:    ["r", "or / ora", "speak, pray", "Latin orare"],
  ordin:  ["r", "ordin / order", "order, rank", "Latin ordo, ordinis"],
  ori:    ["r", "ori / ort", "rise", "Latin oriri"],
  par:    ["r", "par / pair / peer", "equal", "Latin par"],
  pati:   ["r", "pat / pass", "suffer, endure", "Latin pati", "path"],
  pict:   ["r", "pict / paint", "paint", "Latin pingere, pictus"],
  plen:   ["r", "plen / plet / ple / plus", "fill, full", "Latin plenus, plere", "full"],
  full:   ["r", "full / fill / ful", "full", "Old English full", "plen"],
  prehend:["r", "prehend / prens / pris", "grasp, seize", "Latin prehendere"],
  prob:   ["r", "prob / prov / proof", "test, prove", "Latin probare"],
  put:    ["r", "put", "think, reckon, prune", "Latin putare"],
  quies:  ["r", "quies / quit / quil", "rest", "Latin quies"],
  radic:  ["r", "radic / radish", "root", "Latin radix", "root"],
  root:   ["r", "root", "root", "Old Norse rot", "radic"],
  rid:    ["r", "rid / ris", "laugh", "Latin ridere"],
  rot:    ["r", "rot / roll / role", "wheel, roll", "Latin rota, rotulus"],
  sal:    ["r", "sal / sault / sult / sil", "leap", "Latin salire"],
  salv:   ["r", "salv / salu / sav / safe", "safe, health", "Latin salvus, salus"],
  sat:    ["r", "sat", "enough, full", "Latin satis"],
  scend:  ["r", "scend / scal / scan", "climb", "Latin scandere, scala"],
  serv:   ["r", "serv", "serve, keep", "Latin servire, servare"],
  soci:   ["r", "soci", "companion", "Latin socius"],
  sort:   ["r", "sort / sorc", "lot, kind, fate", "Latin sors, sortis"],
  spond:  ["r", "spond / spons / spous", "pledge", "Latin spondere"],
  stinct: ["r", "stinct / stingu / tinct", "prick, quench", "Latin stinguere"],
  suad:   ["r", "suad / suas / suav", "urge (\"sweeten\")", "Latin suadere, suavis", "sweet"],
  sweet:  ["r", "sweet", "sweet", "Old English swēte", "suad"],
  sum:    ["r", "sum / sumpt", "take", "Latin sumere"],
  summ:   ["r", "summ / sum", "highest, total", "Latin summus"],
  surg:   ["r", "surg / surrect / sourc", "rise", "Latin surgere, from sub + regere", "reg"],
  tac:    ["r", "tac / tic", "silent", "Latin tacere"],
  teg:    ["r", "teg / tect / tog", "cover", "Latin tegere"],
  termin: ["r", "termin / term", "end, boundary", "Latin terminus"],
  test:   ["r", "test", "witness", "Latin testis"],
  text:   ["r", "text / tiss", "weave", "Latin texere"],
  tim:    ["r", "tim", "fear", "Latin timere"],
  tot:    ["r", "tot", "whole", "Latin totus"],
  trib:   ["r", "trib", "assign, pay, tribe", "Latin tribuere, tribus"],
  trud:   ["r", "trud / trus", "push, thrust", "Latin trudere", "threat"],
  threat: ["r", "threat", "press, crowd", "Old English þrēat", "trud"],
  turb:   ["r", "turb / troubl", "whirl, confusion", "Latin turba"],
  vag:    ["r", "vag", "wander", "Latin vagari"],
  verb:   ["r", "verb", "word", "Latin verbum", "word"],
  word:   ["r", "word", "word", "Old English word", "verb"],
  vest:   ["r", "vest", "clothe", "Latin vestis"],
  vestig: ["r", "vestig", "footprint, track", "Latin vestigium"],
  vict:   ["r", "vict / vinc / vanqu", "conquer", "Latin vincere"],
  volat:  ["r", "vol / volat", "fly", "Latin volare"],
  volv:   ["r", "volv / volu / volt", "roll", "Latin volvere"],
  vulg:   ["r", "vulg", "common people", "Latin vulgus"],
  cornu:  ["r", "corn", "horn", "Latin cornu", "horn"],
  horn:   ["r", "horn", "horn", "Old English horn", "cornu"],
  korn:   ["r", "corn", "grain", "Old English corn", "gran"],
  gran:   ["r", "gran / grain", "seed, grain", "Latin granum", "korn"],
  capr:   ["r", "capr", "goat", "Latin caper, capri"],
  avi:    ["r", "avi", "bird", "Latin avis"],
  cand:   ["r", "cand", "glow white", "Latin candere"],
  fig:    ["r", "fig / fict", "shape, invent", "Latin fingere, fictus"],
  lax:    ["r", "lax / leas", "loose", "Latin laxus"],
  lud:    ["r", "lud / lus", "play", "Latin ludere"],
  sper:   ["r", "sper / spair", "hope", "Latin sperare"],
  miser:  ["r", "miser", "wretched", "Latin miser"],
  funct:  ["r", "funct", "perform", "Latin fungi, functus"],
  cop:    ["r", "cop / copy", "plenty", "Latin copia"],
  // Greek
  aesthe: ["r", "aesthe / esthe", "feel, perceive", "Greek aisthanesthai"],
  alg:    ["r", "alg", "pain", "Greek algos"],
  nost:   ["r", "nost", "homecoming", "Greek nostos"],
  all:    ["r", "all / allo", "other", "Greek allos", "ali alter"],
  ali:    ["r", "ali", "other", "Latin alius", "all alter"],
  alter:  ["r", "alter / altr", "other (of two)", "Latin alter", "all ali"],
  agor:   ["r", "agor / egor", "assembly, marketplace", "Greek agora"],
  erg:    ["r", "erg / urg / org", "work", "Greek ergon", "work"],
  work:   ["r", "work", "work", "Old English weorc", "erg"],
  caust:  ["r", "caust / caut", "burn", "Greek kaiein, kaustos"],
  chir:   ["r", "chir", "hand", "Greek kheir"],
  pract:  ["r", "pract / prag", "do", "Greek prassein"],
  clin:   ["r", "clin / clim", "lean, slope, bed", "Greek klinein"],
  crypt:  ["r", "crypt / cryph", "hidden", "Greek kryptos"],
  dactyl: ["r", "dactyl", "finger", "Greek daktylos"],
  pter:   ["r", "pter", "wing, feather", "Greek pteron"],
  helic:  ["r", "helic / helix", "spiral", "Greek helix"],
  deca:   ["r", "dec / deca", "ten", "Greek deka", "dec"],
  athl:   ["r", "athl", "contest, prize", "Greek athlon"],
  dys:    ["p", "dys-", "bad, difficult", "Greek"],
  lex:    ["r", "lex", "word", "Greek lexis", "log legR"],
  bol:    ["r", "bol / ble / ball", "throw", "Greek ballein"],
  chor:   ["r", "chor / choir", "dance, chorus", "Greek khoros"],
  gam:    ["r", "gam", "marriage", "Greek gamos"],
  geront: ["r", "ger / geront", "old", "Greek gerōn"],
  iatr:   ["r", "iatr", "healer, doctor", "Greek iatros"],
  gyn:    ["r", "gyn", "woman", "Greek gynē"],
  andr:   ["r", "andr", "man, male", "Greek anēr, andros"],
  hier:   ["r", "hier", "sacred", "Greek hieros"],
  glyph:  ["r", "glyph", "carve", "Greek glyphein"],
  hipp:   ["r", "hipp", "horse", "Greek hippos"],
  potam:  ["r", "potam", "river", "Greek potamos"],
  drom:   ["r", "drom", "run, course", "Greek dromos"],
  palin:  ["r", "palin", "back, again", "Greek palin"],
  hol:    ["r", "hol", "whole", "Greek holos"],
  idi:    ["r", "idi", "one's own, private", "Greek idios"],
  klept:  ["r", "klept", "steal", "Greek kleptein"],
  lab:    ["r", "lab / lep / lemm", "take, seize", "Greek lambanein"],
  mechan: ["r", "mechan / machin", "machine, device", "Greek mēkhanē"],
  melan:  ["r", "melan", "black", "Greek melas"],
  chol:   ["r", "chol", "bile", "Greek kholē"],
  mim:    ["r", "mim", "imitate", "Greek mimos"],
  miso:   ["r", "mis / miso", "hate", "Greek misein"],
  myth:   ["r", "myth", "story", "Greek mythos"],
  ode:    ["r", "ode / od / ed", "song", "Greek ōidē"],
  mel:    ["r", "mel", "song, tune", "Greek melos"],
  dram:   ["r", "dram", "deed, play", "Greek drama"],
  komos:  ["r", "com", "revel, merrymaking", "Greek kōmos"],
  trag:   ["r", "trag", "goat", "Greek tragos"],
  oxy:    ["r", "oxy", "sharp, acid", "Greek oxys"],
  moros:  ["r", "mor", "dull, foolish", "Greek mōros"],
  soph:   ["r", "soph", "wise", "Greek sophos"],
  phag:   ["r", "phag", "eat", "Greek phagein"],
  sarc:   ["r", "sarc", "flesh", "Greek sarx, sarkos"],
  phan:   ["r", "phan / phen / fan / phas", "show, appear", "Greek phainein", "phem"],
  pharmac:["r", "pharmac", "drug", "Greek pharmakon"],
  phem:   ["r", "phem / phe", "speak", "Greek phēmi", "phan"],
  phras:  ["r", "phras", "speak, express", "Greek phrazein"],
  plas:   ["r", "plas", "mold, form", "Greek plassein"],
  pneum:  ["r", "pneum / pne", "breath, lung", "Greek pneuma"],
  pol:    ["r", "pol", "sell", "Greek pōlein"],
  olig:   ["r", "olig", "few", "Greek oligos"],
  rhe:    ["r", "rhe / rhag / rhyth", "flow", "Greek rhein"],
  stereo: ["r", "stereo", "solid", "Greek stereos"],
  strat:  ["r", "strat", "army, spreading", "Greek stratos"],
  taph:   ["r", "taph", "tomb", "Greek taphos"],
  trop:   ["r", "trop", "turn", "Greek tropos"],
  troph:  ["r", "troph", "nourish", "Greek trophē"],
  xen:    ["r", "xen", "stranger, foreign", "Greek xenos"],
  hor:    ["r", "hor / hour", "hour, season", "Greek hōra"],
  arthr:  ["r", "arthr", "joint", "Greek arthron"],
  pest:   ["r", "pest", "plague", "Latin pestis"],
  eco:    ["r", "eco", "house, household", "Greek oikos"],
  anth:   ["r", "anth", "flower", "Greek anthos"],
  chrys:  ["r", "chrys", "gold", "Greek khrysos"],
  gastr:  ["r", "gastr", "stomach", "Greek gastēr"],
  // Old English cognates
  heart:  ["r", "heart", "heart", "Old English heorte", "cord card"],
  tooth:  ["r", "tooth", "tooth", "Old English tōþ", "dent odont"],
  two:    ["r", "two / twi / twee", "two", "Old English twā", "du bi di"],
  new:    ["r", "new", "new", "Old English nīwe", "nov neo"],
  bear:   ["r", "bear / bir / bur", "carry, give birth", "Old English beran", "fer phor lat"],
  wheel:  ["r", "wheel", "wheel", "Old English hwēol", "cycl"],
  kin:    ["r", "kin / kind", "family, kind", "Old English cynn", "gen nat"],
  eat:    ["r", "eat", "eat", "Old English etan", "ed"],
  ed:     ["r", "ed", "eat", "Latin edere", "eat"],
});

// ---- fourth batch (Nov 15, 2026): words from the first playtest's misses ----
Object.assign(window.ROOTED_PARTS, {
  art:    ["r", "art", "skill, craft", "Latin ars, artis", "artus"],
  schol:  ["r", "schol / school", "leisure, lecture", "Greek skholē"],
  parare: ["r", "par / pair / per", "make ready", "Latin parare"],
});
window.ROOTED_WORDS += `
art art.ist art.ist.ic art._isan art._i.fact=fac art._i.fic=fac._e art._i.fic=fac.ial=al in=inN.ert=art
school=schol schol._ar schol._ast.ic pre.school=schol
pre.par=parare._e pre.par=parare.ation=ion se.par=parare.ate re.pair=parare ap=ad.par=parare._atus
em=inI.per=parare._or im=inI.per=parare._at.ive
sci.ent._i.fic=fac pseud=pseudo._o.sci.ent._i.fic=fac electr.ic.ian=ian extra._ne.ous gen._i.al
graph._eme herb._arium hydr._o.electr.ic mag=magn._istr.ate para.leg=legL.al
por=pro.tend por=pro.tent=tend por=pro.tent=tend.ous pre.cogn._it.ion pre.sci.ence
pre.script=scrib.ion pro.script=scrib.ion pro.fic=fac._i.ent pro.fic=fac._i.ency=ence _proli.fic=fac
pseud=pseudo._ocode star._dom syn.erg.y syn.erg._et.ic syn.thet=thes.ic temp._er temp._erat.ure
vis=vid._u.al vort=vert._ex drom._edary cosm._o.drom._e
`;

// ---- fifth batch (Nov 16, 2026): second playtest sweep ----
Object.assign(window.ROOTED_PARTS, {
  dare:   ["r", "da / dat / dit / don", "give", "Latin dare"],
  pont:   ["r", "pont", "bridge", "Latin pons, pontis"],
  poen:   ["r", "pen / pun", "penalty", "Latin poena"],
  later:  ["r", "later", "side", "Latin latus, lateris"],
  tenu:   ["r", "tenu", "thin", "Latin tenuis", "ten tend"],
  dike:   ["r", "dic", "justice", "Greek dikē", "dict"],
  aedi:   ["r", "edi / aedi", "building", "Latin aedes"],
  tempt:  ["r", "tempt", "try, test", "Latin temptare"],
});
window.ROOTED_WORDS += `
hex._a.gon.al poly.gon.al uni.later.al bi.later.al later.al log.ic.ian form._ul._a.ic form._ul.ate form._ul.ation=ion form.able
psych.iatr.ic psych.iatr.ist psych._o.log.ic.al psych._o._therapy pan.psych.ism
poly.the.ist poly.the.ist.ic the._o.dic=dike.y
anthrop._o.log.ic.al anthrop._o.log.ist
mono.nym=onym mono.lith.ic palin.drom.ic palim=palin._psest hipp._o._campus
insul.ation=ion graph.ic.al herb.al.ist
sacr._a.ment sacr._i.fic=fac.ial=al sacr._o.sanct=sacr
pont._i.fic=fac.ate pont._i.fic=fac._al edi=aedi.fic=fac._e edi=aedi.fic=fac.ation=ion
vers=vert._atile ad.dit=dare.ive ad.dit=dare.ion ad.dit=dare.ion.al ad.dict.ive
circum.cis=cid.ion patr._i.cid._e matr._i.cid._e
pen=poen.al pen=poen._alty pun=poen._ish im=inN.pun=poen.ity tenu.ous at=ad.tenu.ate ex.tenu.at=ate._ing
_sex.ist _rac.ist _pian.ist ped=paed.ant=ent ped=paed.ant=ent.ic psych._o.log.ist
archae=arch._o.log.y arche=arch._o.log.y archae=arch._o.log.ic.al arche=arch._o.log.ic.al
arch._enemy tempt tempt.ation=ion at=ad.tempt fict=fig._iti.ous magn._i.fic=fac.ation=ion
bi.col=con.later.al bi.later.al.ity col=con.later.al col=con.later.al.ity col=con.later.al.ize later.al.ity
matr._i.later.al tri.later.al uni.later.al.ism uni.later.al.ist equ._i.later.al multi.later.al
`;

// ---- sixth batch (Nov 18, 2026): first live-sheet sweep ----
Object.assign(window.ROOTED_PARTS, {
  artus:  ["r", "artic", "joint", "Latin artus, articulus", "art"],
  noc:    ["r", "noc / nox", "harm", "Latin nocere, noxa"],
  macr:   ["r", "macr", "large, long", "Greek makros"],
  icon:   ["r", "icon", "image", "Greek eikōn"],
  clast:  ["r", "clast", "break", "Greek klan"],
});
window.ROOTED_WORDS += `
auto.nom=nomos.ous spec._i.fic=fac epi.scop.al epi.scop._ate
artic=artus._le artic=artus._ul.ate artic=artus._ul.ation=ion in=inN.artic=artus._ul.ate
gram=graph._o.phon._e spectr=spec._o.scop._e spectr=spec._um spectr=spec.al
e=ex.dit=dare e=ex.dit=dare.ion e=ex.dit=dare.ion.al micro.fict=fig.ion
gram=graph._mat.ic.al scop._o.phob.ia micro.bi=bio._al micro._lens micro._bead micro macr._o macr._o.scop.ic
of=ob.fic=fac._e of=ob.fic=fac._i.al nox=noc._i.ous ob.nox=noc._i.ous in=inN.noc._ent in=inN.noc._uous in=inN.noc.ence
icon icon.ic icon._o.graph.y icon._o.clast icon._o.clast.ic
`;

// ---- seventh batch (Nov 25, 2026): live-sheet sweep ----
Object.assign(window.ROOTED_PARTS, {
  potat:  ["r", "pot / pota", "drink", "Latin potare"],
});
window.ROOTED_WORDS += `
equ._i.di=dis.st=sta.ant=ent equ._i.di=dis.st=sta.ance=ence
de.fic=fac._it de.fic=fac._i.ent de.fic=fac._i.ency=ence ef=ex.fic=fac._i.ent ef=ex.fic=fac._i.ency=ence
suf=sub.fic=fac._i.ency=ence _or._i.fic=fac._e
bene.vol.ence uni.fy uni._fi.cation=ion re=re.uni.fy sanct=sacr._imoni.ous
arthr._o.log.y neur._o.log.ist hydr._o.lys._is kin=cin.esthes=aesthe.ia kin=cin._esi._o.log.y
mega._l.odon=odont tele.path.ic man._i._pul.ate man._i._pul.ation=ion
pot=potat.able pot=potat.ion pot=potat._ation cur=cura.able in=inN.cur=cura.able
pre._medit.ate pre._medit.ation=ion flor._esc.ent fluor=flu._esc.ent fluor=flu._esc.ence=ence
`;
