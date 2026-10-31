import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatShell } from "../BeatShell";
import { Headline, K, Sfx, Sub } from "../kit";
import { BeatKey, cue, getBeatDuration } from "../script";

// Each beat is only words: the bench underneath is continuous. Headlines sit
// in the top third, the object in the middle, captions and the source below.

const HookLinkedIn: React.FC = () => {
  const c = (s: string) => cue("hookLinkedIn", s);
  return (
    <BeatShell beat="hookLinkedIn" fadeIn={false}>
      <Headline
        y={250}
        lines={[
          { text: "90 personas.", at: 10 },
          { text: "Dos órdenes.", at: c("órdenes") - 6 },
          { text: "La misma resaca.", at: c("misma") - 4, accent: "misma" },
        ]}
        size={120}
      />
      <Sfx name="click" at={14} volume={0.25} />
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
          { text: "¿Cerveza y después vino\nda más resaca?", at: 8, until: c("no") - 6, size: 104 },
          { text: "No.", at: c("no") - 4, accent: "No.", size: 200 },
        ]}
      />
      <Sfx name="click" at={14} volume={0.25} />
    </BeatShell>
  );
};

const Ensayo: React.FC = () => {
  const c = (s: string) => cue("ensayo", s);
  return (
    <BeatShell beat="ensayo">
      <Headline
        y={250}
        lines={[
          { text: "Cerveza, luego vino.", at: c("cerveza") - 6, until: c("revés") + 2, size: 96 },
          { text: "Vino, luego cerveza.", at: c("revés") - 2, until: c("misma") - 2, size: 96 },
          { text: "La misma lectura.", at: c("misma") - 4, accent: "misma", size: 104 },
        ]}
      />
      <Sub text="Ensayo clínico cruzado, 90 personas¹" at={c("noventa") - 4} until={c("misma") - 6} y={400} />
    </BeatShell>
  );
};

const Realidad: React.FC = () => {
  const c = (s: string) => cue("realidad", s);
  return (
    <BeatShell beat="realidad" dark>
      <Headline
        y={760}
        color={K.white}
        lines={[
          { text: "Cuánto entra.", at: c("cuánto") - 6, size: 150 },
          { text: "Cuánto sale.", at: c("salir") - 10, size: 150 },
        ]}
      />
    </BeatShell>
  );
};

const Higado: React.FC = () => {
  const c = (s: string) => cue("higado", s);
  return (
    <BeatShell beat="higado">
      <Headline y={250} lines={[{ text: "≈ 1 trago por hora²", at: c("un trago") - 8, accent: "1" }]} size={96} />
      <Sub text="Lo que tu hígado procesa, en promedio" at={c("hora") + 2} y={380} />
      <Sfx name="click" at={c("procesa")} volume={0.3} />
      <Sfx name="drip" at={c("procesa") + 14} volume={0.25} />
      <Sfx name="drip" at={c("procesa") + 36} volume={0.2} />
      <Sfx name="drip" at={c("procesa") + 60} volume={0.2} />
    </BeatShell>
  );
};

const Congeneres: React.FC = () => {
  const c = (s: string) => cue("congeneres", s);
  return (
    <BeatShell beat="congeneres">
      <Headline y={250} lines={[{ text: "Congéneres³", at: c("congéneres") - 6, accent: "Congéneres" }]} size={124} />
      <Sub text="Más en las bebidas oscuras: whisky, ron añejo, vino tinto" at={c("oscuras") - 2} y={380} />
      <Sfx name="click" at={c("oscuras") + 20} volume={0.25} />
    </BeatShell>
  );
};

const Velocidad: React.FC = () => {
  const c = (s: string) => cue("velocidad", s);
  const words: Array<[string, string]> = [
    ["Velocidad.", "velocidad"],
    ["Estómago vacío.", "vacío"],
    ["Burbujas.", "burbujas"],
    ["Sueño.", "poco"],
  ];
  return (
    <BeatShell beat="velocidad">
      <Headline
        y={250}
        lines={words.map(([text, word], i) => ({
          text,
          at: c(word) - 6,
          until: i < words.length - 1 ? c(words[i + 1][1]) - 6 : undefined,
          size: 112,
        }))}
      />
      <Sub text="También cuenta el cómo⁴" at={4} y={380} />
    </BeatShell>
  );
};

const Porque: React.FC = () => {
  const c = (s: string) => cue("porque", s);
  const lift = c("mezclar") - 4;
  return (
    <BeatShell beat="porque" dark={lift}>
      <Headline y={760} color={K.white} lines={[{ text: "El mito parece cierto.", at: 4, until: lift - 2, size: 132 }]} />
      <Headline y={250} lines={[{ text: "Se pierde la cuenta.", at: c("cuenta") - 10, accent: "cuenta", size: 108 }]} />
      <Sfx name="click" at={c("mezclar")} volume={0.25} />
      <Sfx name="click" at={c("mezclar") + 18} volume={0.25} />
      <Sfx name="click" at={c("mezclar") + 36} volume={0.25} />
    </BeatShell>
  );
};

const Chile: React.FC = () => {
  const c = (s: string) => cue("chile", s);
  return (
    <BeatShell beat="chile">
      <Headline y={250} lines={[{ text: "47,2 %", at: c("mitad") - 8, accent: "47,2 %", size: 180, weight: 500 }]} />
      <Sub text="de quienes bebieron el último mes en Chile se emborrachó al menos una vez⁵" at={c("mitad") + 2} y={390} />
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
          { text: "Guárdalo.", at: c("guárdalo") - 4, accent: "Guárdalo.", size: 140 },
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
