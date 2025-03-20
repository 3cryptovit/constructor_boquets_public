import React from "react";

function About() {
  return (
    <div style={styles.container}>
      <h1>О нас</h1>
      <p>Мы предлагаем лучшие букеты для любого случая!</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "40px" },
};

export default About; // ✅ Экспорт по умолчанию (default)
