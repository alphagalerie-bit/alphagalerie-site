import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVisita() {
  useEffect(() => {
    if (sessionStorage.getItem('ag_visited')) return;
    sessionStorage.setItem('ag_visited', '1');

    (async () => {
      let cidade: string | null = null;
      let estado: string | null = null;
      let pais: string | null = null;

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const d = await res.json();
          cidade = d.city ?? null;
          estado = d.region ?? null;
          pais = d.country_name ?? null;
        }
      } catch { /* geo lookup is optional */ }

      try {
        await supabase.from('visitas_site').insert({
          data: new Date().toISOString().slice(0, 10),
          pagina: 'home',
          ts: new Date().toISOString(),
          cidade,
          estado,
          pais,
        });
      } catch { /* table may not exist yet — ignore */ }
    })();
  }, []);
}
