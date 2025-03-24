import React, { useState } from 'react';

const FlowerCounter = ({ onCountChange }) => {
  const [count, setCount] = useState(1);
  const MIN_COUNT = 1;
  const MAX_COUNT = 25;

  const handleDecrease = () => {
    const newCount = Math.max(MIN_COUNT, count - 1);
    setCount(newCount);
    onCountChange(newCount);
  };

  const handleIncrease = () => {
    const newCount = Math.min(MAX_COUNT, count + 1);
    setCount(newCount);
    onCountChange(newCount);
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= MIN_COUNT && newValue <= MAX_COUNT) {
      setCount(newValue);
      onCountChange(newValue);
    }
  };

  const counterStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 auto',
    marginBottom: '1rem',
    maxWidth: '300px',
  };

  const titleStyle = {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };

  const buttonStyle = {
    width: '40px',
    height: '40px',
    fontSize: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const inputStyle = {
    width: '60px',
    height: '40px',
    margin: '0 10px',
    textAlign: 'center',
    fontSize: '1.2rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  };

  const infoStyle = {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center',
    maxWidth: '280px',
  };

  return (
    <div style={counterStyle}>
      <div style={titleStyle}>Количество цветов в букете:</div>
      <div style={controlsStyle}>
        <button
          onClick={handleDecrease}
          style={count <= MIN_COUNT ? disabledButtonStyle : buttonStyle}
          disabled={count <= MIN_COUNT}
        >
          −
        </button>
        <input
          type="number"
          min={MIN_COUNT}
          max={MAX_COUNT}
          value={count}
          onChange={handleChange}
          style={inputStyle}
        />
        <button
          onClick={handleIncrease}
          style={count >= MAX_COUNT ? disabledButtonStyle : buttonStyle}
          disabled={count >= MAX_COUNT}
        >
          +
        </button>
      </div>
      <div style={infoStyle}>
        Выберите количество цветов в букете от {MIN_COUNT} до {MAX_COUNT}.
        Чем больше цветов, тем богаче будет выглядеть букет.
      </div>
    </div>
  );
};

export default FlowerCounter; 