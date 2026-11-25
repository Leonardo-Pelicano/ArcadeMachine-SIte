window.ReleaseEdition=Object.freeze({version:33,adm:document.documentElement.dataset.edition==='adm'});
window.LaunchCampaign={shooter:[
{name:'01 · PRIMEIRO CONTATO',pattern:'grid',kind:'scout',count:10,mix:["scout", "scout", "striker"]},{name:'02 · ASAS DO VAZIO',pattern:'v',kind:'striker',count:13,mix:["striker", "scout", "prism"]},{name:'03 · GUARDIÃO RUBRO',boss:1},
{name:'04 · CINTURÃO DE ÓRION',pattern:'ring',kind:'armor',count:14,mix:["armor", "prism", "bomber"]},{name:'05 · CORRENTES DE ÍONS',pattern:'sweep',kind:'scout',count:14,mix:["weaver", "scout", "splitter"]},{name:'06 · A ARANHA DE ÍONS',boss:2},
{name:'07 · OS TRÊS CORREDORES',pattern:'lanes',kind:'striker',count:15,mix:["sniper", "striker", "prism"]},{name:'08 · ESCOLTA ORBITAL',pattern:'orbit',kind:'armor',count:16,mix:["carrier", "armor", "splitter"]},{name:'09 · SENTINELA HEXA',boss:3},
{name:'10 · VÉU DA NEBULOSA',pattern:'sweep',kind:'striker',count:18,mix:["phantom", "weaver", "sniper"]},{name:'11 · PULSAR BINÁRIO',pattern:'ring',kind:'armor',count:18,mix:["splitter", "prism", "bomber", "carrier"]},{name:'12 · LEVIATÃ',boss:4},
{name:'13 · FRONTEIRA ESCURA',pattern:'v',kind:'armor',count:19,mix:["carrier", "phantom", "sniper", "armor"]},{name:'14 · ÚLTIMA FORMAÇÃO',pattern:'orbit',kind:'striker',count:20,mix:["phantom", "splitter", "weaver", "bomber"]},{name:'15 · ECLIPSE / NÚCLEO FINAL',boss:5}],
pilot:[{name:'RESGATE EM ÓRION',seconds:25,crystals:2,portals:1},{name:'GELO EM MOVIMENTO',seconds:30,crystals:3,portals:1},{name:'CAMPO DE SATÉLITES',seconds:30,crystals:3,portals:2},{name:'TEMPESTADE DE ÍONS',seconds:35,crystals:4,portals:2},{name:'FUGA DA NEBULOSA',seconds:35,crystals:4,portals:2},{name:'O ÚLTIMO SALTO',seconds:40,crystals:5,portals:3}]};

window.ClassicPause={active:false,reset(){this.active=false;document.querySelectorAll(".classic-pause-layer").forEach(e=>e.hidden=true);document.querySelectorAll("[data-classic-pause]").forEach(e=>e.textContent="PAUSAR");}};
