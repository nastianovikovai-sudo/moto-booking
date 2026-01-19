import { useEffect, useState } from "react";

export default function Home() {
  const [bikes, setBikes] = useState<any[]>([]);
  useEffect(() => { fetch("/api/bikes").then(r => r.json()).then(setBikes); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Мотопрокат — бронирование</h1>
      <p>Оплата онлайн: первые сутки. Подготовка техники: +1 сутки после аренды.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {bikes.map(b => (
          <a key={b.id} href={`/bike/${b.id}`} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12, textDecoration: "none", color: "inherit" }}>
            <b>{b.brand} {b.model}</b>
            <div>Цена/сутки: {b.pricePerDayRub} ₽</div>
            <div>Подготовка: {b.prepDays} сутки</div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <a href="/admin">Админка</a>
      </div>
    </div>
  );
}

