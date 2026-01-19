import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function BikePage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const [bike, setBike] = useState<any>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch("/api/bikes").then(r => r.json()).then((all) => setBike(all.find((x:any)=>x.id===id)));
  }, [id]);

  async function check() {
    setMsg("");
    const r = await fetch(`/api/availability?bikeId=${id}&start=${start}&end=${end}`);
    const j = await r.json();
    setMsg(j.available ? "Доступно ✅" : "Недоступно ❌ (есть пересечение или подготовка)");
  }

  async function book() {
    setMsg("");
    const r = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bikeId: id, start, end })
    });
    const j = await r.json();
    if (!r.ok) { setMsg(`Ошибка: ${j.error}`); return; }
    window.location.href = j.payUrl; // редирект на оплату
  }

  if (!bike) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Загрузка…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <a href="/">← назад</a>
      <h1>{bike.brand} {bike.model}</h1>
      <div>Цена/сутки: <b>{bike.pricePerDayRub} ₽</b></div>
      <div>Подготовка после аренды: <b>{bike.prepDays} сутки</b></div>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <label>Дата начала <input type="date" value={start} onChange={e=>setStart(e.target.value)} /></label>
        <label>Дата конца <input type="date" value={end} onChange={e=>setEnd(e.target.value)} /></label>
        <button onClick={check}>Проверить доступность</button>
        <button onClick={book} style={{ fontWeight: 700 }}>Забронировать и оплатить 1 сутки</button>
        {msg && <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}

