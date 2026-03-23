import { useEffect, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';
import { MetricCard } from './components/MetricCard';
import { PlayerProfileBadge } from './components/PlayerProfileBadge';
import { PerformanceReport } from './components/PerformanceReport';
import { RecurringErrors } from './components/RecurringErrors';
import { ImprovementAreas } from './components/ImprovementAreas';
import { RecommendationCard } from './components/RecommendationCard';
import { SideToggle } from './components/SideToggle';

type MaybeNum = number | string | null | undefined;

function toNumber(value: MaybeNum): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value.replace('%', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreFromRange(value: number | null, min: number, max: number, weight: number): number {
  if (value === null) return 0;
  if (max <= min) return 0;
  const t = (value - min) / (max - min);
  return clamp(t, 0, 1) * weight;
}

function computeTacticalScore(params: {
  kdr: number | null;
  adr: number | null;
  hsPct: number | null;
  winrate: number | null;
  latestKdr: number | null;
  latestAdr: number | null;
}): number {
  // 0..100, heurístico (no inventa datos; sólo los pondera)
  const base = 10;
  const kdr = scoreFromRange(params.kdr, 0.7, 1.4, 35);
  const adr = scoreFromRange(params.adr, 55, 100, 35);
  const hs = scoreFromRange(params.hsPct, 18, 50, 15);
  const win = scoreFromRange(params.winrate, 45, 60, 10);

  // Ajuste suave por la última partida (forma reciente)
  const form = scoreFromRange(params.latestKdr, 0.7, 1.4, 3) + scoreFromRange(params.latestAdr, 55, 100, 2);

  return Math.round(clamp(base + kdr + adr + hs + win + form, 0, 100));
}

function buildInsights(lifetime: any, latestStats: any) {
  const lifetimeKdr = toNumber(lifetime?.kdr);
  const lifetimeAdr = toNumber(lifetime?.adr);
  const lifetimeHs = toNumber(lifetime?.hs_pct);
  const lifetimeWinrate = toNumber(lifetime?.winrate);

  const latestKdr = toNumber(latestStats?.kd_ratio);
  const latestAdr = toNumber(latestStats?.adr);
  const latestHs = toNumber(latestStats?.headshot_pct);
  const latestKills = toNumber(latestStats?.kills);
  const latestDeaths = toNumber(latestStats?.deaths);

  const tacticalScore = computeTacticalScore({
    kdr: lifetimeKdr,
    adr: lifetimeAdr,
    hsPct: lifetimeHs,
    winrate: lifetimeWinrate,
    latestKdr,
    latestAdr,
  });

  const recurringErrors: string[] = [];
  const areasToImprove: string[] = [];
  const recommendations: string[] = [];

  // Errores recurrentes (heurísticos basados en métricas reales)
  if (lifetimeKdr !== null && lifetimeKdr < 1.0) recurringErrors.push('K/D global por debajo de 1.0');
  if (lifetimeAdr !== null && lifetimeAdr < 70) recurringErrors.push('ADR global bajo (poco impacto por ronda)');
  if (lifetimeHs !== null && lifetimeHs < 25) recurringErrors.push('Porcentaje de HS bajo (aim/selección de duelos)');
  if (lifetimeWinrate !== null && lifetimeWinrate < 50) recurringErrors.push('Winrate global bajo (cierre/consistencia)');

  if (latestKdr !== null && latestKdr < 1.0) recurringErrors.push('Última partida: K/D por debajo de 1.0');
  if (latestAdr !== null && latestAdr < 70) recurringErrors.push('Última partida: ADR bajo');
  if (latestHs !== null && latestHs < 25) recurringErrors.push('Última partida: HS% bajo');
  if (latestKills !== null && latestDeaths !== null && latestDeaths > latestKills + 3)
    recurringErrors.push('Última partida: demasiadas muertes vs kills');

  // Áreas de mejora (acción)
  if (lifetimeAdr !== null && lifetimeAdr < 75) areasToImprove.push('Aumentar daño por ronda: prioriza trade damage y utilidad');
  if (lifetimeKdr !== null && lifetimeKdr < 1.05) areasToImprove.push('Reducir muertes evitables: reposiciona después de pick y juega crossfires');
  if (lifetimeHs !== null && lifetimeHs < 30) areasToImprove.push('Mejorar precisión: pre-aim, altura de mira y control de recoil');
  if (lifetimeWinrate !== null && lifetimeWinrate < 52) areasToImprove.push('Mejorar cierre: juega más seguro con ventaja y gestiona economía');

  // Recomendaciones personalizadas (prioriza lo más “débil”)
  if (lifetimeHs !== null && lifetimeHs < 30) recommendations.push('Rutina de aim 10–15 min antes de jugar (prefire + recoil)');
  if (lifetimeAdr !== null && lifetimeAdr < 80)
    recommendations.push('Entra a rondas con plan de utilidad: molly/flash para ganar espacio sin regalar vida');
  if (lifetimeKdr !== null && lifetimeKdr < 1.05) recommendations.push('Busca trades: juega pegado a un compañero y evita duelos aislados');
  if (lifetimeWinrate !== null && lifetimeWinrate < 52) recommendations.push('Micro-llamadas: pausa 2s antes de ejecutar (setup, timings y crosshair)');
  if (recommendations.length === 0) recommendations.push('Mantén consistencia: revisa 1 demo por sesión y fija 1 objetivo por mapa');

  const performanceReport: string[] = [];
  if (tacticalScore >= 75) performanceReport.push('Alto impacto global: buen balance entre daño, supervivencia y consistencia.');
  else if (tacticalScore >= 55) performanceReport.push('Rendimiento medio: hay margen claro para subir consistencia y impacto por ronda.');
  else performanceReport.push('Rendimiento bajo: prioriza fundamentos (supervivencia, daño y toma de duelos).');

  if (lifetimeKdr !== null && lifetimeAdr !== null)
    performanceReport.push(`Base global: K/D ${lifetimeKdr.toFixed(2)} · ADR ${Math.round(lifetimeAdr)}.`);
  if (latestKdr !== null && latestAdr !== null)
    performanceReport.push(`Última partida: K/D ${latestKdr.toFixed(2)} · ADR ${Math.round(latestAdr)}.`);

  // Comparación T vs CT (cuando FACEIT lo provee)
  const t = latestStats?.t;
  const ct = latestStats?.ct;
  const tKills = toNumber(t?.kills);
  const ctKills = toNumber(ct?.kills);
  const tAdr = toNumber(t?.adr);
  const ctAdr = toNumber(ct?.adr);

  const tVsCt = {
    available: tKills !== null || ctKills !== null || tAdr !== null || ctAdr !== null,
    t: {
      kills: tKills,
      deaths: toNumber(t?.deaths),
      adr: tAdr,
      kd: toNumber(t?.kd_ratio),
    },
    ct: {
      kills: ctKills,
      deaths: toNumber(ct?.deaths),
      adr: ctAdr,
      kd: toNumber(ct?.kd_ratio),
    },
  };

  // Si hay diferencia marcada, recomienda ajustar el lado “débil”
  if (tVsCt.available && tAdr !== null && ctAdr !== null) {
    const diff = ctAdr - tAdr;
    if (diff >= 10) recommendations.unshift('T-side: juega más por trade + utilidad para subir impacto');
    if (diff <= -10) recommendations.unshift('CT-side: mejora anclas/retakes y disciplina de ángulos');
  }

  return {
    tacticalScore,
    performanceReport,
    recurringErrors: recurringErrors.slice(0, 6),
    areasToImprove: areasToImprove.slice(0, 6),
    recommendations: recommendations.slice(0, 6),
    tVsCt,
  };
}

type RoleKey = 'Entry Fragger' | 'Francotirador (AWPer)' | 'Líder en el juego (IGL)' | 'Lurker (Observador)' | 'Soporte' | 'Ancla';

const ROLE_DESCRIPTIONS: Record<RoleKey, string[]> = {
  'Entry Fragger': [
    'Inicias los ataques y abres espacio para tu equipo.',
    'Juegas agresivo, entrando primero y enfrentando enemigos.',
    'Limpias zonas clave y creas oportunidades en el sitio.',
    'Asumes el mayor riesgo al ser el primero en contacto.',
    'Necesitas reflejos rápidos y buena toma de decisiones.',
  ],
  'Francotirador (AWPer)': [
    'Eliminas enemigos a larga distancia con precisión.',
    'Controlas zonas del mapa y castigas errores del rival.',
    'Puedes cambiar una ronda con un solo disparo.',
    'Debes tener excelente puntería y reacción.',
    'Eres vulnerable en combate cercano si fallas.',
  ],
  'Líder en el juego (IGL)': [
    'Tomas decisiones y guías al equipo en cada ronda.',
    'Defines estrategias y coordinas a todos los jugadores.',
    'Debes tener visión de juego y pensamiento táctico.',
    'No necesitas ser el mejor en aim, sino en liderazgo.',
    'La presión recae en tus decisiones durante la partida.',
  ],
  'Lurker (Observador)': [
    'Te mueves de forma sigilosa y sorprendes enemigos.',
    'Buscas eliminaciones inesperadas y generas caos.',
    'Aprovechas errores y rotaciones del rival.',
    'Debes jugar solo y con paciencia.',
    'Tu impacto depende del timing y posicionamiento.',
  ],
  Soporte: [
    'Ayudas al equipo con utilidad y cobertura.',
    'Usas flashes, smokes y granadas para facilitar jugadas.',
    'Apoyas en cualquier situación y te adaptas al equipo.',
    'Creas oportunidades sin exponerte demasiado.',
    'Debes conocer bien el uso de utilidades.',
  ],
  Ancla: [
    'Defiendes un sitio y evitas que planten bomba.',
    'Mantienes posiciones clave y retrasas al enemigo.',
    'Resistes ataques y das información al equipo.',
    'Eres la última línea de defensa en muchas rondas.',
    'Tu posicionamiento y paciencia son clave.',
  ],
};

function assignRole(lifetime: any, latestStats: any, tVsCt: any): { role: RoleKey; why: string[] } {
  const lKdr = toNumber(lifetime?.kdr);
  const lAdr = toNumber(lifetime?.adr);
  const lHs = toNumber(lifetime?.hs_pct);
  const lWin = toNumber(lifetime?.winrate);

  const mKdr = toNumber(latestStats?.kd_ratio);
  const mAdr = toNumber(latestStats?.adr);
  const mHs = toNumber(latestStats?.headshot_pct);
  const mKills = toNumber(latestStats?.kills);
  const mDeaths = toNumber(latestStats?.deaths);

  const tAdr = toNumber(tVsCt?.t?.adr);
  const ctAdr = toNumber(tVsCt?.ct?.adr);
  const tKills = toNumber(tVsCt?.t?.kills);
  const ctKills = toNumber(tVsCt?.ct?.kills);

  const vKdr = mKdr ?? lKdr;
  const vAdr = mAdr ?? lAdr;
  const vHs = mHs ?? lHs;

  const scores: Record<RoleKey, number> = {
    'Entry Fragger': 0,
    'Francotirador (AWPer)': 0,
    'Líder en el juego (IGL)': 0,
    'Lurker (Observador)': 0,
    Soporte: 0,
    Ancla: 0,
  };

  // Entry: mucha participación y riesgo (kills + deaths), impacto decente
  if (mKills !== null) scores['Entry Fragger'] += clamp(mKills / 20, 0, 1) * 1.4;
  if (mDeaths !== null) scores['Entry Fragger'] += clamp(mDeaths / 20, 0, 1) * 1.1;
  if (vAdr !== null) scores['Entry Fragger'] += scoreFromRange(vAdr, 65, 100, 1.2);
  if (tAdr !== null && ctAdr !== null && tAdr >= ctAdr + 8) scores['Entry Fragger'] += 0.6;
  if (tKills !== null && ctKills !== null && tKills >= ctKills + 3) scores['Entry Fragger'] += 0.5;

  // AWPer: HS% alto + K/D alto (proxy), impacto estable
  if (vKdr !== null) scores['Francotirador (AWPer)'] += scoreFromRange(vKdr, 1.0, 1.5, 1.5);
  if (vHs !== null) scores['Francotirador (AWPer)'] += scoreFromRange(vHs, 28, 55, 1.2);
  if (vAdr !== null) scores['Francotirador (AWPer)'] += scoreFromRange(vAdr, 70, 105, 0.9);

  // IGL: winrate relativamente alto aunque stats no sean top
  if (lWin !== null) scores['Líder en el juego (IGL)'] += scoreFromRange(lWin, 50, 60, 1.5);
  if (vKdr !== null) scores['Líder en el juego (IGL)'] += (vKdr < 1.05 ? 0.6 : 0.2);
  if (vAdr !== null) scores['Líder en el juego (IGL)'] += (vAdr < 80 ? 0.5 : 0.2);

  // Lurker: K/D alto con muertes relativamente bajas (sobrevive y cierra)
  if (vKdr !== null) scores['Lurker (Observador)'] += scoreFromRange(vKdr, 1.05, 1.6, 1.6);
  if (mDeaths !== null) scores['Lurker (Observador)'] += (mDeaths <= 14 ? 0.9 : 0.2);
  if (vAdr !== null) scores['Lurker (Observador)'] += scoreFromRange(vAdr, 65, 95, 0.6);
  if (tAdr !== null && ctAdr !== null && tAdr >= ctAdr + 6) scores['Lurker (Observador)'] += 0.3;

  // Soporte: stats medios, winrate aceptable, menos muertes por exposición
  if (lWin !== null) scores.Soporte += scoreFromRange(lWin, 50, 60, 1.0);
  if (vAdr !== null) scores.Soporte += scoreFromRange(vAdr, 60, 90, 0.6);
  if (mDeaths !== null) scores.Soporte += (mDeaths <= 15 ? 0.8 : 0.2);

  // Ancla: CT-side se destaca (aguanta sitio / retakes)
  if (ctAdr !== null && tAdr !== null) scores.Ancla += scoreFromRange(ctAdr - tAdr, 6, 18, 1.4);
  if (ctKills !== null && tKills !== null) scores.Ancla += scoreFromRange(ctKills - tKills, 2, 8, 0.9);
  if (mDeaths !== null) scores.Ancla += (mDeaths <= 16 ? 0.4 : 0.1);

  // Pick best (type-safe)
  let best: RoleKey = 'Soporte';
  let bestScore = -Infinity;
  for (const [k, s] of Object.entries(scores) as Array<[RoleKey, number]>) {
    if (s > bestScore) {
      bestScore = s;
      best = k;
    }
  }

  const why: string[] = [];
  if (best === 'Entry Fragger') {
    if (mKills !== null && mDeaths !== null) why.push(`Última partida: alta participación (K ${mKills} / D ${mDeaths}).`);
    if (tAdr !== null && ctAdr !== null && tAdr > ctAdr) why.push('Impacto mayor en T-side (proxy de apertura/espacio).');
  }
  if (best === 'Francotirador (AWPer)') {
    if (vKdr !== null) why.push(`K/D alto (${vKdr.toFixed(2)}) indica duelos favorables.`);
    if (vHs !== null) why.push(`HS% alto (${Math.round(vHs)}%) sugiere precisión.`);
  }
  if (best === 'Líder en el juego (IGL)') {
    if (lWin !== null) why.push(`Winrate global sólido (${Math.round(lWin)}%).`);
    why.push('Perfil más orientado a consistencia/decisiones que a fragging puro.');
  }
  if (best === 'Lurker (Observador)') {
    if (mDeaths !== null) why.push(`Última partida: muertes controladas (${mDeaths}).`);
    if (vKdr !== null) why.push(`K/D alto (${vKdr.toFixed(2)}) favorece picks y cierres.`);
  }
  if (best === 'Soporte') {
    if (mDeaths !== null) why.push(`Última partida: exposición moderada (D ${mDeaths ?? '-'}).`);
    why.push('Buen rol para maximizar impacto con utilidad y trades.');
  }
  if (best === 'Ancla') {
    if (ctAdr !== null && tAdr !== null) why.push(`CT-side más fuerte (ADR CT ${ctAdr} vs T ${tAdr}).`);
    why.push('Perfil ideal para defender sitio y retrasar ejecuciones.');
  }

  if (why.length === 0) why.push('Asignación basada en tus métricas actuales de FACEIT.');
  return { role: best, why: why.slice(0, 3) };
}

export default function App() {
  const [userNickname, setUserNickname] = useState('Cargando...');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'select-user' | 'dashboard'>('select-user');
  const [recentUsers, setRecentUsers] = useState<string[]>([]);

  const [faceitNicknameInput, setFaceitNicknameInput] = useState('');
  const [faceitSummary, setFaceitSummary] = useState<any>(null);
  const [faceitLatestMatch, setFaceitLatestMatch] = useState<any>(null);
  const [faceitError, setFaceitError] = useState<string | null>(null);
  const [faceitSuggestions, setFaceitSuggestions] = useState<any[]>([]);
  const [faceitSearching, setFaceitSearching] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'T' | 'CT'>('T');

  const lifetime = faceitSummary?.lifetime || null;
  const latestStats = faceitLatestMatch?.stats || null;

  const insights = useMemo(() => buildInsights(lifetime, latestStats), [lifetime, latestStats]);
  const assignedRole = useMemo(() => assignRole(lifetime, latestStats, insights.tVsCt), [lifetime, latestStats, insights.tVsCt]);

  const roleDescription = useMemo(() => {
    const lines = ROLE_DESCRIPTIONS[assignedRole.role] || [];
    return lines.join(' ');
  }, [assignedRole.role]);

  const performanceBars = useMemo(() => {
    const lKdr = toNumber(lifetime?.kdr);
    const lAdr = toNumber(lifetime?.adr);
    const lHs = toNumber(lifetime?.hs_pct);
    const lWin = toNumber(lifetime?.winrate);

    const kdrPct = lKdr === null ? 0 : Math.round(clamp(((lKdr - 0.7) / (1.4 - 0.7)) * 100, 0, 100));
    const adrPct = lAdr === null ? 0 : Math.round(clamp(((lAdr - 55) / (100 - 55)) * 100, 0, 100));
    const hsPct = lHs === null ? 0 : Math.round(clamp(((lHs - 18) / (50 - 18)) * 100, 0, 100));
    const winPct = lWin === null ? 0 : Math.round(clamp(((lWin - 45) / (60 - 45)) * 100, 0, 100));

    return [
      { name: 'Score táctico', value: insights.tacticalScore },
      { name: 'Impacto (ADR)', value: adrPct },
      { name: 'Duelos (K/D)', value: kdrPct },
      { name: 'Precisión (HS%)', value: hsPct },
      { name: 'Consistencia (Winrate)', value: winPct },
    ];
  }, [insights.tacticalScore, lifetime]);

  const recurringErrorsData = useMemo(() => {
    const lKdr = toNumber(lifetime?.kdr);
    const lAdr = toNumber(lifetime?.adr);
    const lHs = toNumber(lifetime?.hs_pct);
    const lWin = toNumber(lifetime?.winrate);
    const mKdr = toNumber(latestStats?.kd_ratio);
    const mAdr = toNumber(latestStats?.adr);
    const mHs = toNumber(latestStats?.headshot_pct);

    const out: Array<{ error: string; frequency: number; impact: string }> = [];
    const push = (key: string, freq: number, impact: string) => out.push({ error: key, frequency: freq, impact });

    if (lKdr !== null && lKdr < 1.0) push('K/D bajo', (mKdr !== null && mKdr < 1.0 ? 2 : 1), 'Pierdes duelos y quedas en desventaja numérica.');
    if (lAdr !== null && lAdr < 70) push('ADR bajo', (mAdr !== null && mAdr < 70 ? 2 : 1), 'Impacto por ronda bajo: trades y utilidad ayudan.');
    if (lHs !== null && lHs < 25) push('HS% bajo', (mHs !== null && mHs < 25 ? 2 : 1), 'Menos time-to-kill: pre-aim y control de recoil.');
    if (lWin !== null && lWin < 50) push('Winrate bajo', 1, 'Falta cierre/consistencia: economía y rondas clave.');

    return out.slice(0, 4);
  }, [lifetime, latestStats]);

  const improvementAreasData = useMemo(() => {
    const lKdr = toNumber(lifetime?.kdr);
    const lAdr = toNumber(lifetime?.adr);
    const lHs = toNumber(lifetime?.hs_pct);
    const lWin = toNumber(lifetime?.winrate);

    const items: Array<{ area: string; current: number; target: number; priority: 'Alta' | 'Media' | 'Baja' }> = [];
    const add = (area: string, currentPct: number) => {
      const priority = currentPct < 85 ? 'Alta' : currentPct < 95 ? 'Media' : 'Baja';
      items.push({ area, current: Math.round(clamp(currentPct, 0, 100)), target: 100, priority });
    };

    if (lAdr !== null) add('Impacto (ADR)', (lAdr / 85) * 100);
    if (lKdr !== null) add('Duelos (K/D)', (lKdr / 1.1) * 100);
    if (lHs !== null) add('Precisión (HS%)', (lHs / 35) * 100);
    if (lWin !== null) add('Cierre (Winrate)', (lWin / 52) * 100);

    // Ordena por prioridad (Alta primero)
    const rank = { Alta: 0, Media: 1, Baja: 2 } as const;
    return items.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 4);
  }, [lifetime]);

  const recommendationCards = useMemo(() => {
    const recs = insights.recommendations || [];
    return recs.slice(0, 6).map((r) => {
      const priority = r.startsWith('T-side:') || r.startsWith('CT-side:') ? 'Alta' : 'Media';
      const parts = r.split(':');
      const title = parts.length > 1 ? parts[0].trim() : 'Recomendación';
      const description = parts.length > 1 ? parts.slice(1).join(':').trim() : r;
      return { priority: priority as 'Alta' | 'Media' | 'Mantener', title, description };
    });
  }, [insights.recommendations]);

  const sideStats = useMemo(() => {
    if (!insights.tVsCt.available) return null;
    const side = selectedSide === 'T' ? insights.tVsCt.t : insights.tVsCt.ct;
    return {
      kills: side.kills,
      deaths: side.deaths,
      adr: side.adr,
      kd: side.kd,
    };
  }, [insights.tVsCt, selectedSide]);

  const aiVariables = useMemo(() => {
    const level = insights.tacticalScore >= 75 ? 'Alto' : insights.tacticalScore >= 55 ? 'Medio' : 'Bajo';
    const efficiency = insights.tacticalScore;

    const errorsFreq = recurringErrorsData.reduce((sum, e) => sum + (e.frequency || 0), 0);
    const errorsFreqLabel = errorsFreq >= 6 ? 'Alta' : errorsFreq >= 3 ? 'Media' : 'Baja';

    const tAdr = insights.tVsCt?.t?.adr;
    const ctAdr = insights.tVsCt?.ct?.adr;
    let pattern = 'Equilibrado';
    if (typeof tAdr === 'number' && typeof ctAdr === 'number') {
      if (tAdr - ctAdr >= 10) pattern = 'Agresión en T-side';
      if (ctAdr - tAdr >= 10) pattern = 'Solidez en CT-side';
    }

    const lKdr = toNumber(lifetime?.kdr);
    const lAdr = toNumber(lifetime?.adr);
    const lHs = toNumber(lifetime?.hs_pct);
    let cluster = 'Consistente';
    if ((lAdr ?? 0) >= 85 && (lKdr ?? 0) >= 1.15) cluster = 'Impacto alto';
    else if ((lHs ?? 0) >= 35 && (lKdr ?? 0) >= 1.1) cluster = 'Precisión';
    else if ((lAdr ?? 0) < 70 && (lKdr ?? 0) < 1.0) cluster = 'En desarrollo';

    let classification = 'Balance';
    if (assignedRole.role === 'Entry Fragger') classification = 'Agresivo';
    if (assignedRole.role === 'Lurker (Observador)') classification = 'Paciente';
    if (assignedRole.role === 'Ancla') classification = 'Defensivo';
    if (assignedRole.role === 'Soporte') classification = 'Apoyo';
    if (assignedRole.role === 'Francotirador (AWPer)') classification = 'Pick-off';
    if (assignedRole.role === 'Líder en el juego (IGL)') classification = 'Táctico';

    return {
      pattern,
      cluster,
      level,
      classification,
      efficiency,
      errorsFrequency: errorsFreqLabel,
    };
  }, [assignedRole.role, insights.tVsCt, insights.tacticalScore, lifetime, recurringErrorsData]);

  const latestMapName = useMemo(() => {
    const map = faceitLatestMatch?.map;
    if (!map) return null;
    if (typeof map === 'string') return map;
    if (Array.isArray(map?.pick) && map.pick[0]) return String(map.pick[0]);
    if (Array.isArray(map?.entities) && map.entities[0]?.name) return String(map.entities[0].name);
    return null;
  }, [faceitLatestMatch]);

  const loadFaceitForNickname = async (nickname: string): Promise<boolean> => {
    setLoading(true);
    setFaceitError(null);

    const statusRes = await fetch('/api/faceit/status');
    const statusJson = await statusRes.json();
    if (!statusJson?.enabled) {
      setFaceitError(statusJson?.message || 'FACEIT deshabilitado. Configura FACEIT_API_KEY y reinicia backend.');
      setUserNickname('FACEIT deshabilitado');
      setAvatar(null);
      setFaceitSummary(null);
      setFaceitLatestMatch(null);
      setLoading(false);
      return false;
    }

    const [sumRes, latestRes] = await Promise.all([
      fetch(`/api/faceit/summary?nickname=${encodeURIComponent(nickname)}&limit=10`),
      fetch(`/api/faceit/latest-match?nickname=${encodeURIComponent(nickname)}`),
    ]);

    const sumJson = await sumRes.json();
    const latestJson = await latestRes.json();

    if (!sumRes.ok) {
      setFaceitError(sumJson?.error || 'Error cargando datos de FACEIT');
      setFaceitSummary(null);
      setFaceitLatestMatch(null);
      setUserNickname(nickname);
      setAvatar(null);
      setLoading(false);
      return false;
    }

    setFaceitSummary(sumJson);
    setUserNickname(sumJson?.player?.nickname || nickname);
    if (sumJson?.player?.avatar && String(sumJson.player.avatar).startsWith('http')) {
      setAvatar(sumJson.player.avatar);
    } else {
      setAvatar(null);
    }

    if (latestRes.ok) setFaceitLatestMatch(latestJson);
    else setFaceitLatestMatch(null);

    // recientes (nickname resuelto)
    try {
      const resolvedNick = String(sumJson?.player?.nickname || nickname || '').trim();
      if (resolvedNick) {
        setRecentUsers((prev) => {
          const next = [
            resolvedNick,
            ...prev.filter((u) => u.toLowerCase() !== resolvedNick.toLowerCase()),
          ].slice(0, 8);
          try {
            window.localStorage.setItem('recent_faceit_users', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    } catch {
      // ignore
    }

    setLoading(false);
    return true;
  };

  useEffect(() => {
    // 1) carga recientes
    try {
      const raw = window.localStorage.getItem('recent_faceit_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentUsers(parsed.filter((x) => typeof x === 'string').slice(0, 8));
        }
      }
    } catch {
      // ignore
    }

    // 2) chequea estado
    (async () => {
      try {
        const statusRes = await fetch('/api/faceit/status');
        const statusJson = await statusRes.json();
        if (!statusJson?.enabled) {
          setFaceitError(statusJson?.message || 'FACEIT deshabilitado. Configura FACEIT_API_KEY y reinicia backend.');
          setLoading(false);
          return;
        }
        setFaceitError(null);
        setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFaceitError(`No se pudo conectar al backend. ${msg}.`);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (view !== 'select-user') return;
    const q = faceitNicknameInput.trim();

    if (q.length < 3) {
      setFaceitSuggestions([]);
      return;
    }

    setFaceitSearching(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/faceit/search?q=${encodeURIComponent(q)}&limit=8&game=cs2`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setFaceitSuggestions([]);
          setFaceitSearching(false);
          return;
        }

        setFaceitSuggestions(Array.isArray(json?.items) ? json.items : []);
        setFaceitSearching(false);
      } catch {
        if (cancelled) return;
        setFaceitSuggestions([]);
        setFaceitSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [faceitNicknameInput, view]);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-[#2a2a3e] bg-[#1a1a2e]">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">Analizador</span>
            </div>
            {view === 'dashboard' ? (
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-9 h-9 rounded" />
                ) : (
                  <div className="w-9 h-9 rounded bg-[#f97316] flex items-center justify-center text-white font-bold text-sm">
                    {userNickname?.charAt?.(0)?.toUpperCase?.() || 'F'}
                  </div>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-[#f97316]" />
          </div>
        ) : view === 'select-user' ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-[720px]">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold tracking-tight">Usuarios</div>
                <div className="mt-1 text-sm text-gray-400">Busca un nickname de FACEIT para generar el análisis.</div>
              </div>

              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-6">
                {faceitError ? (
                  <div className="mb-4 text-sm text-red-300 bg-[#2a1420] border border-[#5b1a2c] rounded p-3">
                    {faceitError}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    className="w-full bg-[#0f0f1a] border border-[#2a2a3e] rounded px-3 py-2 text-sm"
                    placeholder="Buscar nickname FACEIT (3+ letras)"
                    value={faceitNicknameInput}
                    onChange={(e) => setFaceitNicknameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const nick = faceitNicknameInput.trim();
                      if (!nick) return;
                      (async () => {
                        try {
                          const ok = await loadFaceitForNickname(nick);
                          if (ok) setView('dashboard');
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : String(err);
                          setFaceitError(`No se pudo cargar FACEIT. ${msg}.`);
                        }
                      })();
                    }}
                  />
                  <button
                    className="bg-[#f97316] hover:bg-[#fb923c] text-white rounded px-3 py-2 text-sm font-semibold"
                    onClick={async () => {
                      try {
                        const nick = faceitNicknameInput.trim();
                        if (!nick) return;
                        const ok = await loadFaceitForNickname(nick);
                        if (ok) setView('dashboard');
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        setFaceitError(`No se pudo cargar FACEIT. ${msg}.`);
                      }
                    }}
                  >
                    Analizar
                  </button>
                </div>

                {faceitSuggestions.length > 0 ? (
                  <div className="mt-3 bg-[#0f0f1a] border border-[#2a2a3e] rounded p-2">
                    <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                      <span>Sugerencias</span>
                      {faceitSearching ? <span className="text-gray-600">buscando...</span> : null}
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {faceitSuggestions.map((s) => (
                        <button
                          key={s.player_id}
                          className="w-full text-left px-2 py-2 rounded hover:bg-[#1a1a2e] flex items-center justify-between"
                          onClick={async () => {
                            try {
                              setFaceitNicknameInput(s.nickname);
                              setFaceitSuggestions([]);
                              const ok = await loadFaceitForNickname(s.nickname);
                              if (ok) setView('dashboard');
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : String(err);
                              setFaceitError(`No se pudo cargar FACEIT. ${msg}.`);
                            }
                          }}
                        >
                          <span className="text-sm">{s.nickname}</span>
                          <span className="text-xs text-gray-500">{s.country?.toUpperCase?.() || ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {recentUsers.length > 0 ? (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-2">Usuarios recientes</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {recentUsers.map((u) => (
                        <button
                          key={u}
                          className="bg-[#0f0f1a] border border-[#2a2a3e] rounded px-3 py-2 text-sm text-left hover:bg-[#1a1a2e]"
                          onClick={async () => {
                            try {
                              setFaceitNicknameInput(u);
                              const ok = await loadFaceitForNickname(u);
                              if (ok) setView('dashboard');
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : String(err);
                              setFaceitError(`No se pudo cargar FACEIT. ${msg}.`);
                            }
                          }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">Jugador</div>
                  <div className="mt-1 text-xl font-bold text-white truncate">{userNickname}</div>
                  <div className="mt-1 text-sm text-gray-400">FACEIT</div>
                  <button
                    className="mt-3 text-xs text-gray-400 hover:text-white"
                    onClick={() => {
                      setView('select-user');
                      setFaceitSuggestions([]);
                      setSelectedSide('T');
                    }}
                  >
                    Cambiar usuario
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-12 h-12 rounded" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#f97316] flex items-center justify-center text-white font-bold text-base">
                      {userNickname?.charAt?.(0)?.toUpperCase?.() || 'F'}
                    </div>
                  )}
                </div>
              </div>

              {faceitError ? (
                <div className="mt-4 text-sm text-red-300 bg-[#2a1420] border border-[#5b1a2c] rounded p-3">
                  {faceitError}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlayerProfileBadge primaryProfile={assignedRole.role} description={roleDescription} />
                <div className="rounded border border-[#2a2a3e] bg-[#0f0f1a] p-4">
                  <div className="text-xs text-gray-500">Asignación de rol</div>
                  <div className="mt-1 text-base font-semibold text-white">{assignedRole.role}</div>
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Por qué</div>
                    <div className="space-y-1">
                      {assignedRole.why.map((w) => (
                        <div key={w} className="text-sm text-gray-300">• {w}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <MetricCard label="Matches" value={lifetime?.matches ?? '-'} />
              <MetricCard label="Winrate" value={lifetime?.winrate ?? '-'} />
              <MetricCard label="K/D" value={lifetime?.kdr ?? '-'} />
              <MetricCard label="ADR" value={lifetime?.adr ?? '-'} />
              <MetricCard label="HS%" value={lifetime?.hs_pct ?? '-'} />
              <MetricCard label="Score táctico" value={Number.isFinite(insights?.tacticalScore) ? `${insights.tacticalScore}/100` : '-'} />
            </div>

            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-6">
              <div className="text-sm font-semibold mb-4">Última partida (FACEIT)</div>
              {faceitLatestMatch?.match_id ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400">
                    {faceitLatestMatch?.competition_name || 'Match'}
                    {latestMapName ? ` · ${latestMapName}` : ''}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MetricCard label="Kills" value={latestStats?.kills ?? '-'} />
                    <MetricCard label="Deaths" value={latestStats?.deaths ?? '-'} />
                    <MetricCard label="Assists" value={latestStats?.assists ?? '-'} />
                    <MetricCard label="ADR" value={latestStats?.adr ?? '-'} />
                    <MetricCard label="K/D" value={latestStats?.kd_ratio ?? '-'} />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No hay partida reciente o no se pudo cargar.</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-sm font-semibold">Comparación T vs CT</div>
                  <SideToggle onChange={(side) => setSelectedSide(side)} />
                </div>
                {sideStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Kills" value={sideStats.kills ?? '-'} />
                    <MetricCard label="Deaths" value={sideStats.deaths ?? '-'} />
                    <MetricCard label="ADR" value={sideStats.adr ?? '-'} />
                    <MetricCard label="K/D" value={sideStats.kd ?? '-'} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">FACEIT no entregó breakdown T/CT para esta partida.</div>
                )}
              </div>

              <PerformanceReport data={performanceBars} />
            </div>

            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-6">
              <div className="text-sm font-semibold mb-4">Variables generadas por la IA</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Patrón táctico detectado</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.pattern}</div>
                </div>
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Cluster de comportamiento</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.cluster}</div>
                </div>
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Nivel de desempeño</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.level}</div>
                </div>
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Clasificación del jugador</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.classification}</div>
                </div>
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Índice de eficiencia táctica</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.efficiency}/100</div>
                </div>
                <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
                  <div className="text-xs text-gray-500">Frecuencia de errores</div>
                  <div className="mt-1 text-sm text-white font-semibold">{aiVariables.errorsFrequency}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RecurringErrors errors={recurringErrorsData} />
              <ImprovementAreas areas={improvementAreasData} />

              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-5">
                <div className="text-white font-semibold mb-4">Recomendaciones personalizadas</div>
                <div className="space-y-3">
                  {recommendationCards.map((rc, idx) => (
                    <RecommendationCard key={`${rc.title}-${idx}`} priority={rc.priority} title={rc.title} description={rc.description} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
