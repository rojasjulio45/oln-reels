import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BeatShell } from "../BeatShell";
import { Arrow, Chip, Counter, R, Sfx, Slam, Sticker, enter, shake, tween } from "../kit";
import { cue } from "../script";
import chile from "../assets/chile.json";

export const Ley: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("ley", s);
  const tLey = c("ley 21.430");
  const tReemplazan = c("reemplazan");
  const tOpd = c("protección de derechos");
  const up = tween(frame, tReemplazan - 4, 10);
  const sh = shake(frame, tLey + 4, 20);
  return (
    <BeatShell beat="ley" bg={R.violet}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y - up * 240}px) scale(${1 - up * 0.3})`, transformOrigin: "540px 300px" }}>
        <Sticker name="page-with-curl" x={540} y={700} size={560} at={1} rot={-4} />
        <Slam text={"LEY\n21.430"} x={560} y={760} size={130} at={tLey} bg={R.coral} rot={-10} />
        <Chip text="2022" x={850} y={420} at={c("2022")} size={70} bg={R.yellow} />
      </div>
      {/* OPD → OLN */}
      <Chip text="OPD" x={280} y={1070} at={tReemplazan} size={92} bg="#c9c9d9" color="#55557a" />
      <Sticker name="cross-mark" x={390} y={990} size={120} at={tOpd} sfx="thud" />
      <Arrow from={[420, 1070]} to={[640, 1070]} at={tReemplazan + 4} bend={-60} />
      <Chip text="OLN" x={800} y={1070} at={tReemplazan + 8} size={92} bg={R.yellow} />
      <Sticker name="check-mark-button" x={880} y={990} size={120} at={tOpd + 4} />
    </BeatShell>
  );
};

export const Mision: React.FC = () => {
  const c = (s: string) => cue("mision", s);
  const rows = [
    { t: c("promover"), icon: "megaphone", word: "PROMOVER", y: 640, color: R.yellow },
    { t: c("prevenir"), icon: "umbrella", word: "PREVENIR", y: 880, color: R.white },
    { t: c("proteger"), icon: "shield", word: "PROTEGER", y: 1120, color: R.yellow },
  ] as const;
  return (
    <BeatShell beat="mision" bg={R.teal}>
      <Slam text="SU MISIÓN" x={540} y={380} size={110} at={2} bg={R.ink} sfx={null} />
      {rows.map((r, i) => (
        <React.Fragment key={r.word}>
          <Sticker name={r.icon} x={i % 2 ? 840 : 220} y={r.y} size={210} at={r.t} rot={i % 2 ? 10 : -10} />
          <Slam text={r.word} x={i % 2 ? 400 : 660} y={r.y} size={118} at={r.t + 2} color={r.color} sfx={null} />
        </React.Fragment>
      ))}
    </BeatShell>
  );
};

const Door: React.FC<{ x: number; y: number; open: number; color: string; children: React.ReactNode }> = ({ x, y, open, color, children }) => (
  <div style={{ position: "absolute", left: x - 140, top: y - 200, width: 280, height: 400 }}>
    <div style={{ position: "absolute", inset: -14, borderRadius: 26, background: R.ink, opacity: 0.35 }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "#fff4d6", overflow: "hidden" }}>{children}</div>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        background: color,
        transformOrigin: "left center",
        transform: `perspective(900px) rotateY(${-80 * open}deg)`,
        boxShadow: "inset -40px 0 0 rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ position: "absolute", right: 30, top: 190, width: 28, height: 28, borderRadius: 14, background: R.yellow }} />
    </div>
  </div>
);

export const Puertas: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("puertas", s);
  const doors = [
    { t: c("familia"), x: 190, color: R.coral, label: "FAMILIA", icon: "people-hugging" },
    { t: c("alerta"), x: 540, color: R.sky, label: "ALERTA", icon: "bell" },
    { t: c("tribunal"), x: 890, color: R.violet, label: "TRIBUNAL", icon: "judge" },
  ] as const;
  return (
    <BeatShell beat="puertas" bg={R.orange}>
      <Slam text="3 PUERTAS" x={540} y={370} size={140} at={c("tres puertas")} color={R.yellow} />
      {doors.map((d, i) => {
        const open = tween(frame, d.t, 10);
        return (
          <React.Fragment key={d.label}>
            <Chip text={String(i + 1)} x={d.x} y={560} at={4 + i * 4} size={60} bg={R.ink} color={R.white} />
            <Door x={d.x} y={830} open={open} color={d.color}>
              <div style={{ position: "absolute", left: 140 - 100, top: 230 - 100, transform: `scale(${open})` }}>
                <Sticker name={d.icon} x={100} y={100} size={200} at={d.t} bob={4} />
              </div>
            </Door>
            <Chip text={d.label} x={d.x} y={1090} at={d.t + 2} size={46} bg={R.white} />
          </React.Fragment>
        );
      })}
      <Sticker name="school" x={440} y={1210} size={110} at={c("colegio")} />
      <Sticker name="stethoscope" x={640} y={1210} size={110} at={c("consultorio")} />
    </BeatShell>
  );
};

export const Proceso: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("proceso", s);
  const steps = [
    { t: c("evalúa"), x: 200, icon: "magnifying-glass-tilted-left", label: "EVALÚA" },
    { t: c("plan"), x: 540, icon: "clipboard", label: "PLAN" },
    { t: c("conecta"), x: 880, icon: "handshake", label: "CONECTA" },
  ] as const;
  const net = [
    { t: c("consultorio"), x: 230, icon: "stethoscope", label: "CONSULTORIO\n(CESFAM)" },
    { t: c("colegio"), x: 540, icon: "school", label: "COLEGIO" },
    { t: c("apoyo social"), x: 850, icon: "house-with-garden", label: "APOYO\nSOCIAL" },
  ] as const;
  const bar = interpolate(frame, [steps[0].t, steps[2].t], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <BeatShell beat="proceso" bg={R.sky}>
      <Sticker name="woman" x={540} y={400} size={250} at={1} />
      <Chip text="GESTOR/A DE CASOS" x={540} y={580} at={c("gestor de casos")} size={56} bg={R.yellow} />
      {/* progress rail between the three steps */}
      <div style={{ position: "absolute", left: 200, top: 790, width: 680, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.3)" }} />
      <div style={{ position: "absolute", left: 200, top: 790, width: 680 * bar, height: 18, borderRadius: 9, background: R.yellow }} />
      {steps.map((s) => (
        <React.Fragment key={s.label}>
          <Sticker name={s.icon} x={s.x} y={800} size={180} at={s.t} />
          <Chip text={s.label} x={s.x} y={940} at={s.t + 2} size={44} />
        </React.Fragment>
      ))}
      {net.map((n) => (
        <React.Fragment key={n.icon}>
          <Arrow from={[880, 1000]} to={[n.x, 1090]} at={n.t - 4} color="rgba(255,255,255,0.8)" bend={40} />
          <Sticker name={n.icon} x={n.x} y={1120} size={140} at={n.t} />
          <Chip text={n.label} x={n.x} y={1240} at={n.t + 2} size={34} bg={R.yellow} />
        </React.Fragment>
      ))}
    </BeatShell>
  );
};

export const Grave: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("grave", s);
  const tDeriva = c("deriva");
  const strobe = frame < tDeriva ? 0.5 + 0.5 * Math.sign(Math.sin(frame / 2.2)) : 0;
  const sh = frame < tDeriva ? shake(frame, frame - (frame % 6), 14, 6) : { x: 0, y: 0 };
  return (
    <BeatShell beat="grave" bg={R.red}>
      <div style={{ position: "absolute", inset: 0, background: "#7a0010", opacity: strobe * 0.35 }} />
      <Sfx name="alarm" at={0} volume={0.3} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Sticker name="police-car-light" x={190} y={440} size={200} at={0} rot={Math.sin(frame / 3) * 15} sfx={null} />
        <Sticker name="police-car-light" x={890} y={440} size={200} at={2} rot={-Math.sin(frame / 3) * 15} sfx={null} />
        <Slam text="GRAVE" x={540} y={560} size={220} at={c("grave")} color={R.white} />
      </div>
      <Arrow from={[540, 690]} to={[290, 860]} at={tDeriva} bend={-40} />
      <Arrow from={[540, 690]} to={[790, 860]} at={tDeriva} bend={-40} />
      <Sticker name="shield" x={290} y={960} size={200} at={c("protección")} />
      <Chip text={"PROTECCIÓN\nESPECIALIZADA"} x={290} y={1140} at={c("protección") + 2} size={40} />
      <Sticker name="balance-scale" x={790} y={960} size={200} at={c("tribunal")} />
      <Chip text={"TRIBUNAL\nDE FAMILIA"} x={790} y={1140} at={c("tribunal") + 2} size={40} />
    </BeatShell>
  );
};

export const Reto: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("reto", s);
  const t346 = c("346");
  const t2027 = c("2027");
  const t300 = c("300");
  const scale = 0.8;
  const mapX = 70;
  const mapY = 250;
  const lit = Math.floor(interpolate(frame, [t346, t346 + 40], [0, chile.points.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fill = tween(frame, t2027, 24);
  return (
    <BeatShell beat="reto" bg={R.navy}>
      <Slam text="EL RETO" x={720} y={300} size={90} at={2} bg={R.coral} sfx={null} />
      {/* Chile, one light per comuna */}
      <svg
        style={{ position: "absolute", left: mapX, top: mapY, opacity: enter(frame, 2) }}
        width={chile.width * scale}
        height={chile.height * scale}
        viewBox={`0 0 ${chile.width} ${chile.height}`}
      >
        <path d={chile.d} fill="#1f3a8a" stroke="#8fb0ff" strokeWidth={3} strokeLinejoin="round" />
        {chile.points.slice(0, lit).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7} fill={R.yellow} opacity={0.9} />
        ))}
      </svg>
      {lit > 0 ? <Sfx name="click" at={t346} volume={0.3} /> : null}
      <Counter to={346} x={720} y={480} size={220} at={t346} duration={40} />
      <Chip text="COMUNAS" x={720} y={640} at={t346 + 6} size={56} bg={R.yellow} />

      {/* 2022 → 2027 */}
      <div style={{ position: "absolute", left: 470, top: 760, width: 500, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.2)", opacity: enter(frame, t2027 - 6) }} />
      <div style={{ position: "absolute", left: 470, top: 760, width: 500 * fill, height: 26, borderRadius: 13, background: R.teal }} />
      <Chip text="2022" x={480} y={830} at={t2027 - 6} size={36} bg={R.white} />
      <Slam text="2027" x={920} y={835} size={80} at={t2027 + 20} color={R.yellow} />
      <Sticker name="hourglass-not-done" x={700} y={860} size={110} at={t2027} />

      {/* case load */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sticker key={i} name="file-folder" x={600 + (i % 2) * 30} y={1150 - i * 42} size={140} at={t300 + i * 2} bob={0} sfx={i === 0 ? "pop" : null} />
      ))}
      <Counter to={300} x={860} y={1080} size={130} at={t300} duration={18} />
      <Chip text="casos por gestor" x={820} y={1190} at={t300 + 6} size={36} />
    </BeatShell>
  );
};

