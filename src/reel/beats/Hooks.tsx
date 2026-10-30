import React from "react";
import { random, useCurrentFrame } from "remotion";
import { BeatShell } from "../BeatShell";
import { Arrow, Burst, Chip, Counter, R, Sfx, Slam, Sticker, enter, float, shake, tween } from "../kit";
import { cue } from "../script";

// LinkedIn: frame 0 is already busy — folders raining and a counter racing to
// 300 that locks at 1 s; the claim builds word by word underneath.
export const HookLinkedIn: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("hookLinkedIn", s);
  const tAsi = c("así");
  const tNinos = c("niños");
  const tComuna = c("tu comuna");
  const lock = 30;
  // After "Así…", the counter shrinks to a chip at the top.
  const move = tween(frame, tAsi - 4, 12);
  const rainOut = 1 - tween(frame, tAsi - 6, 10);
  const sh = shake(frame, lock, 26, 14);

  return (
    <BeatShell beat="hookLinkedIn" bg={R.navy} cut={false}>
      {/* Folder rain, already falling at frame 0 */}
      <div style={{ opacity: rainOut }}>
        {new Array(16).fill(0).map((_, i) => {
          const speed = 18 + random(`v${i}`) * 14;
          const y = ((random(`y${i}`) * 2100 + frame * speed) % 2300) - 250;
          const x = 60 + random(`x${i}`) * 960;
          return (
            <Sticker
              key={i}
              name={i % 3 ? "file-folder" : "open-file-folder"}
              x={x}
              y={y}
              size={110 + random(`s${i}`) * 70}
              rot={(random(`r${i}`) - 0.5) * 60 + frame * (i % 2 ? 2 : -2)}
              at={-10}
              bob={0}
              sfx={null}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sh.x}px, ${sh.y - move * 270}px) scale(${1 - move * 0.55})`,
          transformOrigin: "540px 640px",
        }}
      >
        <Chip text="HASTA" x={540} y={360} at={-6} size={64} bg={R.yellow} />
        <Counter to={300} x={540} y={600} size={400} at={0} duration={lock} />
        <Slam text="CASOS" x={540} y={850} size={150} at={8} sfx={null} />
        <Chip text="por profesional" x={540} y={1000} at={c("profesional")} size={60} bg={R.yellow} />
      </div>

      {/* "…la oficina que protege a los niños de tu comuna" */}
      <Sticker name="office-building" x={540} y={840} size={400} at={tAsi} />
      <Burst x={540} y={840} at={tAsi} radius={360} />
      <Sticker name="child" x={230} y={1080} size={220} at={tNinos} rot={-8} />
      <Sticker name="girl" x={850} y={1080} size={220} at={tNinos + 4} rot={8} />
      <Sticker name="round-pushpin" x={720} y={600} size={170} at={tComuna} rot={15} />
      <Slam text="TU COMUNA" x={540} y={1215} size={96} at={tComuna} bg={R.yellow} color={R.ink} rot={-4} />
    </BeatShell>
  );
};

// Instagram: frame 0 is a big child in an alarm pulse; the office crashes in
// at ~1.5 s ("esta oficina") and "OLN" slams at the end.
export const HookInstagram: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("hookInstagram", s);
  const tRiesgo = c("riesgo");
  const tOficina = c("esta oficina");
  const tPrimero = c("primero");
  const tOln = c("oficina local");
  const drop = enter(frame, tOficina, 220);
  const kidMove = tween(frame, tOficina - 6, 12);
  const sh = shake(frame, tOficina + 6, 30, 14);
  const pulse = (frame % 20) / 20;

  return (
    <BeatShell beat="hookInstagram" bg={R.navy} cut={false}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* Alarm rings around the child */}
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
          {[0, 0.33, 0.66].map((o) => {
            const p = (pulse + o) % 1;
            return (
              <circle
                key={o}
                cx={540 - kidMove * 290}
                cy={760 + kidMove * 200}
                r={240 + p * 300 * (1 - kidMove * 0.5)}
                fill="none"
                stroke={R.coral}
                strokeWidth={18}
                opacity={(1 - p) * (1 - kidMove * 0.7)}
              />
            );
          })}
        </svg>
        <Sticker
          name="child"
          x={540 - kidMove * 290}
          y={760 + kidMove * 200}
          size={560 - kidMove * 300}
          at={-8}
          rot={float(frame, 4, 24)}
          sfx={null}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 1 - tween(frame, tOln - 6, 6) }}>
          <Sticker name="police-car-light" x={860} y={400} size={190} at={-4} rot={float(frame, 14, 16)} sfx={null} />
          <Sticker name="warning" x={220} y={400} size={170} at={2} rot={-10} />
        </div>
        <Slam text="¡EN RIESGO!" x={540} y={1130} size={120} at={tRiesgo} bg={R.coral} rot={-5} />
        <Sfx name="alarm" at={0} volume={0.18} />

        {/* The office crashes in from the top */}
        {frame >= tOficina ? (
          <Sticker
            name="office-building"
            x={760}
            y={-300 + drop * 1110}
            size={400}
            at={tOficina}
            bob={0}
            sfx="thud"
          />
        ) : null}
        <Burst x={760} y={810} at={tOficina + 6} radius={380} />
        <Arrow from={[330, 900]} to={[560, 780]} at={tOficina + 8} color={R.yellow} bend={-160} />
        <Chip text="actúa primero" x={760} y={575} at={tPrimero} size={58} bg={R.yellow} />
      </div>
      <Slam text="OLN" x={540} y={380} size={250} at={tOln} color={R.yellow} />
      <Sticker name="sparkles" x={860} y={300} size={150} at={tOln + 3} sfx="ding" />
    </BeatShell>
  );
};
