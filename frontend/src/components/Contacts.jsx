import React from "react";

function Contacts() {
  return (
    <div style={styles.container}>
      <h1>Контакты</h1>
      <p>Свяжитесь с нами: +7 (900) 123-45-67</p>
      <p>Email: info@boquetshop.ru</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "40px" },
};

export default Contacts; // ✅ Экспорт по умолчанию (default)
