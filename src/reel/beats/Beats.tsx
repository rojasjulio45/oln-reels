import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatShell } from "../BeatShell";
import { Headline, K, Sfx, Sub } from "../kit";
import { BeatKey, cue, getBeatDuration } from "../script";
import { Congeners, Factors, Hours, Hundred, People90, Tally } from "./Viz";

// Each beat is only words and a small data figure: the bench underneath is
// continuous. Headlines sit in the top band, the figure under them, the
// object in the middle, captions and the source below.

const HookLinkedIn: React.FC = () => {
  const c = (s: string) => cue("hookLinkedIn", s);
  return (
    <BeatShell beat="hookLinkedIn" fadeIn={false}>
      <Headline
        y={250}
        lines={[
          { text: "90 personas.", at: 6, serif: true, size: 124 },
          { text: "Dos órdenes.", at: c("órdenes") - 6, size: 112 },
          { text: "La misma resaca.", at: c("misma") - 4, accent: "misma", size: 112 },
        ]}
      />
      <Sfx name="click" at={10} volume={0.25} />
    </BeatShell>
  );
};

const HookInstagram: React.FC = () => {
  const c = (s: string) => cue("hookInstagram", s);
  return (
    <BeatShell beat="hookInstagram" fadeIn={false}>
      <Headline
        y={250}
        lines={[
          { text: "¿Cerveza y después\nvino da más resaca?", at: 6, until: c("no") + 4, size: 90 },
          { text: "No.", at: c("no") - 2, accent: "No.", size: 210, serif: true },
        ]}
      />
      <Sfx name="click" at={10} volume={0.25} />
    </BeatShell>
  );
};

const Ensayo: React.FC = () => {
  const c = (s: string) => cue("ensayo", s);
  const total = getBeatDuration("ensayo");
  return (
    <BeatShell beat="ensayo">
      <Headline
        y={230}
        lines={[
          { text: "Cerveza, luego vino.", at: c("cerveza") - 6, until: c("revés") + 2, size: 92 },
          { text: "Vino, luego cerveza.", at: c("revés") - 2, until: c("misma") - 2, size: 92 },
          { text: "La misma lectura.", at: c("misma") - 4, accent: "misma", size: 100 },
        ]}
      />
      <People90 at={c("noventa") - 4} barsAt={c("misma") - 6} until={total - 12} />
    </BeatShell>
  );
};

const Realidad: React.FC = () => {
  const c = (s: string) => cue("realidad", s);
  const lift = c("salir") - 10;
  return (
    <BeatShell beat="realidad" dark={lift}>
      <Headline y={760} color={K.white} lines={[{ text: "Cuánto entra.", at: c("cuánto") - 6, until: lift - 2, size: 150, serif: true }]} />
      <Headline y={250} lines={[{ text: "Cuánto sale.", at: lift + 2, size: 132, serif: true }]} />
      <Sub text="La concentración de etanol predice la resaca²" at={lift + 14} y={380} />
      <Sfx name="drip" at={lift + 10} volume={0.2} />
    </BeatShell>
  );
};

const Higado: React.FC = () => {
  const c = (s: string) => cue("higado", s);
  const total = getBeatDuration("higado");
  return (
    <BeatShell beat="higado">
      <Headline y={240} lines={[{ text: "≈ 1 trago por hora³", at: c("un trago") - 8, accent: "1", size: 96 }]} />
      <Hours at={c("procesa") - 4} until={total - 12} />
      <Sfx name="click" at={c("procesa")} volume={0.3} />
      <Sfx name="drip" at={c("procesa") + 14} volume={0.25} />
      <Sfx name="drip" at={c("procesa") + 36} volume={0.2} />
      <Sfx name="drip" at={c("procesa") + 60} volume={0.2} />
    </BeatShell>
  );
};

const Congeneres: React.FC = () => {
  const c = (s: string) => cue("congeneres", s);
  const total = getBeatDuration("congeneres");
  return (
    <BeatShell beat="congeneres">
      <Headline y={240} lines={[{ text: "Congéneres⁴", at: c("congéneres") - 6, accent: "Congéneres", size: 124 }]} />
      <Congeners at={c("oscuras") - 6} until={total - 12} />
      <Sfx name="click" at={c("oscuras") + 20} volume={0.25} />
    </BeatShell>
  );
};

const Velocidad: React.FC = () => {
  const c = (s: string) => cue("velocidad", s);
  const total = getBeatDuration("velocidad");
  const words: Array<[string, string]> = [
    ["Velocidad.", "velocidad"],
    ["Estómago vacío.", "vacío"],
    ["Burbujas.", "burbujas"],
    ["Sueño.", "poco"],
  ];
  return (
    <BeatShell beat="velocidad">
      <Headline
        y={230}
        lines={words.map(([text, word], i) => ({
          text,
          at: c(word) - 6,
          until: i < words.length - 1 ? c(words[i + 1][1]) - 6 : undefined,
          size: 108,
        }))}
      />
      <Sub text="También cuenta el cómo⁵" at={4} y={350} />
      <Factors at={2} cues={[c("velocidad") - 2, c("vacío") - 2, c("burbujas") - 2, c("poco") - 2]} until={total - 10} />
    </BeatShell>
  );
};

const Porque: React.FC = () => {
  const c = (s: string) => cue("porque", s);
  const lift = c("mezclar") - 4;
  const total = getBeatDuration("porque");
  return (
    <BeatShell beat="porque" dark={lift}>
      <Headline y={760} color={K.white} lines={[{ text: "El mito parece cierto.", at: 4, until: lift - 2, size: 124, serif: true }]} />
      <Headline y={240} lines={[{ text: "Se pierde la cuenta.⁶", at: c("cuenta") - 10, accent: "cuenta", size: 104 }]} />
      <Tally at={lift + 2} questionAt={c("cuenta") - 4} until={total - 12} />
      <Sfx name="click" at={c("mezclar")} volume={0.25} />
      <Sfx name="click" at={c("mezclar") + 18} volume={0.25} />
      <Sfx name="click" at={c("mezclar") + 36} volume={0.25} />
    </BeatShell>
  );
};

const Chile: React.FC = () => {
  const c = (s: string) => cue("chile", s);
  const total = getBeatDuration("chile");
  return (
    <BeatShell beat="chile">
      <Headline y={210} lines={[{ text: "47,2 %", at: c("mitad") - 8, accent: "47,2 %", size: 170, serif: true }]} />
      <Sub text="de quienes bebieron el último mes en Chile se emborrachó al menos una vez⁷" at={c("mitad") + 2} y={330} size={40} />
      <Hundred at={c("mitad") - 6} until={total - 12} top={470} />
    </BeatShell>
  );
};

const CtaLinkedIn: React.FC = () => {
  const c = (s: string) => cue("ctaLinkedIn", s);
  const total = getBeatDuration("ctaLinkedIn");
  return (
    <BeatShell beat="ctaLinkedIn">
      <Headline
        y={250}
        lines={[
          { text: "El orden no importa.", at: c("orden") - 8, size: 104 },
          { text: "La cantidad, sí.", at: c("cantidad") - 6, accent: "cantidad", size: 104 },
        ]}
      />
      <Sub text="¿Qué mito te enseñaron a ti?" at={c("qué") - 4} y={400} size={48} color={K.ink} />
      <Sfx name="chime" at={Math.max(0, total - 70)} volume={0.2} />
    </BeatShell>
  );
};

const CtaInstagram: React.FC = () => {
  const c = (s: string) => cue("ctaInstagram", s);
  const total = getBeatDuration("ctaInstagram");
  return (
    <BeatShell beat="ctaInstagram">
      <Headline
        y={250}
        lines={[
          { text: "El orden no importa.", at: c("orden") - 8, until: c("guárdalo") - 4, size: 104 },
          { text: "La cantidad, sí.", at: c("cantidad") - 6, until: c("guárdalo") - 4, accent: "cantidad", size: 104 },
          { text: "Guárdalo.", at: c("guárdalo") - 4, accent: "Guárdalo.", size: 140, serif: true },
        ]}
      />
      <Sfx name="chime" at={Math.max(0, total - 70)} volume={0.2} />
    </BeatShell>
  );
};

export const BEATS: Record<BeatKey, React.FC> = {
  hookLinkedIn: HookLinkedIn,
  hookInstagram: HookInstagram,
  ensayo: Ensayo,
  realidad: Realidad,
  higado: Higado,
  congeneres: Congeneres,
  velocidad: Velocidad,
  porque: Porque,
  chile: Chile,
  ctaLinkedIn: CtaLinkedIn,
  ctaInstagram: CtaInstagram,
};

export const Blank: React.FC = () => <AbsoluteFill />;
