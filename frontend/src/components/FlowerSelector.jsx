import React, { useState } from 'react';

const FlowerSelector = ({ onFlowerSelect }) => {
  const [selectedFlower, setSelectedFlower] = useState(null);

  // Список доступных цветов
  const flowers = [
    'Роза',
    'Тюльпан',
    'Гербера',
    'Хризантема',
    'Гвоздика',
    'Ирис',
    'Орхидея'
  ];

  const handleFlowerSelect = (flower) => {
    const newSelection = selectedFlower === flower ? null : flower;
    setSelectedFlower(newSelection);
    onFlowerSelect(newSelection);
  };

  const getSelectorStyles = () => {
    return {
      container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '2rem',
      },
      title: {
        fontSize: '1.2rem',
        marginBottom: '1rem',
      },
      buttons: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        maxWidth: '600px',
      },
      button: (isSelected) => ({
        padding: '10px 15px',
        backgroundColor: isSelected ? '#4CAF50' : 'white',
        color: isSelected ? 'white' : '#333',
        border: isSelected ? 'none' : '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
      }),
      info: {
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: '#666',
        textAlign: 'center',
        maxWidth: '500px',
      }
    };
  };

  const styles = getSelectorStyles();

  return (
    <div style={styles.container}>
      <div style={styles.title}>Выберите тип цветка:</div>
      <div style={styles.buttons}>
        {flowers.map((flower) => (
          <button
            key={flower}
            onClick={() => handleFlowerSelect(flower)}
            style={styles.button(selectedFlower === flower)}
          >
            {flower}
          </button>
        ))}
      </div>
      <div style={styles.info}>
        {selectedFlower ? (
          <span>Выбран цветок: <strong>{selectedFlower}</strong>. Нажмите на соту в букете, чтобы разместить цветок.</span>
        ) : (
          <span>Выберите тип цветка, который хотите добавить в букет.</span>
        )}
      </div>
    </div>
  );
};

export default FlowerSelector; 