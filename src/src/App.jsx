import { useState, useRef, useEffect } from "react";
import { CONFIG } from "./config.js";

// ═══════════════════════════════════════════════════════════
//  QR CODE — geração nativa, sem dependências externas
// ═══════════════════════════════════════════════════════════
const QRGen = (() => {
  const gf = (() => {
    const t=[], e=[]; let i=1;
    for(let j=0;j<255;j++){t[j]=i;e[i]=j;i=(i<<=1)>=256?i^285:i;}
    return { mul:(a,b)=>a&&b?t[(e[a]+e[b])%255]:0, exp:t };
  })();
  const rs=(data,nec)=>{
    const g=[1];
    for(let i=0;i<nec;i++){const b=gf.exp[i];const nb=[];for(let j=0;j<=g.length;j++)nb[j]=(j<g.length?gf.mul(g[j],b):0)^(j>0?gf.mul(g[j-1],b):0);g.splice(0,g.length,...nb.slice(0,g.length+1));}
    const d=[...data,...new Array(nec).fill(0)];
    for(let i=0;i<data.length;i++){const c=d[i];if(!c)continue;for(let j=0;j<g.length;j++)d[i+j+1]^=gf.mul(g[j],c);}
    return d.slice(data.length);
  };
  const encode=text=>{
    const bytes=[...text].map(c=>c.charCodeAt(0)),bits=[];
    const push=(v,l)=>{for(let i=l-1;i>=0;i--)bits.push((v>>i)&1);};
    push(4,4);push(bytes.length,8);bytes.forEach(b=>push(b,8));push(0,4);
    while(bits.length%8)bits.push(0);
    const data=[];
    for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b,j)=>a+(b<<(7-j)),0));
    const cap=136;
    while(data.length<cap){data.push(0xEC);if(data.length<cap)data.push(0x11);}
    return data.slice(0,cap);
  };
  const mkMatrix=(data,ec)=>{
    const size=37,m=Array.from({length:size},()=>new Array(size).fill(-1)),f=Array.from({length:size},()=>new Array(size).fill(false));
    const pl=(r,c,v,fix=false)=>{if(r>=0&&r<size&&c>=0&&c<size){m[r][c]=v;if(fix)f[r][c]=true;}};
    [[0,0],[0,size-7],[size-7,0]].forEach(([br,bc])=>{
      for(let r=-1;r<=7;r++)for(let c=-1;c<=7;c++){
        if(r<0||r>7||c<0||c>7)continue;
        pl(br+r,bc+c,(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))?1:0,true);
      }
    });
    for(let i=8;i<size-8;i++){pl(6,i,i%2===0?1:0,true);pl(i,6,i%2===0?1:0,true);}
    pl(size-8,8,1,true);
    [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0].forEach((v,i)=>{
      const p1=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
      const p2=[[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],[8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]];
      pl(...p1[i],v,true);pl(...p2[i],v,true);
    });
    const allBits=[...data,...ec].reduce((a,b)=>{for(let i=7;i>=0;i--)a.push((b>>i)&1);return a;},[]);
    let bit=0;
    for(let col=size-1;col>=1;col-=2){
      if(col===6)col--;
      for(let i=0;i<size;i++){
        for(let dx=0;dx<2;dx++){
          const r=col%4<2?i:size-1-i,c=col-dx;
          if(!f[r][c]&&bit<allBits.length)pl(r,c,allBits[bit++]);
        }
      }
    }
    return m;
  };
  return {
    draw(url,canvas,size){
      try{
        const data=encode(url),ec=rs(data,100),m=mkMatrix(data,ec),rows=m.length;
        const ctx=canvas.getContext("2d"),cell=size/rows;
        canvas.width=size;canvas.height=size;
        ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);
        m.forEach((row,r)=>row.forEach((v,c)=>{if(v===1){ctx.fillStyle=CONFIG.corPrimaria;ctx.fillRect(Math.round(c*cell),Math.round(r*cell),Math.ceil(cell),Math.ceil(cell));}}));
      }catch{canvas.width=size;canvas.height=size;}
    }
  };
})();

function QRCanvas({url,size=140}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&url)QRGen.draw(url,ref.current,size);},[url,size]);
  return <canvas ref={ref} style={{display:"block",imageRendering:"pixelated"}}/>;
}

// ═══════════════════════════════════════════════════════════
//  ÍCONES SVG
// ═══════════════════════════════════════════════════════════
const Ic=({d,s=18,sw=1.8,fill="none"})=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d={d}/>
  </svg>
);
const StarSvg=({on})=>(
  <svg width={15} height={15} viewBox="0 0 24 24" fill={on?CONFIG.corDestaque:"none"} stroke={on?CONFIG.corDestaque:"#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const LOGO_PATHS={
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  cross:"M12 2v20M2 12h20",
  heart:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};
function LogoMark({size=36}){
  const {logoTipo,logoImagemUrl}=CONFIG;
  if(logoTipo==="custom"&&logoImagemUrl)
    return <img src={logoImagemUrl} alt="logo" style={{width:size,height:size,borderRadius:Math.round(size*.22),objectFit:"contain",background:CONFIG.corDestaque,padding:4}}/>;
  return(
    <div style={{width:size,height:size,background:CONFIG.corDestaque,borderRadius:Math.round(size*.22),display:"flex",alignItems:"center",justifyContent:"center",color:CONFIG.corPrimaria,flexShrink:0}}>
      <Ic d={LOGO_PATHS[logoTipo]||LOGO_PATHS.shield} s={Math.round(size*.55)} sw={2}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DADOS DE EXEMPLO
// ═══════════════════════════════════════════════════════════
const FICHAS_INICIAIS=[
  {id:"f1",nome:"Dengue",categoria:"Arboviroses",descricao:"Notificação obrigatória de casos suspeitos e confirmados de dengue conforme Portaria GM/MS nº 217/2023.",atualizadoEm:"2024-03-15",linkPdf:"",favorito:false,acessos:0},
  {id:"f2",nome:"Tuberculose",categoria:"Doenças Respiratórias",descricao:"Ficha de notificação e investigação de tuberculose pulmonar e extrapulmonar para o SINAN.",atualizadoEm:"2024-02-28",linkPdf:"",favorito:false,acessos:0},
  {id:"f3",nome:"Hanseníase",categoria:"Doenças Crônicas",descricao:"Notificação compulsória de casos suspeitos de hanseníase com classificação operacional.",atualizadoEm:"2024-01-10",linkPdf:"",favorito:false,acessos:0},
  {id:"f4",nome:"Sífilis Congênita",categoria:"IST/HIV",descricao:"Notificação obrigatória de sífilis congênita e sífilis em gestante para o SINAN.",atualizadoEm:"2024-03-20",linkPdf:"",favorito:true,acessos:2},
  {id:"f5",nome:"Violência Doméstica",categoria:"Violências e Acidentes",descricao:"Notificação de violência doméstica, sexual e outras formas de violência interpessoal.",atualizadoEm:"2024-02-14",linkPdf:"",favorito:false,acessos:0},
];
const FLUXOS_INICIAIS=[
  {id:"fl1",nome:"Fluxo de Atendimento — Dengue",categoria:"Arboviroses",descricao:"Protocolo operacional padrão para triagem, classificação de risco e encaminhamento de casos suspeitos de dengue na UBS.",atualizadoEm:"2024-03-10",linkPdf:"",favorito:false,acessos:0},
  {id:"fl2",nome:"Fluxo de Notificação — Tuberculose",categoria:"Doenças Respiratórias",descricao:"Passo a passo para notificação, baciloscopia, início de tratamento e busca ativa de contatos.",atualizadoEm:"2024-02-20",linkPdf:"",favorito:false,acessos:0},
  {id:"fl3",nome:"Fluxo de Violência Sexual",categoria:"Violências e Acidentes",descricao:"Protocolo de acolhimento, notificação compulsória e encaminhamento para profilaxias em caso de violência sexual.",atualizadoEm:"2024-01-30",linkPdf:"",favorito:false,acessos:0},
];
const TECNICOS_INICIAIS=[
  {id:"t1",nome:"Dra. Ana Paula Souza",cargo:"Enfermeira — Vigilância Epidemiológica",formacao:"Enfermagem — UFBA | Especialização em Epidemiologia",email:"ana.souza@saude.gov.br",telefone:"(71) 9 9999-1111",foto:"",agravos:["Dengue","Tuberculose","Hanseníase"],bio:"Responsável técnica pelas notificações de doenças transmissíveis. Coordena a vigilância epidemiológica da UBS desde 2019."},
  {id:"t2",nome:"Dr. Carlos Mendes",cargo:"Médico — Infectologia",formacao:"Medicina — UFMG | Residência em Infectologia",email:"carlos.mendes@saude.gov.br",telefone:"(71) 9 9999-2222",foto:"",agravos:["Sífilis Congênita","IST/HIV","Tuberculose"],bio:"Especialista em doenças infecciosas. Referência técnica para casos de IST e HIV na Atenção Primária."},
  {id:"t3",nome:"Enf. Beatriz Lima",cargo:"Enfermeira — NASF",formacao:"Enfermagem — UNEB | Especialização em Saúde da Família",email:"beatriz.lima@saude.gov.br",telefone:"(71) 9 9999-3333",foto:"",agravos:["Violência Doméstica","Saúde Mental"],bio:"Integrante do NASF-AB com foco em saúde da mulher, criança e enfrentamento à violência doméstica."},
];

// ═══════════════════════════════════════════════════════════
//  CSS GLOBAL
// ═══════════════════════════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --nv:${CONFIG.corPrimaria};
  --nv2:#1a3566;
  --yl:${CONFIG.corDestaque};
  --yl2:${CONFIG.corDestaqueEscuro};
  --ylp:#FFFBEC;
  --g1:#F7F8FC;--g2:#E8E8E8;--g4:#B0B0B0;--g5:#828282;--g7:#4A4A4A;--g9:#1A1A1A;
  --wh:#FFFFFF;--rd:#E53E3E;--gn:#38A169;
  --s1:0 1px 4px rgba(0,0,0,.07);
  --s2:0 4px 18px rgba(0,0,0,.10);
  --s3:0 12px 36px rgba(0,0,0,.15);
  --tr:.18s ease;--r:10px;
}
html,body,#root{min-height:100%;}
body{font-family:'DM Sans',sans-serif;background:var(--g1);color:var(--g7);-webkit-font-smoothing:antialiased;}
button,select,input,textarea{font-family:inherit;}

/* ── HEADER ── */
.hdr{background:var(--nv);position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(0,0,0,.25);}
.hdr-in{max-width:1200px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:10px;height:62px;}
.logo-btn{display:flex;align-items:center;gap:10px;border:none;background:none;cursor:pointer;padding:0;text-decoration:none;}
.logo-txt .t{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:#fff;line-height:1.1;}
.logo-txt .s{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;}
.hsp{flex:1;}
.hnav{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.np{padding:6px 12px;border-radius:20px;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:var(--tr);display:flex;align-items:center;gap:5px;white-space:nowrap;}
.np.a{background:var(--yl);color:var(--nv);}
.np.g{background:none;color:rgba(255,255,255,.7);}
.np.g:hover{background:rgba(255,255,255,.1);color:#fff;}
.abadge{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:var(--yl);font-size:12px;font-weight:600;}

/* ── HERO ── */
.hero{background:var(--nv);padding:44px 20px 52px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(255,255,255,.05) 0%,transparent 60%),radial-gradient(ellipse at 0% 100%,rgba(0,0,0,.2) 0%,transparent 50%);}
.hero-in{max-width:1200px;margin:0 auto;position:relative;}
.eyebrow{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);color:var(--yl);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;}
.hero h1{font-family:'Sora',sans-serif;font-size:clamp(22px,4vw,34px);font-weight:800;color:#fff;line-height:1.25;margin-bottom:10px;}
.hero h1 em{color:var(--yl);font-style:normal;}
.hero p{font-size:14px;color:rgba(255,255,255,.6);max-width:560px;line-height:1.65;margin-bottom:26px;}
.stats{display:flex;gap:20px;flex-wrap:wrap;}
.stat{display:flex;align-items:center;gap:8px;}
.stat-n{font-family:'Sora',sans-serif;font-size:22px;font-weight:800;color:var(--yl);}
.stat-l{font-size:11px;color:rgba(255,255,255,.5);line-height:1.35;}

/* ── SECTION TABS ── */
.page-tabs{max-width:1200px;margin:0 auto;padding:20px 20px 0;display:flex;gap:6px;flex-wrap:wrap;}
.ptab{padding:8px 18px;border-radius:20px;border:1.5px solid var(--g2);background:var(--wh);cursor:pointer;font-size:13px;font-weight:600;color:var(--g5);transition:var(--tr);display:flex;align-items:center;gap:6px;box-shadow:var(--s1);}
.ptab.a{background:var(--nv);color:var(--wh);border-color:var(--nv);}
.ptab:hover:not(.a){background:var(--g1);color:var(--nv);border-color:var(--nv);}

/* ── MAIN ── */
.main{max-width:1200px;margin:0 auto;padding:22px 20px 60px;}

/* ── SEARCH BAR ── */
.sbar{background:var(--wh);border-radius:14px;padding:16px 18px;box-shadow:var(--s2);display:flex;gap:10px;align-items:flex-end;margin-bottom:22px;flex-wrap:wrap;}
.sf{flex:1;min-width:170px;}
.sf label{display:block;font-size:11px;font-weight:600;color:var(--g5);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;}
.siw{position:relative;}
.siw svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--g4);pointer-events:none;}
.si{width:100%;padding:9px 12px 9px 36px;border:1.5px solid var(--g2);border-radius:var(--r);font-size:14px;color:var(--g9);background:var(--g1);outline:none;transition:var(--tr);}
.si:focus{border-color:var(--nv);background:var(--wh);box-shadow:0 0 0 3px rgba(10,31,68,.06);}
.fsel{width:100%;padding:9px 32px 9px 11px;border:1.5px solid var(--g2);border-radius:var(--r);font-size:14px;color:var(--g9);background:var(--g1) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23828282' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 10px center;appearance:none;outline:none;transition:var(--tr);cursor:pointer;}
.fsel:focus{border-color:var(--nv);background-color:var(--wh);}
.rcount{font-size:13px;color:var(--g5);white-space:nowrap;padding-bottom:10px;}
.rcount strong{color:var(--nv);}

/* ── SECTION HDR ── */
.sec{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.sec-t{font-family:'Sora',sans-serif;font-size:17px;font-weight:700;color:var(--nv);}
.sec-t span{color:var(--g4);font-size:13px;font-weight:400;margin-left:6px;}

/* ── CARDS FICHAS / FLUXOS ── */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.card{background:var(--wh);border-radius:14px;box-shadow:var(--s1);border:1.5px solid var(--g2);display:flex;flex-direction:column;transition:transform var(--tr),box-shadow var(--tr),border-color var(--tr);}
.card:hover{transform:translateY(-3px);box-shadow:var(--s3);border-color:rgba(10,31,68,.12);}
.card-top{padding:16px 16px 12px;border-bottom:1px solid var(--g2);display:flex;align-items:flex-start;gap:11px;}
.card-ico{width:42px;height:42px;border-radius:9px;background:var(--ylp);border:1.5px solid rgba(242,201,76,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--yl2);}
.card-ico.flow{background:rgba(10,31,68,.06);border-color:rgba(10,31,68,.12);color:var(--nv2);}
.card-meta{flex:1;min-width:0;}
.card-nome{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:var(--nv);line-height:1.3;margin-bottom:4px;}
.card-cat{display:inline-block;padding:2px 7px;border-radius:4px;background:rgba(10,31,68,.06);color:var(--g5);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;}
.card-fav{background:none;border:none;cursor:pointer;padding:2px;border-radius:4px;transition:var(--tr);}
.card-fav:hover{background:var(--g1);}
.card-body{padding:12px 16px;flex:1;}
.card-desc{font-size:12.5px;color:var(--g7);line-height:1.55;}
.card-data{font-size:11px;color:var(--g4);margin-top:8px;display:flex;align-items:center;gap:4px;}
.card-acoes{padding:11px 16px;display:flex;gap:5px;flex-wrap:wrap;border-top:1px solid var(--g2);background:var(--g1);}
.btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:500;transition:var(--tr);text-decoration:none;}
.btn.p{background:var(--nv);color:#fff;}.btn.p:hover{filter:brightness(1.15);}
.btn.s{background:var(--wh);color:var(--g7);border:1.5px solid var(--g2);}.btn.s:hover{background:var(--g2);}
.btn.y{background:var(--yl);color:var(--nv);}.btn.y:hover{background:var(--yl2);}
.btn.fl{background:rgba(10,31,68,.07);color:var(--nv);}.btn.fl:hover{background:rgba(10,31,68,.13);}

/* ── RECENTES ── */
.rec{background:var(--wh);border-radius:12px;padding:12px 16px;box-shadow:var(--s1);margin-bottom:20px;border:1.5px solid var(--g2);display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.rec-lbl{font-size:11px;font-weight:700;color:var(--g5);text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;}
.rchip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:var(--g1);border:1px solid var(--g2);font-size:12px;color:var(--g7);cursor:pointer;transition:var(--tr);}
.rchip:hover{background:var(--ylp);border-color:rgba(242,201,76,.4);color:var(--nv);}
.rdot{width:5px;height:5px;border-radius:50%;background:var(--yl);}

/* ── TÉCNICOS ── */
.tec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;}
.tec-card{background:var(--wh);border-radius:16px;box-shadow:var(--s2);border:1.5px solid var(--g2);overflow:hidden;transition:transform var(--tr),box-shadow var(--tr);}
.tec-card:hover{transform:translateY(-3px);box-shadow:var(--s3);}
.tec-header{background:var(--nv);padding:20px;display:flex;gap:14px;align-items:center;}
.tec-avatar{width:56px;height:56px;border-radius:50%;background:var(--yl);display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:20px;font-weight:800;color:var(--nv);flex-shrink:0;overflow:hidden;border:3px solid rgba(255,255,255,.2);}
.tec-avatar img{width:100%;height:100%;object-fit:cover;}
.tec-info{flex:1;min-width:0;}
.tec-nome{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:3px;}
.tec-cargo{font-size:11px;color:rgba(255,255,255,.55);}
.tec-body{padding:16px;}
.tec-bio{font-size:13px;color:var(--g7);line-height:1.55;margin-bottom:14px;}
.tec-form{font-size:12px;color:var(--g5);margin-bottom:12px;display:flex;align-items:flex-start;gap:6px;}
.tec-contatos{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.tec-contato{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--g7);}
.tec-contato a{color:var(--nv);text-decoration:none;font-weight:500;}
.tec-contato a:hover{text-decoration:underline;}
.tec-agravos{display:flex;flex-wrap:wrap;gap:5px;}
.tec-tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;background:var(--ylp);border:1px solid rgba(242,201,76,.4);font-size:11px;font-weight:600;color:var(--yl2);}
.tec-footer{padding:12px 16px;border-top:1px solid var(--g2);background:var(--g1);display:flex;gap:6px;flex-wrap:wrap;}

/* ── QR PAGE ── */
.qrp{max-width:1200px;margin:0 auto;padding:22px 20px 60px;}
.qr-hero{background:var(--nv);border-radius:16px;padding:30px;margin-bottom:22px;position:relative;overflow:hidden;}
.qr-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 90% 10%,rgba(255,255,255,.06) 0%,transparent 55%);}
.qr-hero-in{position:relative;display:flex;gap:24px;align-items:center;flex-wrap:wrap;}
.qr-txt{flex:1;min-width:200px;}
.qr-txt h2{font-family:'Sora',sans-serif;font-size:24px;font-weight:800;color:#fff;margin-bottom:8px;line-height:1.2;}
.qr-txt h2 em{color:var(--yl);font-style:normal;}
.qr-txt p{font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;}
.qr-box{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:18px;text-align:center;flex-shrink:0;}
.qr-cv{background:var(--wh);border-radius:9px;padding:10px;display:inline-block;box-shadow:0 6px 24px rgba(0,0,0,.2);}
.qr-hint{font-size:11px;color:rgba(255,255,255,.45);margin-top:8px;}
.url-box{background:var(--wh);border-radius:13px;border:1.5px solid var(--g2);box-shadow:var(--s2);padding:20px;margin-bottom:20px;}
.url-box h3{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:var(--nv);margin-bottom:4px;}
.url-box p{font-size:12px;color:var(--g5);margin-bottom:12px;line-height:1.5;}
.url-row{display:flex;gap:8px;flex-wrap:wrap;}
.url-in{flex:1;min-width:160px;padding:10px 13px;border:1.5px solid var(--g2);border-radius:var(--r);font-size:13px;outline:none;transition:var(--tr);color:var(--g9);}
.url-in:focus{border-color:var(--nv);}
.url-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border:none;border-radius:var(--r);font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:var(--tr);white-space:nowrap;}
.url-btn.nv{background:var(--nv);color:#fff;}.url-btn.nv:hover{filter:brightness(1.15);}
.url-btn.yl{background:var(--yl);color:var(--nv);}.url-btn.yl:hover{background:var(--yl2);}
.url-btn.sc{background:var(--g1);color:var(--g7);border:1.5px solid var(--g2);}.url-btn.sc:hover{background:var(--g2);}
.tip{background:rgba(10,31,68,.04);border:1.5px solid rgba(10,31,68,.08);border-radius:8px;padding:10px 13px;font-size:12px;color:var(--g7);margin-top:10px;line-height:1.6;}
.psec{background:var(--wh);border-radius:13px;border:1.5px solid var(--g2);box-shadow:var(--s2);padding:20px;margin-bottom:20px;}
.psec h3{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:var(--nv);margin-bottom:4px;}
.psec p{font-size:12px;color:var(--g5);margin-bottom:14px;line-height:1.5;}
.pprev{border:2px dashed var(--g2);border-radius:12px;padding:16px;background:var(--g1);margin-bottom:14px;}
.pcard{background:var(--wh);border-radius:12px;max-width:400px;margin:0 auto;overflow:hidden;box-shadow:var(--s3);}
.pcard-top{background:var(--nv);padding:15px 20px;display:flex;align-items:center;gap:12px;}
.pcard-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:800;color:#fff;line-height:1.2;}
.pcard-sub{font-size:10px;color:rgba(255,255,255,.45);}
.pcard-body{padding:16px 20px;display:flex;gap:14px;align-items:center;}
.pcard-qr{background:var(--wh);border:2px solid var(--g2);border-radius:8px;padding:6px;flex-shrink:0;}
.pcard-info h4{font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:var(--nv);margin-bottom:5px;}
.pcard-info p{font-size:11px;color:var(--g7);line-height:1.5;margin-bottom:7px;}
.pcard-url{font-size:9.5px;color:var(--g5);background:var(--g1);padding:5px 7px;border-radius:5px;border:1px solid var(--g2);word-break:break-all;}
.pcard-foot{background:var(--nv);padding:8px 20px;display:flex;justify-content:space-between;align-items:center;}
.pcard-foot span{font-size:9px;color:rgba(255,255,255,.4);}
.pcard-foot strong{font-size:10px;color:var(--yl);font-family:'Sora',sans-serif;}
.pact{display:flex;gap:8px;flex-wrap:wrap;}
.pbtn{display:inline-flex;align-items:center;gap:5px;padding:9px 14px;border-radius:var(--r);font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:var(--tr);}
.pbtn.nv{background:var(--nv);color:#fff;}.pbtn.nv:hover{filter:brightness(1.15);}
.pbtn.yl{background:var(--yl);color:var(--nv);}.pbtn.yl:hover{background:var(--yl2);}
.pbtn.sc{background:var(--g1);color:var(--g7);border:1.5px solid var(--g2);}.pbtn.sc:hover{background:var(--g2);}
.qrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-bottom:24px;}
.qrnc{background:var(--wh);border-radius:12px;border:1.5px solid var(--g2);box-shadow:var(--s1);overflow:hidden;transition:var(--tr);}
.qrnc:hover{transform:translateY(-2px);box-shadow:var(--s2);}
.qrnc-top{background:var(--nv);padding:12px 14px;display:flex;align-items:center;gap:9px;}
.qrnc-ico{width:30px;height:30px;background:rgba(255,255,255,.1);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--yl);}
.qrnc-nome{font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:#fff;}
.qrnc-cat{font-size:10px;color:rgba(255,255,255,.4);margin-top:1px;}
.qrnc-body{padding:12px;display:flex;gap:10px;align-items:center;}
.qrnc-qr{background:var(--wh);border:1.5px solid var(--g2);border-radius:7px;padding:5px;flex-shrink:0;}
.qrnc-info{flex:1;}
.qrnc-desc{font-size:11px;color:var(--g7);line-height:1.5;margin-bottom:8px;}
.qrnc-acts{display:flex;gap:5px;flex-wrap:wrap;}
.qbtn{display:inline-flex;align-items:center;gap:3px;padding:5px 8px;border-radius:6px;border:none;cursor:pointer;font-size:11px;font-weight:500;transition:var(--tr);}
.qbtn.p{background:var(--nv);color:#fff;}.qbtn.p:hover{filter:brightness(1.15);}
.qbtn.s{background:var(--g1);color:var(--g7);border:1px solid var(--g2);}.qbtn.s:hover{background:var(--g2);}

/* ── DEPLOY GUIDE ── */
.deploy{max-width:1200px;margin:0 auto;padding:22px 20px 60px;}
.deploy-hero{background:var(--nv);border-radius:16px;padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden;}
.deploy-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 85% 0%,rgba(255,255,255,.06) 0%,transparent 60%);}
.deploy-hero h2{font-family:'Sora',sans-serif;font-size:26px;font-weight:800;color:#fff;position:relative;margin-bottom:8px;}
.deploy-hero h2 em{color:var(--yl);font-style:normal;}
.deploy-hero p{font-size:14px;color:rgba(255,255,255,.6);position:relative;line-height:1.65;}
.d-section{background:var(--wh);border-radius:14px;border:1.5px solid var(--g2);box-shadow:var(--s1);padding:24px;margin-bottom:18px;}
.d-section h3{font-family:'Sora',sans-serif;font-size:16px;font-weight:700;color:var(--nv);margin-bottom:4px;display:flex;align-items:center;gap:8px;}
.d-section .d-sub{font-size:12px;color:var(--g5);margin-bottom:18px;line-height:1.5;}
.steps-v{display:flex;flex-direction:column;gap:0;}
.step-v{display:flex;gap:14px;position:relative;}
.step-v:not(:last-child)::before{content:'';position:absolute;left:15px;top:36px;bottom:0;width:2px;background:var(--g2);}
.step-num{width:32px;height:32px;border-radius:50%;background:var(--nv);color:var(--yl);display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:14px;font-weight:800;flex-shrink:0;z-index:1;}
.step-content{flex:1;padding-bottom:20px;}
.step-content h4{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:var(--nv);margin-bottom:5px;}
.step-content p{font-size:13px;color:var(--g7);line-height:1.6;margin-bottom:8px;}
.step-content code,.code-block{background:rgba(10,31,68,.06);border:1px solid rgba(10,31,68,.1);border-radius:6px;padding:2px 7px;font-family:monospace;font-size:12px;color:var(--nv);}
.code-block{display:block;padding:12px 14px;white-space:pre-wrap;margin:8px 0;line-height:1.7;font-size:12.5px;}
.d-note{background:var(--ylp);border:1.5px solid rgba(242,201,76,.4);border-radius:8px;padding:11px 14px;font-size:12px;color:var(--g7);line-height:1.6;margin-top:8px;}
.d-note strong{color:var(--nv);}
.method-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.mtab{padding:8px 16px;border-radius:20px;border:1.5px solid var(--g2);background:var(--g1);cursor:pointer;font-size:13px;font-weight:600;color:var(--g5);transition:var(--tr);}
.mtab.a{background:var(--nv);color:#fff;border-color:var(--nv);}
.share-box{background:rgba(10,31,68,.04);border:1.5px solid rgba(10,31,68,.09);border-radius:12px;padding:18px;margin-top:12px;}
.share-box h4{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:var(--nv);margin-bottom:12px;}
.share-row{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;}
.share-input{flex:1;min-width:160px;padding:10px 13px;border:1.5px solid var(--g2);border-radius:var(--r);font-size:13px;outline:none;color:var(--g9);background:var(--wh);}
.share-qr-preview{background:var(--wh);border-radius:10px;padding:12px;display:inline-flex;flex-direction:column;align-items:center;gap:8px;border:1.5px solid var(--g2);box-shadow:var(--s1);margin-top:10px;}
.share-qr-preview span{font-size:11px;color:var(--g5);}

/* ── ADMIN ── */
.adm{max-width:1200px;margin:0 auto;padding:22px 20px 60px;}
.adm-hdr{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.adm-title{font-family:'Sora',sans-serif;font-size:22px;font-weight:800;color:var(--nv);flex:1;}
.add-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--yl);color:var(--nv);border:none;border-radius:var(--r);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:var(--tr);}
.add-btn:hover{background:var(--yl2);transform:translateY(-1px);}
.adm-tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
.atab{padding:7px 16px;border-radius:20px;border:1.5px solid var(--g2);background:var(--wh);cursor:pointer;font-size:13px;font-weight:600;color:var(--g5);transition:var(--tr);}
.atab.a{background:var(--nv);color:#fff;border-color:var(--nv);}
.tbl-wrap{background:var(--wh);border-radius:13px;box-shadow:var(--s2);overflow:hidden;border:1.5px solid var(--g2);overflow-x:auto;}
.tbl{width:100%;border-collapse:collapse;min-width:600px;}
.tbl th{background:var(--nv);color:#fff;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:12px 15px;text-align:left;white-space:nowrap;}
.tbl td{padding:12px 15px;font-size:13px;color:var(--g7);border-bottom:1px solid var(--g2);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:var(--g1);}
.tbadge{display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(10,31,68,.07);font-size:11px;font-weight:600;color:var(--nv);}
.tact{display:flex;gap:5px;}
.ib{width:30px;height:30px;border-radius:7px;border:1.5px solid var(--g2);background:var(--wh);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr);color:var(--g5);}
.ib.e:hover{background:var(--ylp);border-color:rgba(242,201,76,.5);color:var(--yl2);}
.ib.d:hover{background:#FFF5F5;border-color:var(--rd);color:var(--rd);}

/* ── LOGIN ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
.lbox{background:var(--wh);border-radius:20px;padding:34px 30px;width:100%;max-width:370px;box-shadow:var(--s3);animation:su .3s ease;position:relative;}
@keyframes su{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.lh{font-family:'Sora',sans-serif;font-size:20px;font-weight:800;color:var(--nv);text-align:center;margin-bottom:4px;}
.ls{font-size:13px;color:var(--g5);text-align:center;margin-bottom:22px;}
.fg{margin-bottom:13px;}
.fl{display:block;font-size:11px;font-weight:700;color:var(--g7);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em;}
.fi{width:100%;padding:10px 13px;border:1.5px solid var(--g2);border-radius:var(--r);font-size:14px;outline:none;transition:var(--tr);color:var(--g9);}
.fi:focus{border-color:var(--nv);box-shadow:0 0 0 3px rgba(10,31,68,.06);}
.fi.err{border-color:var(--rd);}
.lbtn{width:100%;padding:12px;background:var(--nv);color:#fff;border:none;border-radius:var(--r);font-family:'Sora',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:var(--tr);margin-top:6px;}
.lbtn:hover{filter:brightness(1.15);}
.lerr{background:#FFF5F5;border:1px solid #FED7D7;color:var(--rd);border-radius:7px;padding:9px 12px;font-size:13px;margin-bottom:12px;text-align:center;}
.lhint{font-size:11px;color:var(--g4);text-align:center;margin-top:12px;}
.lx{position:absolute;top:12px;right:12px;background:var(--g1);border:none;cursor:pointer;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--g5);}
.lx:hover{background:var(--g2);}

/* ── MODAL ── */
.mo-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;}
.mo{background:var(--wh);border-radius:18px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:var(--s3);animation:su .22s ease;}
.mo-hdr{padding:20px 22px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.mo-t{font-family:'Sora',sans-serif;font-size:17px;font-weight:800;color:var(--nv);}
.mo-x{background:var(--g1);border:none;cursor:pointer;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--g5);}
.mo-x:hover{background:var(--g2);}
.mo-body{padding:0 22px 22px;}
.mo-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;}
.bc{padding:9px 18px;background:var(--g1);color:var(--g7);border:none;border-radius:var(--r);font-size:14px;font-weight:500;cursor:pointer;}
.bc:hover{background:var(--g2);}
.bs{padding:9px 22px;background:var(--nv);color:#fff;border:none;border-radius:var(--r);font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;}
.bs:hover{filter:brightness(1.15);}
.uz{border:2px dashed var(--g2);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:var(--tr);}
.uz:hover{border-color:var(--yl);background:var(--ylp);}
.fc{display:flex;align-items:center;gap:7px;padding:8px 12px;background:var(--ylp);border-radius:7px;font-size:13px;color:var(--nv);font-weight:500;margin-top:8px;border:1px solid rgba(242,201,76,.35);}
.dnote{background:rgba(10,31,68,.04);border:1.5px solid rgba(10,31,68,.08);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--g7);margin-top:10px;line-height:1.55;}
.tags-select{display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;}
.tag-opt{padding:4px 10px;border-radius:20px;border:1.5px solid var(--g2);background:var(--g1);font-size:12px;font-weight:500;color:var(--g7);cursor:pointer;transition:var(--tr);}
.tag-opt.sel{background:var(--ylp);border-color:rgba(242,201,76,.5);color:var(--yl2);font-weight:700;}
.tag-opt:hover:not(.sel){background:var(--g2);}

/* ── TOAST ── */
.toast{position:fixed;bottom:20px;right:20px;z-index:400;background:var(--nv);color:#fff;padding:11px 16px;border-radius:10px;box-shadow:var(--s3);font-size:13px;font-weight:500;display:flex;align-items:center;gap:7px;animation:su .2s ease;border-left:4px solid var(--yl);}

/* ── EMPTY ── */
.empty{text-align:center;padding:50px 20px;}

/* ── FOOTER ── */
.ftr{background:var(--nv);padding:18px 20px;text-align:center;}
.ftr p{font-size:11px;color:rgba(255,255,255,.35);}

@media(max-width:640px){
  .hero{padding:28px 14px 36px;}
  .main,.adm,.qrp,.deploy{padding:16px 14px 48px;}
  .page-tabs{padding:14px 14px 0;}
  .sbar,.url-box,.psec,.d-section{padding:14px;}
  .grid,.tec-grid,.qrgrid{grid-template-columns:1fr;}
  .qr-hero-in{flex-direction:column;}
  .url-row,.pact,.adm-hdr{flex-direction:column;align-items:stretch;}
  .hnav .np-label{display:none;}
}
`;

// ═══════════════════════════════════════════════════════════
//  COMPONENTES REUTILIZÁVEIS
// ═══════════════════════════════════════════════════════════

function Toast({msg}){return msg?<div className="toast"><Ic d="M20 6L9 17l-5-5" s={15}/>{msg}</div>:null;}

function UploadZone({arquivo,onChange}){
  const ref=useRef();
  const pick=f=>{if(f?.type==="application/pdf")onChange(f);};
  return(
    <>
      <div className="uz" onClick={()=>ref.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pick(e.dataTransfer.files[0]);}}>
        <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" s={22}/>
        <div style={{fontSize:13,color:"var(--g7)",marginTop:7}}>Arraste ou <strong style={{color:"var(--nv)"}}>clique</strong> para selecionar PDF</div>
      </div>
      {arquivo&&<div className="fc"><Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" s={14}/>{arquivo.name}</div>}
      <input ref={ref} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>pick(e.target.files[0])}/>
      <div className="dnote"><strong>☁️ Google Drive:</strong> Após salvar, o PDF vai para <strong>Notificações Obrigatórias/PDFs</strong> via Apps Script e o link público é gerado automaticamente.</div>
    </>
  );
}

// ── Card de Ficha / Fluxo ──
function DocCard({item,tipo,onFav,onVer,onBaixar,onCompartilhar,onImprimir,fmt}){
  const isFluxo=tipo==="fluxo";
  return(
    <div className="card">
      <div className="card-top">
        <div className={`card-ico${isFluxo?" flow":""}`}>
          <Ic d={isFluxo?"M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4M12 3v14M8 7l4-4 4 4":"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"} s={20}/>
        </div>
        <div className="card-meta">
          <div className="card-nome">{item.nome}</div>
          <span className="card-cat">{item.categoria}</span>
        </div>
        <button className="card-fav" onClick={()=>onFav(item.id)}><StarSvg on={item.favorito}/></button>
      </div>
      <div className="card-body">
        <div className="card-desc">{item.descricao}</div>
        <div className="card-data"><Ic d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2" s={12}/>Atualizado em {fmt(item.atualizadoEm)}{item.acessos>0&&<span style={{marginLeft:6,color:"var(--g4)"}}>· {item.acessos} acesso{item.acessos!==1?"s":""}</span>}</div>
      </div>
      <div className="card-acoes">
        <button className="btn p" onClick={()=>onVer(item)}><Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" s={13}/>Visualizar</button>
        <button className="btn s" onClick={()=>onBaixar(item)}><Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" s={13}/>Baixar</button>
        <button className="btn s" onClick={()=>onCompartilhar(item)} title="Compartilhar"><Ic d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13" s={13}/></button>
        <button className="btn y" onClick={()=>onImprimir(item)} title="Imprimir"><Ic d="M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z" s={13}/></button>
      </div>
    </div>
  );
}

// ── Card de Técnico ──
function TecnicoCard({t,onEditar,isAdmin}){
  const iniciais=t.nome.split(" ").slice(0,2).map(p=>p[0]).join("");
  return(
    <div className="tec-card">
      <div className="tec-header">
        <div className="tec-avatar">
          {t.foto?<img src={t.foto} alt={t.nome}/>:iniciais}
        </div>
        <div className="tec-info">
          <div className="tec-nome">{t.nome}</div>
          <div className="tec-cargo">{t.cargo}</div>
        </div>
      </div>
      <div className="tec-body">
        <div className="tec-bio">{t.bio}</div>
        {t.formacao&&<div className="tec-form"><Ic d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" s={14} sw={1.5}/><span>{t.formacao}</span></div>}
        <div className="tec-contatos">
          {t.email&&<div className="tec-contato"><Ic d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" s={14} sw={1.5}/><a href={`mailto:${t.email}`}>{t.email}</a></div>}
          {t.telefone&&<div className="tec-contato"><Ic d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" s={14} sw={1.5}/><span>{t.telefone}</span></div>}
        </div>
        {t.agravos?.length>0&&(
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--g5)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:7}}>Agravos sob responsabilidade</div>
            <div className="tec-agravos">{t.agravos.map(a=><span key={a} className="tec-tag">{a}</span>)}</div>
          </div>
        )}
      </div>
      {isAdmin&&(
        <div className="tec-footer">
          <button className="btn s" onClick={()=>onEditar(t)}><Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" s={13}/>Editar</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FORMULÁRIOS MODAIS
// ═══════════════════════════════════════════════════════════

function DocForm({init,tipo,onSalvar,onFechar}){
  const cats=CONFIG.categorias;
  const [f,setF]=useState(init||{nome:"",categoria:cats[1],descricao:"",linkPdf:"",atualizadoEm:new Date().toISOString().slice(0,10)});
  const [arq,setArq]=useState(null);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const titulo=tipo==="fluxo"?"fluxo operacional":"ficha de notificação";
  return(
    <div className="mo-bg" onClick={e=>e.target===e.currentTarget&&onFechar()}>
      <div className="mo">
        <div className="mo-hdr"><span className="mo-t">{init?.id?`Editar ${titulo}`:`Novo ${titulo}`}</span><button className="mo-x" onClick={onFechar}><Ic d="M18 6L6 18M6 6l12 12" s={16}/></button></div>
        <div className="mo-body">
          <div className="fg"><label className="fl">Nome *</label><input className="fi" value={f.nome} onChange={e=>set("nome",e.target.value)} placeholder={`Nome do ${titulo}...`}/></div>
          <div className="fg"><label className="fl">Categoria *</label><select className="fi fsel" style={{padding:"10px 13px"}} value={f.categoria} onChange={e=>set("categoria",e.target.value)}>{cats.slice(1).map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="fg"><label className="fl">Descrição *</label><textarea className="fi" rows={3} style={{resize:"vertical"}} value={f.descricao} onChange={e=>set("descricao",e.target.value)} placeholder="Descreva brevemente..."/></div>
          <div className="fg"><label className="fl">Link PDF (Google Drive)</label><input className="fi" value={f.linkPdf} onChange={e=>set("linkPdf",e.target.value)} placeholder="https://drive.google.com/file/d/..."/></div>
          <div className="fg"><label className="fl">Upload PDF</label><UploadZone arquivo={arq} onChange={a=>{setArq(a);set("linkPdf",a.name);}}/></div>
          <div className="fg"><label className="fl">Data de Atualização</label><input className="fi" type="date" value={f.atualizadoEm} onChange={e=>set("atualizadoEm",e.target.value)}/></div>
          <div className="mo-foot"><button className="bc" onClick={onFechar}>Cancelar</button><button className="bs" onClick={()=>{if(f.nome&&f.descricao)onSalvar({...f,id:init?.id||String(Date.now()),favorito:init?.favorito||false,acessos:init?.acessos||0});}}>Salvar</button></div>
        </div>
      </div>
    </div>
  );
}

function TecForm({init,onSalvar,onFechar,todosAgravos}){
  const [f,setF]=useState(init||{nome:"",cargo:"",formacao:"",email:"",telefone:"",foto:"",bio:"",agravos:[]});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleAgravo=a=>set("agravos",f.agravos.includes(a)?f.agravos.filter(x=>x!==a):[...f.agravos,a]);
  return(
    <div className="mo-bg" onClick={e=>e.target===e.currentTarget&&onFechar()}>
      <div className="mo">
        <div className="mo-hdr"><span className="mo-t">{init?.id?"Editar Técnico":"Novo Técnico"}</span><button className="mo-x" onClick={onFechar}><Ic d="M18 6L6 18M6 6l12 12" s={16}/></button></div>
        <div className="mo-body">
          <div className="fg"><label className="fl">Nome completo *</label><input className="fi" value={f.nome} onChange={e=>set("nome",e.target.value)} placeholder="Ex: Dra. Ana Paula Souza"/></div>
          <div className="fg"><label className="fl">Cargo / Função *</label><input className="fi" value={f.cargo} onChange={e=>set("cargo",e.target.value)} placeholder="Ex: Enfermeira — Vigilância Epidemiológica"/></div>
          <div className="fg"><label className="fl">Formação</label><input className="fi" value={f.formacao} onChange={e=>set("formacao",e.target.value)} placeholder="Ex: Enfermagem — UFBA | Especialização em Epidemiologia"/></div>
          <div className="fg"><label className="fl">Mini currículo / Bio *</label><textarea className="fi" rows={3} style={{resize:"vertical"}} value={f.bio} onChange={e=>set("bio",e.target.value)} placeholder="Descreva brevemente a atuação do profissional..."/></div>
          <div style={{display:"flex",gap:10}}>
            <div className="fg" style={{flex:1}}><label className="fl">E-mail</label><input className="fi" type="email" value={f.email} onChange={e=>set("email",e.target.value)} placeholder="email@saude.gov.br"/></div>
            <div className="fg" style={{flex:1}}><label className="fl">Telefone</label><input className="fi" value={f.telefone} onChange={e=>set("telefone",e.target.value)} placeholder="(00) 9 0000-0000"/></div>
          </div>
          <div className="fg"><label className="fl">URL da foto (opcional)</label><input className="fi" value={f.foto} onChange={e=>set("foto",e.target.value)} placeholder="https://..."/></div>
          <div className="fg">
            <label className="fl">Agravos sob responsabilidade</label>
            <div style={{fontSize:12,color:"var(--g5)",marginBottom:7}}>Selecione um ou mais agravos (tags):</div>
            <div className="tags-select">
              {todosAgravos.map(a=>(
                <button key={a} type="button" className={`tag-opt${f.agravos.includes(a)?" sel":""}`} onClick={()=>toggleAgravo(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="mo-foot"><button className="bc" onClick={onFechar}>Cancelar</button><button className="bs" onClick={()=>{if(f.nome&&f.cargo&&f.bio)onSalvar({...f,id:init?.id||String(Date.now())});}}>Salvar</button></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PÁGINA QR CODE
// ═══════════════════════════════════════════════════════════
function PaginaQR({fichas,fluxos}){
  const [appUrl,setAppUrl]=useState(CONFIG.appUrl);
  const [input,setInput]=useState(CONFIG.appUrl);
  const [busca,setBusca]=useState("");
  const [aba,setAba]=useState("fichas");
  const printRef=useRef();
  const todos=[...(aba==="fichas"?fichas:fluxos)].filter(n=>!busca||n.nome.toLowerCase().includes(busca.toLowerCase()));

  const copiar=()=>{navigator.clipboard.writeText(appUrl);};
  const baixarQR=()=>{const cv=document.querySelector("#main-qr canvas");if(!cv)return;const a=document.createElement("a");a.download="qrcode-viginotifica.png";a.href=cv.toDataURL();a.click();};

  const imprimirCartao=()=>{
    const cv=printRef.current?.querySelector("canvas");
    const img=cv?cv.toDataURL():"";
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Cartão ${CONFIG.nomeDoSistema}</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;padding:20px;}
    .card{background:#fff;border-radius:14px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.15);}
    .top{background:${CONFIG.corPrimaria};padding:16px 20px;display:flex;align-items:center;gap:12px;}
    .lm{width:38px;height:38px;background:${CONFIG.corDestaque};border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;}
    .ttl{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:#fff;}.sub{font-size:10px;color:rgba(255,255,255,.5);}
    .body{padding:20px;display:flex;gap:16px;align-items:center;}
    .qr{border:2px solid #E8E8E8;border-radius:9px;padding:7px;flex-shrink:0;}.qr img{width:110px;height:110px;display:block;}
    .info h4{font-family:'Sora',sans-serif;font-size:13px;font-weight:800;color:${CONFIG.corPrimaria};margin-bottom:6px;}
    .info p{font-size:11.5px;color:#4A4A4A;line-height:1.55;margin-bottom:8px;}
    .url{font-size:9.5px;color:#828282;background:#F7F8FC;padding:5px 8px;border-radius:5px;border:1px solid #E8E8E8;word-break:break-all;}
    .scan{text-align:center;font-size:11px;color:#828282;padding:0 20px 14px;}
    .foot{background:${CONFIG.corPrimaria};padding:8px 20px;display:flex;justify-content:space-between;}
    .foot span{font-size:9px;color:rgba(255,255,255,.4);}
    .foot strong{font-size:10px;color:${CONFIG.corDestaque};font-family:'Sora',sans-serif;}
    @media print{body{background:#fff;padding:0;}.card{box-shadow:none;border:1px solid #ccc;}}</style></head>
    <body><div class="card">
    <div class="top"><div class="lm">🏥</div><div><div class="ttl">${CONFIG.nomeDoSistema}</div><div class="sub">${CONFIG.subtitulo}</div></div></div>
    <div class="body"><div class="qr"><img src="${img}"/></div><div class="info"><h4>Acesse Fichas, Fluxos e Contatos</h4><p>Escaneie o QR Code com a câmera do celular para acessar todo o sistema de vigilância epidemiológica.</p><div class="url">${appUrl}</div></div></div>
    <div class="scan">📱 Aponte a câmera do celular para o QR Code</div>
    <div class="foot"><span>Atenção Primária à Saúde</span><strong>${CONFIG.nomeDoSistema} ${CONFIG.ano}</strong></div>
    </div><script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return(
    <div className="qrp">
      <div className="qr-hero">
        <div className="qr-hero-in">
          <div className="qr-txt">
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 11px",borderRadius:20,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.14)",color:"var(--yl)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>📱 QR Code & Compartilhamento</div>
            <h2>Link + <em>QR Code</em><br/>para a UBS</h2>
            <p style={{marginTop:8}}>Gere o QR Code, copie o link e imprima o cartão. Profissionais acessam tudo pelo celular sem instalar nada.</p>
          </div>
          <div className="qr-box">
            <div className="qr-cv" id="main-qr"><QRCanvas url={appUrl} size={150}/></div>
            <div className="qr-hint">Escaneie com o celular</div>
          </div>
        </div>
      </div>

      <div className="url-box">
        <h3>🔗 URL do Sistema</h3>
        <p>Cole o link real após hospedar. O QR Code atualiza automaticamente.</p>
        <div className="url-row">
          <input className="url-in" value={input} onChange={e=>setInput(e.target.value)} placeholder="https://seu-sistema.vercel.app"/>
          <button className="url-btn nv" onClick={()=>setAppUrl(input)}><Ic d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" s={14}/>Gerar QR</button>
          <button className="url-btn yl" onClick={copiar}><Ic d="M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" s={14}/>Copiar Link</button>
        </div>
        <div className="tip"><strong style={{color:"var(--nv)"}}>💡 Hospedagem gratuita:</strong> GitHub + Vercel = link fixo grátis. Veja o guia completo na aba <strong>"Como Publicar"</strong>.</div>
      </div>

      <div className="psec">
        <h3>🖨️ Cartão para Imprimir e Fixar na UBS</h3>
        <p>Imprima e cole na recepção ou mural. Qualquer celular com câmera acessa o sistema.</p>
        <div className="pprev" ref={printRef}>
          <div className="pcard">
            <div className="pcard-top"><LogoMark size={36}/><div><div className="pcard-title">{CONFIG.nomeDoSistema}</div><div className="pcard-sub">{CONFIG.subtitulo}</div></div></div>
            <div className="pcard-body">
              <div className="pcard-qr"><QRCanvas url={appUrl} size={96}/></div>
              <div className="pcard-info"><h4>Acesse Fichas, Fluxos e Contatos</h4><p>Escaneie o QR Code com a câmera do celular.</p><div className="pcard-url">{appUrl}</div></div>
            </div>
            <div className="pcard-foot"><span>📱 Aponte a câmera para o QR Code</span><strong>{CONFIG.nomeDoSistema} {CONFIG.ano}</strong></div>
          </div>
        </div>
        <div className="pact">
          <button className="pbtn nv" onClick={imprimirCartao}><Ic d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" s={14}/>Imprimir Cartão</button>
          <button className="pbtn yl" onClick={baixarQR}><Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" s={14}/>Baixar QR (.png)</button>
          <button className="pbtn sc" onClick={copiar}><Ic d="M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" s={14}/>Copiar Link</button>
        </div>
      </div>

      <div className="sec" style={{marginBottom:14}}>
        <div className="sec-t">QR Code por Item</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {["fichas","fluxos"].map(a=><button key={a} className={`atab${aba===a?" a":""}`} onClick={()=>setAba(a)}>{a==="fichas"?"📄 Fichas":"🔄 Fluxos"}</button>)}
          <div className="siw" style={{minWidth:160}}><Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" s={14}/><input className="si" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Filtrar..." style={{paddingLeft:32}}/></div>
        </div>
      </div>
      <div className="qrgrid">{todos.map(n=><QRItemCard key={n.id} n={n} appUrl={appUrl}/>)}</div>
    </div>
  );
}

function QRItemCard({n,appUrl}){
  const url=n.linkPdf?.startsWith("http")?n.linkPdf:appUrl;
  const [copiado,setCopiado]=useState(false);
  const copiar=()=>{navigator.clipboard.writeText(url);setCopiado(true);setTimeout(()=>setCopiado(false),2000);};
  const imprimir=()=>{
    const cv=document.querySelector(`[data-qritem="${n.id}"] canvas`);
    const img=cv?cv.toDataURL():"";
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${n.nome}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;}.box{background:#fff;border-radius:12px;padding:22px;text-align:center;max-width:240px;box-shadow:0 4px 20px rgba(0,0,0,.12);}h2{font-size:14px;color:${CONFIG.corPrimaria};margin-bottom:3px;}p{font-size:10px;color:#828282;margin-bottom:12px;}img{width:150px;height:150px;border:2px solid #eee;border-radius:8px;padding:5px;}.url{font-size:9px;color:#aaa;margin-top:8px;word-break:break-all;}@media print{body{background:#fff;}}</style></head><body><div class="box"><h2>${n.nome}</h2><p>${n.categoria}</p><img src="${img}"/><div class="url">${url}</div></div><script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };
  return(
    <div className="qrnc">
      <div className="qrnc-top">
        <div className="qrnc-ico"><Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" s={14}/></div>
        <div><div className="qrnc-nome">{n.nome}</div><div className="qrnc-cat">{n.categoria}</div></div>
      </div>
      <div className="qrnc-body">
        <div className="qrnc-qr" data-qritem={n.id}><QRCanvas url={url} size={74}/></div>
        <div className="qrnc-info">
          <div className="qrnc-desc">{n.descricao.slice(0,80)}…</div>
          <div className="qrnc-acts">
            <button className="qbtn p" onClick={imprimir}><Ic d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" s={11}/>Imprimir</button>
            <button className="qbtn s" onClick={copiar}><Ic d="M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" s={11}/>{copiado?"✓ Copiado":"Copiar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GUIA DE PUBLICAÇÃO
// ═══════════════════════════════════════════════════════════
function PaginaDeploy(){
  const [metodo,setMetodo]=useState("vercel");
  const [urlLocal,setUrlLocal]=useState(CONFIG.appUrl);
  const [copiado,setCopiado]=useState("");

  const copiar=(texto,chave)=>{navigator.clipboard.writeText(texto);setCopiado(chave);setTimeout(()=>setCopiado(""),2000);};

  const CopyBtn=({texto,chave,label="Copiar"})=>(
    <button className="url-btn sc" style={{padding:"6px 12px",fontSize:11}} onClick={()=>copiar(texto,chave)}>
      <Ic d={copiado===chave?"M20 6L9 17l-5-5":"M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"} s={13}/>
      {copiado===chave?"Copiado!":label}
    </button>
  );

  return(
    <div className="deploy">
      <div className="deploy-hero">
        <h2>🚀 Como <em>Publicar</em> o Sistema</h2>
        <p>Coloque o VigiNotifica online de forma gratuita e gere o link permanente para QR Code e compartilhamento. Escolha o método abaixo:</p>
      </div>

      {/* MÉTODO TABS */}
      <div className="method-tabs">
        {[["vercel","🌐 GitHub + Vercel (Recomendado)"],["netlify","🔷 GitHub + Netlify"],["local","💻 Rodar Localmente"]].map(([k,l])=>(
          <button key={k} className={`mtab${metodo===k?" a":""}`} onClick={()=>setMetodo(k)}>{l}</button>
        ))}
      </div>

      {/* ── VERCEL ── */}
      {metodo==="vercel"&&(
        <>
          <div className="d-section">
            <h3>📦 Passo 1 — Preparar o GitHub</h3>
            <div className="d-sub">O GitHub é onde seu código fica guardado na nuvem, de forma gratuita.</div>
            <div className="steps-v">
              {[
                {n:1,t:"Criar conta no GitHub",p:<>Acesse <strong>github.com</strong> → clique em <strong>"Sign up"</strong> → preencha e-mail, senha e username → confirme o e-mail.</>},
                {n:2,t:'Criar um repositório',p:<>Clique no botão verde <strong>"New"</strong> (ou <strong>"+"</strong> no topo) → nome: <code>viginotifica</code> → deixe <strong>Public</strong> → clique <strong>"Create repository"</strong>.</>},
                {n:3,t:"Subir os arquivos",p:<>Na tela do repositório clique em <strong>"uploading an existing file"</strong> → arraste <strong>toda a pasta viginotifica</strong> para lá → clique <strong>"Commit changes"</strong>.</>,extra:<div className="d-note">💡 <strong>Importante:</strong> suba a pasta inteira, não arquivo por arquivo. Certifique que <code>package.json</code> está na raiz do repositório.</div>},
              ].map(s=>(
                <div className="step-v" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.p}</p>{s.extra}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="d-section">
            <h3>⚡ Passo 2 — Deploy no Vercel</h3>
            <div className="d-sub">O Vercel pega seu código do GitHub e publica automaticamente. 100% gratuito.</div>
            <div className="steps-v">
              {[
                {n:1,t:"Criar conta no Vercel",p:<>Acesse <strong>vercel.com</strong> → clique <strong>"Sign Up"</strong> → escolha <strong>"Continue with GitHub"</strong> → autorize a conexão.</>},
                {n:2,t:'Importar o projeto',p:<>Clique em <strong>"Add New Project"</strong> → encontre o repositório <code>viginotifica</code> → clique <strong>"Import"</strong>.</>},
                {n:3,t:'Configurar e fazer deploy',p:<>Na tela de configuração, o Vercel detecta automaticamente que é um projeto Vite/React. Não precisa alterar nada. Clique em <strong>"Deploy"</strong> e aguarde ~1 minuto.</>},
                {n:4,t:'Pronto! Seu link está no ar 🎉',p:<>O Vercel exibe sua URL, algo como: <code>viginotifica.vercel.app</code>. Copie essa URL, cole na aba <strong>QR Code</strong> do sistema e imprima o cartão!</>,extra:<div className="d-note">✅ <strong>Toda vez que você atualizar os arquivos no GitHub</strong>, o Vercel publica automaticamente a nova versão. Não precisa fazer nada!</div>},
              ].map(s=>(
                <div className="step-v" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.p}</p>{s.extra}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── NETLIFY ── */}
      {metodo==="netlify"&&(
        <>
          <div className="d-section">
            <h3>🔷 Deploy no Netlify (alternativa gratuita)</h3>
            <div className="d-sub">Método alternativo — igualmente gratuito e confiável.</div>
            <div className="steps-v">
              {[
                {n:1,t:"Preparar o build local",p:<>No terminal, dentro da pasta do projeto, rode os comandos:</>,extra:<><code className="code-block">npm install{"\n"}npm run build</code><div className="d-note">Isso cria uma pasta <code>dist/</code> com os arquivos prontos para publicar.</div></>},
                {n:2,t:"Acessar o Netlify",p:<>Acesse <strong>netlify.com</strong> → clique em <strong>"Sign up"</strong> → pode usar e-mail ou GitHub.</>},
                {n:3,t:"Arrastar a pasta dist",p:<>Na tela inicial do Netlify, existe uma área <strong>"Drag and drop your site folder here"</strong>. Arraste a pasta <code>dist/</code> diretamente para lá.</>},
                {n:4,t:"Link pronto!",p:<>O Netlify gera um link automático como <code>amazing-name-123.netlify.app</code>. Você pode personalizar em Settings → Domain Management.</>,extra:<div className="d-note">💡 Para atualizar, basta gerar um novo <code>npm run build</code> e arrastar a pasta <code>dist/</code> novamente.</div>},
              ].map(s=>(
                <div className="step-v" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.p}</p>{s.extra}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── LOCAL ── */}
      {metodo==="local"&&(
        <>
          <div className="d-section">
            <h3>💻 Rodar no Computador da UBS (sem internet)</h3>
            <div className="d-sub">Ideal para uso interno, sem precisar hospedar na nuvem.</div>
            <div className="steps-v">
              {[
                {n:1,t:"Instalar o Node.js",p:<>Acesse <strong>nodejs.org</strong> → baixe a versão <strong>LTS</strong> → instale normalmente (next, next, finish).</>,extra:<div className="d-note">Node.js é o motor que roda o app. Só precisa instalar uma vez.</div>},
                {n:2,t:"Instalar dependências",p:<>Abra o terminal (Prompt de Comando no Windows) → navegue até a pasta do projeto → rode:</>,extra:<><code className="code-block">cd viginotifica{"\n"}npm install</code></>},
                {n:3,t:"Iniciar o sistema",p:<>Ainda no terminal, rode:</>,extra:<><code className="code-block">npm run dev</code><div className="d-note">O sistema abre em <strong>http://localhost:5173</strong>. Acesse pelo navegador do computador.</div></>},
                {n:4,t:"Acessar pelo celular (mesma rede Wi-Fi)",p:<>Descubra o IP do computador (Windows: <code>ipconfig</code>, Mac/Linux: <code>ifconfig</code>) → acesse do celular: <code>http://192.168.X.X:5173</code></>,extra:<div className="d-note">💡 Para manter funcionando permanentemente, deixe o terminal aberto ou configure para iniciar com o Windows.</div>},
              ].map(s=>(
                <div className="step-v" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.p}</p>{s.extra}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── COMPARTILHAR ── */}
      <div className="d-section">
        <h3>📤 Compartilhar o Link e QR Code</h3>
        <div className="d-sub">Após hospedar, use estas ferramentas para distribuir o acesso.</div>
        <div className="share-box">
          <h4>Cole o link do seu sistema aqui:</h4>
          <div className="share-row">
            <input className="share-input" value={urlLocal} onChange={e=>setUrlLocal(e.target.value)} placeholder="https://seu-sistema.vercel.app"/>
            <button className="url-btn yl" onClick={()=>copiar(urlLocal,"link")}><Ic d={copiado==="link"?"M20 6L9 17l-5-5":"M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"} s={14}/>{copiado==="link"?"Copiado!":"Copiar Link"}</button>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginTop:14}}>
            <div className="share-qr-preview">
              <QRCanvas url={urlLocal||CONFIG.appUrl} size={120}/>
              <span>QR Code do sistema</span>
              <button className="url-btn sc" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>{const cv=document.querySelector(".share-qr-preview canvas");if(!cv)return;const a=document.createElement("a");a.download="qrcode.png";a.href=cv.toDataURL();a.click();}}>
                <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" s={13}/>Baixar .png
              </button>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--nv)",marginBottom:10}}>Como compartilhar:</div>
              {[
                {emoji:"💬",t:"WhatsApp da equipe",d:"Copie o link e cole no grupo. Os colegas acessam direto pelo celular."},
                {emoji:"📧",t:"E-mail institucional",d:"Envie para a equipe com o link e o QR Code em anexo."},
                {emoji:"🖨️",t:"Impressão na UBS",d:'Use a aba "QR Code" do sistema para imprimir o cartão e fixar na recepção.'},
                {emoji:"📋",t:"Ofício / Circular",d:"Inclua o link e o QR Code em comunicados oficiais da vigilância."},
              ].map(item=>(
                <div key={item.t} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{item.emoji}</span>
                  <div><div style={{fontSize:13,fontWeight:600,color:"var(--nv)"}}>{item.t}</div><div style={{fontSize:12,color:"var(--g5)",lineHeight:1.5}}>{item.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONFIGURAR NOME/SENHA ── */}
      <div className="d-section">
        <h3>⚙️ Personalizar antes de publicar</h3>
        <div className="d-sub">Abra o arquivo <code>src/config.js</code> e edite:</div>
        <code className="code-block">{`// src/config.js
nomeDoSistema: "VigiNotifica",         // ← Nome do sistema
subtitulo:     "Atenção Primária",     // ← Subtítulo
corPrimaria:   "#0A1F44",              // ← Cor principal
corDestaque:   "#F2C94C",              // ← Cor de destaque
adminSenha:    "saude2024",            // ← ⚠️ TROQUE esta senha!
appUrl: "https://seu-link.vercel.app", // ← URL após hospedar`}</code>
        <div className="d-note" style={{marginTop:10}}>⚠️ <strong>Troque a senha do admin</strong> antes de publicar. Qualquer pessoa com acesso ao link pode tentar o login.</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function App(){
  const [tela,setTela]=useState("fichas");
  const [subTela,setSubTela]=useState("fichas"); // fichas | fluxos | tecnicos na tela principal
  const [fichas,setFichas]=useState(FICHAS_INICIAIS);
  const [fluxos,setFluxos]=useState(FLUXOS_INICIAIS);
  const [tecnicos,setTecnicos]=useState(TECNICOS_INICIAIS);
  const [busca,setBusca]=useState("");
  const [cat,setCat]=useState("Todas");
  const [mostrarLogin,setMostrarLogin]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);
  const [lu,setLu]=useState(""); const [lp,setLp]=useState(""); const [le,setLe]=useState("");
  const [modal,setModal]=useState(null); // {tipo, data}
  const [toast,setToast]=useState(null);
  const [recentes,setRecentes]=useState([]);
  const [admAba,setAdmAba]=useState("fichas");

  const T=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const fmt=d=>{try{return new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});}catch{return d;}};

  // agravos disponíveis = nomes das fichas
  const todosAgravos=[...new Set([...fichas.map(f=>f.nome),...fluxos.map(f=>f.nome)])];

  const coleção=subTela==="fluxos"?fluxos:fichas;
  const filtrados=coleção.filter(n=>{
    const q=busca.toLowerCase();
    return(!q||n.nome.toLowerCase().includes(q)||n.descricao.toLowerCase().includes(q)||n.categoria.toLowerCase().includes(q))
      &&(cat==="Todas"||n.categoria===cat);
  });
  const favoritas=coleção.filter(n=>n.favorito);

  const addRecente=n=>{setRecentes(r=>[n,...r.filter(x=>x.id!==n.id)].slice(0,5));
    const setter=subTela==="fluxos"?setFluxos:setFichas;
    setter(fs=>fs.map(x=>x.id===n.id?{...x,acessos:(x.acessos||0)+1}:x));};
  const toggleFav=id=>{const setter=subTela==="fluxos"?setFluxos:setFichas;setter(fs=>fs.map(n=>n.id===id?{...n,favorito:!n.favorito}:n));};

  const onVer=n=>{addRecente(n);if(n.linkPdf?.startsWith("http"))window.open(n.linkPdf,"_blank");else T("Adicione o link do PDF na área Admin");};
  const onBaixar=n=>{addRecente(n);if(n.linkPdf?.startsWith("http"))window.open(n.linkPdf,"_blank");else T("Link de download não disponível");};
  const onCompartilhar=async n=>{const u=n.linkPdf?.startsWith("http")?n.linkPdf:window.location.href;if(navigator.share){try{await navigator.share({title:n.nome,text:n.descricao,url:u});}catch{}}else{navigator.clipboard.writeText(u);T("Link copiado!");}};
  const onImprimir=n=>{addRecente(n);if(n.linkPdf?.startsWith("http")){const w=window.open(n.linkPdf,"_blank");if(w)setTimeout(()=>{try{w.print();}catch{}},1200);}else T("Adicione o link do PDF para imprimir");};

  const doLogin=()=>{if(lu===CONFIG.adminUsuario&&lp===CONFIG.adminSenha){setIsAdmin(true);setMostrarLogin(false);setTela("admin");setLe("");T("✓ Acesso concedido");}else setLe("Usuário ou senha incorretos.");};
  const doLogout=()=>{setIsAdmin(false);setTela("fichas");T("Sessão encerrada");};

  const salvarDoc=d=>{
    const tipo=modal?.tipo;
    if(tipo==="fluxo")setFluxos(fs=>fs.find(x=>x.id===d.id)?fs.map(x=>x.id===d.id?d:x):[d,...fs]);
    else setFichas(fs=>fs.find(x=>x.id===d.id)?fs.map(x=>x.id===d.id?d:x):[d,...fs]);
    setModal(null);T("✓ Salvo com sucesso!");
  };
  const excluirDoc=(id,tipo)=>{if(!window.confirm("Excluir?"))return;if(tipo==="fluxo")setFluxos(fs=>fs.filter(x=>x.id!==id));else setFichas(fs=>fs.filter(x=>x.id!==id));T("Excluído.");};

  const salvarTec=d=>{setTecnicos(ts=>ts.find(x=>x.id===d.id)?ts.map(x=>x.id===d.id?d:x):[d,...ts]);setModal(null);T("✓ Técnico salvo!");};
  const excluirTec=id=>{if(!window.confirm("Excluir técnico?"))return;setTecnicos(ts=>ts.filter(x=>x.id!==id));T("Técnico excluído.");};

  const tecBusca=busca.toLowerCase();
  const tecFiltrados=tecnicos.filter(t=>!tecBusca||t.nome.toLowerCase().includes(tecBusca)||t.agravos.some(a=>a.toLowerCase().includes(tecBusca)));

  return(
    <>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header className="hdr">
        <div className="hdr-in">
          <button className="logo-btn" onClick={()=>{setTela("fichas");setSubTela("fichas");}}>
            <LogoMark size={34}/>
            <div className="logo-txt"><div className="t">{CONFIG.nomeDoSistema}</div><div className="s">{CONFIG.subtitulo}</div></div>
          </button>
          <div className="hsp"/>
          <nav className="hnav">
            <button className={`np${tela==="fichas"?" a":" g"}`} onClick={()=>{setTela("fichas");setSubTela("fichas");}}>
              <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" s={13}/><span className="np-label">Fichas</span>
            </button>
            <button className={`np${tela==="fichas"&&subTela==="fluxos"?" a":" g"}`} onClick={()=>{setTela("fichas");setSubTela("fluxos");}}>
              <Ic d="M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4M12 3v14M8 7l4-4 4 4" s={13}/><span className="np-label">Fluxos</span>
            </button>
            <button className={`np${tela==="fichas"&&subTela==="tecnicos"?" a":" g"}`} onClick={()=>{setTela("fichas");setSubTela("tecnicos");}}>
              <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" s={13}/><span className="np-label">Técnicos</span>
            </button>
            <button className={`np${tela==="qr"?" a":" g"}`} onClick={()=>setTela("qr")}>
              <Ic d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" s={13}/><span className="np-label">QR Code</span>
            </button>
            <button className={`np${tela==="deploy"?" a":" g"}`} onClick={()=>setTela("deploy")}>
              <Ic d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" s={13}/><span className="np-label">Publicar</span>
            </button>
            {isAdmin?<>
              <button className={`np${tela==="admin"?" a":" g"}`} onClick={()=>setTela("admin")}><span className="np-label">Admin</span></button>
              <div className="abadge"><Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" s={12}/>Admin</div>
              <button className="np g" onClick={doLogout}><Ic d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" s={15}/></button>
            </>:<button className="np g" onClick={()=>setMostrarLogin(true)}>🔐 <span className="np-label">Entrar</span></button>}
          </nav>
        </div>
      </header>

      {/* ── LOGIN ── */}
      {mostrarLogin&&(
        <div className="overlay">
          <div className="lbox">
            <button className="lx" onClick={()=>setMostrarLogin(false)}><Ic d="M18 6L6 18M6 6l12 12" s={16}/></button>
            <div style={{textAlign:"center",marginBottom:16}}><LogoMark size={48}/></div>
            <div className="lh">Área Administrativa</div>
            <div className="ls">Acesso restrito a profissionais autorizados</div>
            {le&&<div className="lerr">{le}</div>}
            <div className="fg"><label className="fl">Usuário</label><input className="fi" value={lu} onChange={e=>setLu(e.target.value)} placeholder="admin" onKeyDown={e=>e.key==="Enter"&&doLogin()} autoFocus/></div>
            <div className="fg"><label className="fl">Senha</label><input className="fi" type="password" value={lp} onChange={e=>setLp(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doLogin()}/></div>
            <button className="lbtn" onClick={doLogin}>Entrar no Sistema</button>
            <div className="lhint">Usuário: <strong>admin</strong> / Senha: <strong>saude2024</strong></div>
          </div>
        </div>
      )}

      {/* ── MODAIS ── */}
      {modal?.tipo==="ficha"&&<DocForm init={modal.data} tipo="ficha" onSalvar={salvarDoc} onFechar={()=>setModal(null)}/>}
      {modal?.tipo==="fluxo"&&<DocForm init={modal.data} tipo="fluxo" onSalvar={salvarDoc} onFechar={()=>setModal(null)}/>}
      {modal?.tipo==="tecnico"&&<TecForm init={modal.data} onSalvar={salvarTec} onFechar={()=>setModal(null)} todosAgravos={todosAgravos}/>}
      <Toast msg={toast}/>

      {/* ═══ FICHAS / FLUXOS / TÉCNICOS ═══ */}
      {tela==="fichas"&&(
        <>
          <div className="hero">
            <div className="hero-in">
              <div className="eyebrow">🏥 Vigilância Epidemiológica</div>
              <h1>
                {subTela==="tecnicos"?<>Técnicos <em>Responsáveis</em></>
                 :subTela==="fluxos"?<>Fluxos <em>Operacionais</em></>
                 :<>Notificações <em>Obrigatórias</em></>}
              </h1>
              <p>{CONFIG.descricaoHero}</p>
              <div className="stats">
                <div className="stat"><div className="stat-n">{fichas.length}</div><div className="stat-l">Fichas</div></div>
                <div className="stat"><div className="stat-n">{fluxos.length}</div><div className="stat-l">Fluxos</div></div>
                <div className="stat"><div className="stat-n">{tecnicos.length}</div><div className="stat-l">Técnicos</div></div>
              </div>
            </div>
          </div>

          {/* TABS DE SEÇÃO */}
          <div className="page-tabs">
            {[["fichas","📄 Fichas de Notificação"],["fluxos","🔄 Fluxos Operacionais"],["tecnicos","👥 Técnicos Responsáveis"]].map(([k,l])=>(
              <button key={k} className={`ptab${subTela===k?" a":""}`} onClick={()=>{setSubTela(k);setBusca("");setCat("Todas");}}>{l}</button>
            ))}
          </div>

          <div className="main">
            {/* ── FICHAS e FLUXOS ── */}
            {subTela!=="tecnicos"&&(
              <>
                {recentes.length>0&&(
                  <div className="rec">
                    <span className="rec-lbl"><Ic d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2" s={12}/> Recentes</span>
                    {recentes.map(r=><div key={r.id} className="rchip" onClick={()=>onVer(r)}><span className="rdot"/>{r.nome}</div>)}
                  </div>
                )}
                <div className="sbar">
                  <div className="sf"><label>Pesquisar</label><div className="siw"><Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" s={14}/><input className="si" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome, descrição..."/></div></div>
                  <div className="sf" style={{flex:"0 0 auto",minWidth:160}}><label>Categoria</label><select className="fsel" value={cat} onChange={e=>setCat(e.target.value)}>{CONFIG.categorias.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div className="rcount"><strong>{filtrados.length}</strong> resultado{filtrados.length!==1?"s":""}</div>
                </div>
                {favoritas.length>0&&cat==="Todas"&&!busca&&(
                  <><div className="sec"><div className="sec-t">⭐ Favoritas <span>{favoritas.length}</span></div></div>
                    <div className="grid" style={{marginBottom:26}}>{favoritas.map(n=><DocCard key={n.id} item={n} tipo={subTela==="fluxos"?"fluxo":"ficha"} onFav={toggleFav} onVer={onVer} onBaixar={onBaixar} onCompartilhar={onCompartilhar} onImprimir={onImprimir} fmt={fmt}/>)}</div></>
                )}
                <div className="sec"><div className="sec-t">{cat!=="Todas"?cat:subTela==="fluxos"?"Todos os Fluxos":"Todas as Fichas"}<span>{filtrados.length}</span></div></div>
                {filtrados.length===0
                  ?<div className="empty"><div style={{fontSize:40,marginBottom:10}}>🔍</div><div className="sec-t">Nenhum resultado</div><div style={{color:"var(--g5)",fontSize:13,marginTop:4}}>Ajuste os filtros</div></div>
                  :<div className="grid">{filtrados.map(n=><DocCard key={n.id} item={n} tipo={subTela==="fluxos"?"fluxo":"ficha"} onFav={toggleFav} onVer={onVer} onBaixar={onBaixar} onCompartilhar={onCompartilhar} onImprimir={onImprimir} fmt={fmt}/>)}</div>
                }
              </>
            )}

            {/* ── TÉCNICOS ── */}
            {subTela==="tecnicos"&&(
              <>
                <div className="sbar" style={{marginBottom:22}}>
                  <div className="sf"><label>Buscar técnico ou agravo</label><div className="siw"><Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" s={14}/><input className="si" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome ou agravo..."/></div></div>
                  <div className="rcount"><strong>{tecFiltrados.length}</strong> técnico{tecFiltrados.length!==1?"s":""}</div>
                </div>
                {tecFiltrados.length===0
                  ?<div className="empty"><div style={{fontSize:40,marginBottom:10}}>👥</div><div className="sec-t">Nenhum técnico encontrado</div></div>
                  :<div className="tec-grid">{tecFiltrados.map(t=><TecnicoCard key={t.id} t={t} isAdmin={isAdmin} onEditar={t=>setModal({tipo:"tecnico",data:t})}/>)}</div>
                }
              </>
            )}
          </div>
        </>
      )}

      {/* ═══ QR CODE ═══ */}
      {tela==="qr"&&<PaginaQR fichas={fichas} fluxos={fluxos}/>}

      {/* ═══ DEPLOY GUIDE ═══ */}
      {tela==="deploy"&&<PaginaDeploy/>}

      {/* ═══ ADMIN ═══ */}
      {tela==="admin"&&isAdmin&&(
        <div className="adm">
          <div className="adm-hdr">
            <div className="adm-title">Painel Administrativo</div>
            <button className="add-btn" onClick={()=>setModal({tipo:admAba==="tecnicos"?"tecnico":admAba==="fluxos"?"fluxo":"ficha"})}>
              <Ic d="M12 5v14M5 12h14" s={14}/>
              {admAba==="tecnicos"?"Novo Técnico":admAba==="fluxos"?"Novo Fluxo":"Nova Ficha"}
            </button>
          </div>
          <div className="adm-tabs">
            {[["fichas","📄 Fichas"],["fluxos","🔄 Fluxos"],["tecnicos","👥 Técnicos"]].map(([k,l])=>(
              <button key={k} className={`atab${admAba===k?" a":""}`} onClick={()=>setAdmAba(k)}>{l}</button>
            ))}
          </div>
          <div className="tbl-wrap">
            {admAba!=="tecnicos"?(
              <table className="tbl">
                <thead><tr><th>Nome</th><th>Categoria</th><th>Descrição</th><th>Atualização</th><th>Ações</th></tr></thead>
                <tbody>
                  {(admAba==="fluxos"?fluxos:fichas).map(n=>(
                    <tr key={n.id}>
                      <td><strong style={{color:"var(--nv)",fontFamily:"Sora"}}>{n.nome}</strong></td>
                      <td><span className="tbadge">{n.categoria}</span></td>
                      <td style={{maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.descricao}</td>
                      <td style={{whiteSpace:"nowrap"}}>{fmt(n.atualizadoEm)}</td>
                      <td><div className="tact">
                        <button className="ib e" onClick={()=>setModal({tipo:admAba==="fluxos"?"fluxo":"ficha",data:n})}><Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" s={13}/></button>
                        <button className="ib d" onClick={()=>excluirDoc(n.id,admAba==="fluxos"?"fluxo":"ficha")}><Ic d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" s={13}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ):(
              <table className="tbl">
                <thead><tr><th>Nome</th><th>Cargo</th><th>Agravos</th><th>Contato</th><th>Ações</th></tr></thead>
                <tbody>
                  {tecnicos.map(t=>(
                    <tr key={t.id}>
                      <td><strong style={{color:"var(--nv)",fontFamily:"Sora"}}>{t.nome}</strong></td>
                      <td style={{fontSize:12}}>{t.cargo}</td>
                      <td><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{t.agravos.slice(0,3).map(a=><span key={a} className="tbadge" style={{fontSize:10}}>{a}</span>)}{t.agravos.length>3&&<span style={{fontSize:11,color:"var(--g5)"}}>+{t.agravos.length-3}</span>}</div></td>
                      <td style={{fontSize:12,color:"var(--g5)"}}>{t.email||t.telefone||"—"}</td>
                      <td><div className="tact">
                        <button className="ib e" onClick={()=>setModal({tipo:"tecnico",data:t})}><Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" s={13}/></button>
                        <button className="ib d" onClick={()=>excluirTec(t.id)}><Ic d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" s={13}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <footer className="ftr"><p>{CONFIG.nomeDoSistema} © {CONFIG.ano} — {CONFIG.rodape}</p></footer>
    </>
  );
}
