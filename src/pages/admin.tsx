import { useState } from "react";

export default function Admin() {
  const [key, setKey] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [pricePerDayRub, setPrice] = useState(3000);
  const [prepDays, setPrep] = useState(1);
  const [msg, setMsg] = useState("");

  async function create() {
    setMsg("");
    const r = await fetch("/api/bikes/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key
      },
      body: JSON.stringify({ brand, model, pricePerDayRub, prepDays })
    });
    const j = await r.json();
    if (!r.ok) { setMsg(`Ошибка: ${JSON.stringify(j)}`); return; }
    setMsg("Готово ✅ Мотоцикл добавлен.");
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <a href="/">← назад</a>
      <h1>Админка</h1>
      <p>Введи ADMIN_KEY и добавь технику.</p>

      <div style={{ display: "grid", gap: 8 }}>
        <label>ADMIN_KEY <input value={key} onChange={e=>setKey(e.target.value)} /></label>
        <label>Марка <input value={brand} onChange={e=>setBrand(e.target.value)} /></label>
        <label>Модель <input value={model} onChange={e=>setModel(e.target.value)} /></label>
        <label>Цена/сутки (₽) <input type="number" value={pricePerDayRub} onChange={e=>setPrice(parseInt(e.target.value||"0",10))} /></label>
        <label>Подготовка (сутки) <input type="number" value={prepDays} onChange={e=>setPrep(parseInt(e.target.value||"0",10))} /></label>
        <button onClick={create}>Добавить</button>
        {msg && <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}

