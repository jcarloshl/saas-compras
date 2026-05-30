import React from 'react';

// ─── Paleta dinámica ────────────────────────────────────────────────────────
export function aPalette(dark) {
  return dark ? {
    cream:   '#181410',
    paper:   '#241D17',
    paperHi: '#2C241D',
    ink:     '#F1E7DA',
    muted:   '#A09080',
    faint:   '#6E5E50',
    hairline:'rgba(241,231,218,0.08)',
    primary: '#C76A4D',
    olive:   '#9CAA7A',
    mustard: '#E0B259',
    plum:    '#B881B5',
    elev:    '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 8px rgba(0,0,0,0.25)',
    elevHi:  '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px rgba(0,0,0,0.35)',
    serif:   '"Newsreader", "Iowan Old Style", Georgia, serif',
    sans:    '"Manrope", -apple-system, system-ui, sans-serif',
  } : {
    cream:   '#F7F1E8',
    paper:   '#FFFFFF',
    paperHi: '#FBF6EE',
    ink:     '#2A1F18',
    muted:   '#7A6A5C',
    faint:   '#A89684',
    hairline:'rgba(42,31,24,0.08)',
    primary: '#C76A4D',
    olive:   '#6B7A4D',
    mustard: '#D9A04A',
    plum:    '#8E5B8C',
    elev:    '0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(80,40,20,0.05)',
    elevHi:  '0 8px 24px rgba(80,40,20,0.12)',
    serif:   '"Newsreader", "Iowan Old Style", Georgia, serif',
    sans:    '"Manrope", -apple-system, system-ui, sans-serif',
  };
}

// Alias estático para backward compatibility con páginas no migradas al ThemeContext
export const T = aPalette(false);

// ─── Tile backgrounds ────────────────────────────────────────────────────────
const TILE_TINTS_LIGHT = ['#F1E5D2','#EADFD0','#E8DCC8','#E4D5C0','#EFE3D0','#E9DDC7','#EBE0CC','#E6D8BD'];
const TILE_TINTS_DARK  = ['#2E2620','#2A231C','#332921','#2C241D','#322820','#2E251F','#2B2419','#312820'];
export const tileBg = (dark, i) => (dark ? TILE_TINTS_DARK : TILE_TINTS_LIGHT)[i % 8];

// ─── Categorías ──────────────────────────────────────────────────────────────
export const CATEGORIAS = [
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Lácteos y Huevos',
  'Panadería',
  'Almacén / Despensa',
  'Bebidas',
  'Limpieza del Hogar',
  'Higiene Personal',
  'Snacks y Dulces',
  'Congelados',
  'Otros',
];

export const CAT_META = {
  'Frutas y Verduras':  { emoji: '🥬', color: '#6B7A4D' },
  'Carnes y Pescados':  { emoji: '🥩', color: '#C76A4D' },
  'Lácteos y Huevos':   { emoji: '🥛', color: '#D9A04A' },
  'Panadería':          { emoji: '🥖', color: '#D9A04A' },
  'Almacén / Despensa': { emoji: '🍝', color: '#8E5B8C' },
  'Bebidas':            { emoji: '🧃', color: '#5A8FA8' },
  'Limpieza del Hogar': { emoji: '🧴', color: '#5A8FA8' },
  'Higiene Personal':   { emoji: '🧼', color: '#5A8FA8' },
  'Snacks y Dulces':    { emoji: '🍫', color: '#D9A04A' },
  'Congelados':         { emoji: '🧊', color: '#5A8FA8' },
  'Otros':              { emoji: '📦', color: '#7A6A5C' },
};

// ─── Auto-detección de categoría ─────────────────────────────────────────────
const CAT_KEYWORDS = {
  'Frutas y Verduras': [
    'manzana','pera','naranja','limon','platano','banana','uva','fresa','frutilla',
    'sandia','melon','durazno','nectarin','ciruela','cereza','mango','pina','kiwi',
    'papaya','frambuesa','mora','arandano','maracuya','higo','palta','aguacate',
    'tomate','lechuga','zanahoria','papa','cebolla','ajo','pimiento','brocoli',
    'coliflor','espinaca','acelga','pepino','zapallo','calabaza','apio','puerro',
    'rabano','remolacha','betarraga','champiñon','hongo','alcachofa','esparrago',
    'choclo','maiz','habas','arveja','poroto','lenteja','garbanzo','repollo',
    'berro','rucula','endivia','nabo','chayote','perejil','cilantro','albahaca',
    'verdura','fruta','vegetal','ensalada',
  ],
  'Carnes y Pescados': [
    'pollo','res','vaca','cerdo','chancho','cordero','pavo','carne','filete',
    'bistec','chuleta','costilla','lomo','pechuga','muslo','ala','paleta',
    'salchicha','vienesa','chorizo','longaniza','jamon','tocino','bacon','mortadela',
    'pate','asado','plateada','mechada','osobuco','menudencia','menudo',
    'salmon','atun','merluza','reineta','corvina','trucha','camaron','marisco',
    'pescado','calamar','pulpo','mejillon','ostra','ostion','almeja',
    'anchoa','sardina','jurel','congrio',
  ],
  'Lácteos y Huevos': [
    'leche','queso','yogur','yogurt','mantequilla','margarina','crema','nata',
    'kefir','ricotta','cottage','huevo','quesillo','manjar','dulce de leche',
    'helado','lacteo','buttermilk','cuajada','requesón','requesón',
    'loncoleche','soprole','nestlé',
  ],
  'Panadería': [
    'pan','marraqueta','hallulla','baguette','ciabatta','croissant','tostada',
    'galleta','bizcocho','pastel','torta','queque','muffin','pancake','wafle',
    'bagel','dona','donut','empanada','masa','levadura','brioche','focaccia',
    'pitta','pita','chapata','pan de molde','pan integral','pan centeno',
    'milhojas','berlín','sopaipilla',
  ],
  'Almacén / Despensa': [
    'arroz','fideos','pasta','spaghetti','tallarin','avena','cereal','granola',
    'muesli','quinoa','aceite','vinagre','sal','azucar','pimienta','oregano',
    'condimento','especias','salsa','ketchup','mayonesa','mostaza','soya','soja',
    'mermelada','miel','manteca','conserva','sopa','caldo','te','cafe','cacao',
    'chocolate','vainilla','canela','jengibre','comino','paprika','curry',
    'nuez moscada','laurel','tomillo','romero','maicena','polvo de hornear',
    'gelatina','pudin','flan','cocoa','miso','tofu','tempeh','algas',
  ],
  'Bebidas': [
    'agua','jugo','refresco','gaseosa','bebida','cola','pepsi','sprite','fanta',
    'cerveza','vino','pisco','ron','whisky','vodka','chicha','gin','tequila',
    'néctar','nectar','zumo','isotónico','energética','energetica','limonada',
    'te helado','kombucha','leche vegetal','bebida vegetal','smoothie','batido',
    'sidra','hidratante','agua mineral','agua con gas',
  ],
  'Limpieza del Hogar': [
    'detergente','jabon platos','lavavajillas','cloro','lejia','limpiador',
    'desengrasante','desinfectante','escoba','trapeador','fregona','esponja',
    'guante','bolsa basura','papel higienico','papel cocina','servilleta',
    'suavizante','quitamanchas','limpiavidrios','ambientador','insecticida',
    'rodenticida','trampas','cera','lustramuebles','limpia horno','quita sarro',
    'pastilla wc','escobilla','recogedor','plumero',
  ],
  'Higiene Personal': [
    'shampoo','champu','acondicionador','jabon cuerpo','gel ducha','crema corporal',
    'desodorante','antitranspirante','pasta dental','dentifrico','cepillo dientes',
    'enjuague bucal','hilo dental','rasuradora','afeitadora','crema afeitar',
    'toalla femenina','tampon','pañal','panal','algodón','algodon','protector solar',
    'maquillaje','base','labial','rimel','mascara','sombra','perfume','colonia',
    'tónico','tonico','serum','hidratante facial','exfoliante','mascarilla facial',
  ],
  'Snacks y Dulces': [
    'papas fritas','chips','mani','almendra','nuez','pistache','pistacho','castana',
    'caramelo','dulce','gomita','chicle','chocolate','barra','snack','palomitas',
    'popcorn','nachos','galleta salada','crackers','tostadas saladas','canchita',
    'mix de nueces','frutos secos',
  ],
  'Congelados': [
    'pizza congelada','nugget','croqueta','lasaña congelada','verdura congelada',
    'papas precocidas','empanada congelada','congelado','frozen','hamburguesa congelada',
    'bastones de pescado','sorbet','smoothie bowl',
  ],
};

const _norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const detectarCategoria = (nombre) => {
  const n = _norm(nombre);
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    if (kws.some(kw => n.includes(_norm(kw)))) return cat;
  }
  return 'Otros';
};

// ─── Iconos ──────────────────────────────────────────────────────────────────
export const Ico = {
  Plus:    ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Check:   ({ s=18, c='currentColor', w=2.2 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  X:       ({ s=18, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  ChevL:   ({ s=18, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevR:   ({ s=14, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock:   ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={w}/><path d="M12 7.5V12l3 2" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Grid:    ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/></svg>,
  Sparkle: ({ s=18, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke={c} strokeWidth={w} strokeLinejoin="round"/></svg>,
  Search:  ({ s=18, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth={w}/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Trash:   ({ s=16, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M9 6V4h6v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:    ({ s=16, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18 2l3 3-9 9-4 1 1-4 9-9z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // Nuevos iconos
  List:    ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Bell:    ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 1112 0v4l2 2H4l2-2v-4z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/><path d="M10 18a2 2 0 004 0" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  People:  ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke={c} strokeWidth={w}/><path d="M2 20c0-3.866 3.134-7 7-7" stroke={c} strokeWidth={w} strokeLinecap="round"/><circle cx="17" cy="9" r="2.5" stroke={c} strokeWidth={w}/><path d="M14 20c0-2.761 2.239-5 5-5" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Mic:     ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={c} strokeWidth={w}/><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Dots:    ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill={c}/><circle cx="12" cy="12" r="1.5" fill={c}/><circle cx="19" cy="12" r="1.5" fill={c}/></svg>,
  Heart:   ({ s=20, c='currentColor', w=1.8, filled=false }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : 'none'}><path d="M12 21C12 21 4 14.5 4 9a5 5 0 018-4 5 5 0 018 4c0 5.5-8 12-8 12z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Camera:  ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth={w}/><circle cx="12" cy="14" r="3.5" stroke={c} strokeWidth={w}/><path d="M8 7l2-3h4l2 3" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Wallet:  ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" stroke={c} strokeWidth={w}/><path d="M6 7V6a2 2 0 012-2h7a2 2 0 012 2v1" stroke={c} strokeWidth={w} strokeLinecap="round"/><rect x="15" y="12" width="5" height="4" rx="1" stroke={c} strokeWidth={w}/><circle cx="17.5" cy="14" r="0.75" fill={c}/></svg>,
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 22, color = '#C76A4D' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid rgba(199,106,77,0.25)`,
      borderTopColor: color,
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'cesta-spin 0.7s linear infinite',
      flexShrink: 0,
    }}/>
  );
}
