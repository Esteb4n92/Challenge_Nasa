// Estado físico del astronauta. La radiación, el hambre y la sed lo debilitan (sin "game over").
// El Sol carga la base; al astronauta lo "cargan" la comida y el agua.
export function cuerpo(s, c) {
  const k = c.cuerpo || {};
  const hambre = s.comida < (k.umbralHambre ?? 20), sed = s.agua < (k.umbralSed ?? 20);
  const radMedia = s.dosis >= (k.dosisMedia ?? 40), radAlta = s.dosis >= (k.dosisAlta ?? 70);
  let traje = 1, velocidad = 1; // traje > 1: el aire se gasta más rápido
  if (radMedia) traje *= k.trajeRadiacion ?? 1.33;
  if (hambre || sed) { traje *= k.trajeDebil ?? 1.25; velocidad *= k.velocidadDebil ?? 0.75; }
  return { traje, velocidad, apMenos: radAlta ? 1 : 0, hambre, sed, radMedia, radAlta };
}

// Avisos de REGO sobre el cuerpo, el más urgente primero.
export function avisosCuerpo(s, c) {
  const e = cuerpo(s, c), a = [];
  if (e.radAlta) a.push('☢️ Tu dosis de radiación es muy alta: estás agotado y tienes 1 acción menos cada sol. Protege la base con muros de agua y regolito.');
  else if (e.radMedia) a.push('☢️ La radiación te está debilitando: el aire del traje dura menos. Sal solo cuando haga falta.');
  if (e.hambre && e.sed) a.push('🍽️ Tienes hambre y sed: caminas más lento y el traje dura menos. Recuerda: el Sol carga la base, pero a ti te cargan la comida y el agua.');
  else if (e.hambre) a.push('🍽️ Tienes hambre: caminas más lento y el traje dura menos. Recuerda: el Sol carga la base, pero a ti te carga la comida. Cosecha en el Invernadero.');
  else if (e.sed) a.push('💧 Tienes sed: caminas más lento y el traje dura menos. Recuerda: el Sol carga la base, pero a ti te carga el agua. Busca hielo o usa la Planta de agua.');
  return a;
}
