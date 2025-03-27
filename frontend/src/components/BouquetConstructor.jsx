import React, { useState, useEffect } from 'react';
import rose from '../assets/images/flowers/rose.png';
import tulip from '../assets/images/flowers/tulip.png';
import gerbera from '../assets/images/flowers/gerbera.png';
import chrysanthemum from '../assets/images/flowers/chrysanthemum.png';
import carnation from '../assets/images/flowers/carnation.png';
import iris from '../assets/images/flowers/iris.png';
import orchid from '../assets/images/flowers/orchid.png';

// Импортируем изображения цветов
const flowerImages = {
  'Роза': rose,
  'Тюльпан': tulip,
  'Гербера': gerbera,
  'Хризантема': chrysanthemum,
  'Гвоздика': carnation,
  'Ирис': iris,
  'Орхидея': orchid,
};

const BouquetConstructor = ({ totalFlowers, selectedFlower }) => {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    const newCells = [];
    for (let i = 0; i < totalFlowers; i++) {
      newCells.push({
        id: i,
        flower: null,
        isSelected: false,
        layer: calculateLayer(i, totalFlowers),
        position: i
      });
    }
    setCells(newCells);
  }, [totalFlowers]);

  // Функция для определения слоя, в котором находится сота
  const calculateLayer = (index, totalFlowers) => {
    if (index === 0) return 0; // Центральная сота

    // Определяем идеальное количество цветов для каждого слоя
    const layerCapacities = [1, 6, 12, 18, 24]; // Максимальная вместимость каждого слоя

    // Сначала определим, сколько полных слоев мы можем заполнить
    let flowersLeft = totalFlowers - 1; // Вычитаем центральную соту
    let layers = [];
    let currentLayer = 1;

    while (flowersLeft > 0) {
      const maxForLayer = layerCapacities[currentLayer] || (currentLayer * 6);

      // Проверяем, достаточно ли цветов для следующего слоя
      if (flowersLeft < (maxForLayer * 3) / 5 && currentLayer > 1) {
        // Если цветов меньше 3/5 для текущего слоя,
        // распределяем их по предыдущим слоям
        const extraFlowersPerLayer = Math.floor(flowersLeft / (currentLayer - 1));
        const remainder = flowersLeft % (currentLayer - 1);

        // Распределяем дополнительные цветы по предыдущим слоям
        for (let i = 0; i < layers.length; i++) {
          layers[i] += extraFlowersPerLayer;
          if (i < remainder) layers[i]++;
        }
        break;
      }

      const flowersInThisLayer = Math.min(flowersLeft, maxForLayer);
      layers.push(flowersInThisLayer);
      flowersLeft -= flowersInThisLayer;
      currentLayer++;
    }

    // Определяем, в каком слое находится текущий индекс
    let countBefore = 1; // Учитываем центральную соту
    for (let layer = 0; layer < layers.length; layer++) {
      if (index < countBefore + layers[layer]) {
        return layer + 1;
      }
      countBefore += layers[layer];
    }

    return layers.length;
  };

  const calculatePosition = (cell) => {
    if (cell.id === 0) return { x: 0, y: 0 }; // Центральная сота

    const layer = calculateLayer(cell.id, totalFlowers);
    let baseRadius = 42; // Базовое расстояние между слоями

    // Специальный случай для 11-14 цветов
    if (totalFlowers >= 11 && totalFlowers <= 14) {
      baseRadius = 48; // Увеличиваем базовый радиус для этого случая
    }

    // Находим количество цветов в текущем слое с учетом перераспределения
    let flowersInPreviousLayers = 1; // Центральная сота
    let currentLayerSize = 0;

    // Пересчитываем распределение цветов для определения размера текущего слоя
    let remainingFlowers = totalFlowers - 1;
    let layerSizes = [];
    let currentLayer = 1;
    let wasRedistributed = false;
    let lastLayerIncomplete = false;

    while (remainingFlowers > 0) {
      const maxForLayer = currentLayer * 6;
      if (remainingFlowers < (maxForLayer * 3) / 5 && currentLayer > 1) {
        wasRedistributed = true;
        const extraFlowersPerLayer = Math.floor(remainingFlowers / (currentLayer - 1));
        const remainder = remainingFlowers % (currentLayer - 1);

        for (let i = 0; i < layerSizes.length; i++) {
          layerSizes[i] += extraFlowersPerLayer;
          if (i < remainder) layerSizes[i]++;
        }
        break;
      }

      const flowersInThisLayer = Math.min(remainingFlowers, maxForLayer);
      layerSizes.push(flowersInThisLayer);

      if (remainingFlowers <= maxForLayer && flowersInThisLayer < maxForLayer) {
        lastLayerIncomplete = true;
      }

      remainingFlowers -= flowersInThisLayer;
      currentLayer++;
    }

    // Находим количество цветов в предыдущих слоях и текущем слое
    for (let i = 0; i < layer - 1; i++) {
      flowersInPreviousLayers += layerSizes[i] || 0;
    }
    currentLayerSize = layerSizes[layer - 1] || 0;

    // Позиция внутри текущего слоя
    const positionInLayer = cell.id - flowersInPreviousLayers;

    // Базовый угол для текущей позиции
    const angleStep = (2 * Math.PI) / currentLayerSize;

    // Добавляем поворот для каждого слоя (10 градусов = Math.PI / 18)
    const baseRotation = Math.PI / 18;
    const layerRotation = layer * baseRotation * (layer % 2 === 0 ? 1 : -1);

    // Итоговый угол с учетом позиции и поворота слоя
    const angle = positionInLayer * angleStep + layerRotation;

    // Рассчитываем радиус с адаптивным изменением
    let radiusMultiplier = 1;

    if (wasRedistributed && layer < layerSizes.length) {
      radiusMultiplier = 1.1;
    }

    // Рассчитываем радиус слоя с учетом мультипликатора
    const radius = layer * baseRadius * radiusMultiplier;

    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    };
  };

  const calculateZIndex = (cell) => {
    // Центральный элемент всегда наверху
    if (cell.id === 0) return totalFlowers + 1;
    // Остальные элементы имеют z-index в обратном порядке от слоя
    return totalFlowers - calculateLayer(cell.id, totalFlowers);
  };

  const cellStyle = (cell) => {
    const position = calculatePosition(cell);
    const size = 60; // Размер соты
    const centerX = 250; // Центр X конструктора
    const centerY = 250; // Центр Y конструктора

    return {
      width: `${size}px`,
      height: `${size}px`,
      position: 'absolute',
      left: `${centerX + position.x}px`,
      top: `${centerY + position.y}px`,
      borderRadius: '50%',
      backgroundColor: cell.flower ? 'transparent' : '#e0e0e0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      zIndex: calculateZIndex(cell),
      transition: 'all 0.3s ease',
      transform: cell.isSelected ? 'scale(1.1)' : 'scale(1)',
      boxShadow: cell.isSelected ? '0 0 15px rgba(0,0,0,0.3)' : 'none',
      backgroundImage: cell.flower ? `url(${flowerImages[cell.flower]})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  const handleCellClick = (cellId) => {
    // Если выбрана ячейка и выбран цветок, устанавливаем цветок в ячейку
    if (selectedFlower) {
      setCells(cells.map(cell => {
        if (cell.id === cellId) {
          return { ...cell, flower: selectedFlower, isSelected: true };
        } else {
          return { ...cell, isSelected: false };
        }
      }));

      // Устанавливаем выбранную ячейку
      setSelectedCell(cellId);
    } else {
      // Если цветок не выбран, просто выделяем ячейку
      setCells(cells.map(cell => {
        if (cell.id === cellId) {
          return { ...cell, isSelected: !cell.isSelected };
        } else {
          return { ...cell, isSelected: false };
        }
      }));

      // Устанавливаем или сбрасываем выбранную ячейку
      setSelectedCell(selectedCell === cellId ? null : cellId);
    }
  };

  const removeFlower = () => {
    if (selectedCell !== null) {
      setCells(cells.map(cell => {
        if (cell.id === selectedCell) {
          return { ...cell, flower: null, isSelected: false };
        }
        return cell;
      }));
      setSelectedCell(null);
    }
  };

  // Расчет стоимости букета
  const calculateTotalPrice = () => {
    const basePrice = 1000; // Базовая стоимость букета
    const pricePerFlower = 350; // Стоимость за один цветок

    // Считаем количество установленных цветов
    const flowersCount = cells.filter(cell => cell.flower).length;

    return basePrice + (flowersCount * pricePerFlower);
  };

  const calculatePriceDetails = () => {
    const details = {};
    let basePrice = 1000; // Базовая стоимость букета

    cells.forEach(cell => {
      if (cell.flower) {
        const flowerName = cell.flower.name;
        if (!details[flowerName]) {
          details[flowerName] = {
            name: flowerName,
            count: 1,
            pricePerFlower: cell.flower.price,
            totalPrice: cell.flower.price
          };
        } else {
          details[flowerName].count++;
          details[flowerName].totalPrice = details[flowerName].count * details[flowerName].pricePerFlower;
        }
      }
    });

    const flowerDetails = Object.values(details).map(detail => ({
      flowerType: detail.name,
      count: detail.count,
      price: detail.totalPrice
    }));

    return {
      basePrice,
      flowerDetails,
      totalPrice: basePrice + flowerDetails.reduce((sum, detail) => sum + detail.price, 0)
    };
  };

  return (
    <div style={{ position: 'relative', width: '500px', height: '500px', margin: '0 auto', marginTop: '2rem' }}>
      {cells.map((cell) => (
        <div
          key={cell.id}
          style={cellStyle(cell)}
          onClick={() => handleCellClick(cell.id)}
        />
      ))}

      {/* Удаление выбранного цветка */}
      {selectedCell !== null && cells.find(c => c.id === selectedCell)?.flower && (
        <button
          onClick={removeFlower}
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Удалить цветок
        </button>
      )}

      {/* Отображение информации о цене */}
      <div style={{ textAlign: 'center', marginTop: '520px' }}>
        <h3>Стоимость букета: {calculateTotalPrice()} ₽</h3>
        <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <p>Базовая стоимость: {calculatePriceDetails().basePrice} ₽</p>
          {calculatePriceDetails().flowerDetails.map((detail, index) => (
            <p key={index}>
              {detail.flowerType}: {detail.count} шт. × {350} ₽ = {detail.price} ₽
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BouquetConstructor; 