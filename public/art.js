// Orbit Tasks visual identity: graph paper, checkboxes, cards moving across a kanban board.
export const theme = {
  badge: (k, s) => `<span class="ob" style="width:${s}px;height:${s}px"><svg viewBox="0 0 40 40" aria-hidden="true"><rect class="obr" x="4" y="4" width="32" height="32" rx="9"/><path class="obc" d="M12 21l6 6 11-13"/></svg></span>`,
  empty: () => `<svg class="oe" viewBox="0 0 160 110" width="170" aria-hidden="true"><rect class="g3" x="34" y="26" width="92" height="52" rx="10"/><rect class="g2" x="26" y="18" width="92" height="52" rx="10"/><g class="gcard"><rect x="18" y="10" width="92" height="52" rx="10" class="g1"/><rect x="30" y="24" width="44" height="7" rx="3.5" class="gl"/><rect x="30" y="38" width="62" height="6" rx="3" class="gl2"/><circle cx="96" cy="26" r="7" class="gp"/><path d="M93 26l2.5 2.5 4-5" class="gt"/></g></svg>`,
};
export const kanbanHero = () => `<div class="kh" aria-hidden="true"><svg viewBox="0 0 360 190" width="100%" height="190">
<g class="kcol"><rect x="6" y="6" width="108" height="178" rx="12"/><rect x="126" y="6" width="108" height="178" rx="12"/><rect x="246" y="6" width="108" height="178" rx="12"/></g>
<g class="khd"><rect x="18" y="18" width="40" height="7" rx="3.5"/><rect x="138" y="18" width="52" height="7" rx="3.5"/><rect x="258" y="18" width="34" height="7" rx="3.5"/></g>
<g class="kc"><rect x="16" y="40" width="88" height="34" rx="8"/><rect x="26" y="52" width="52" height="6" rx="3" class="kl"/></g>
<g class="kc"><rect x="16" y="82" width="88" height="34" rx="8"/><rect x="26" y="94" width="40" height="6" rx="3" class="kl"/></g>
<g class="kc"><rect x="136" y="40" width="88" height="34" rx="8"/><rect x="146" y="52" width="58" height="6" rx="3" class="kl"/></g>
<g class="kc dn"><rect x="256" y="40" width="88" height="34" rx="8"/><rect x="266" y="52" width="46" height="6" rx="3" class="kl"/><path d="M326 50l4 4 7-9" class="kt"/></g>
<g class="kmove"><g class="kc hot"><rect x="16" y="124" width="88" height="34" rx="8"/><rect x="26" y="136" width="62" height="6" rx="3" class="kl"/><path d="M326 50l4 4 7-9" class="kt kt2" transform="translate(-232 84)"/></g></g></svg></div>`;
