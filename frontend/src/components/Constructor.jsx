import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import formatImageUrl from "../utils/imageUrl";

// Прямые пути к изображениям цветов в public
const flowerImages = {
  'Роза': '/assets/flowers/rose.png',
  'Пион': '/assets/flowers/peony.png',
  'Лилия': '/assets/flowers/lily.png',
  'Тюльпан': '/assets/flowers/tulip.png',
  'Гербера': '/assets/flowers/gerbera.png',
  'Хризантема': '/assets/flowers/chrysanthemum.png'
};

const Constructor = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [cells, setCells] = useState([]);
  const [totalFlowers, setTotalFlowers] = useState(19);
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Загрузка цветов из базы данных
  useEffect(() => {
    const fetchFlowers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/flowers');

        if (!response.ok) {
          throw new Error('Не удалось загрузить цветы');
        }

        const data = await response.json();
        console.log('Загруженные цветы из БД:', data); // Отладочный вывод

        // Преобразуем данные в нужный формат, если необходимо
        const formattedData = data.map(flower => ({
          id: flower.id,
          name: flower.name,
          price: flower.price,
          image_url: flower.image_url || null
        }));

        setFlowers(formattedData);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке цветов:', err);
        setError('Не удалось загрузить цветы. Пожалуйста, перезагрузите страницу.');
        // Установка дефолтных цветов в случае ошибки
        setFlowers([
          { id: 1, name: 'Роза', price: 200, image_url: '/assets/flowers/rose.png' },
          { id: 2, name: 'Пион', price: 300, image_url: '/assets/flowers/peony.png' },
          { id: 3, name: 'Лилия', price: 250, image_url: '/assets/flowers/lily.png' },
          { id: 4, name: 'Тюльпан', price: 150, image_url: '/assets/flowers/tulip.png' },
          { id: 5, name: 'Гербера', price: 180, image_url: '/assets/flowers/gerbera.png' },
          { id: 6, name: 'Хризантема', price: 220, image_url: '/assets/flowers/chrysanthemum.png' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowers();
  }, []);

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

  const calculateLayer = (index, totalFlowers) => {
    if (index === 0) return 0;
    const layerCapacities = [1, 6, 12, 18, 24];
    let flowersLeft = totalFlowers - 1;
    let layers = [];
    let currentLayer = 1;

    while (flowersLeft > 0) {
      const maxForLayer = layerCapacities[currentLayer] || (currentLayer * 6);
      if (flowersLeft < (maxForLayer * 3) / 5 && currentLayer > 1) {
        const extraFlowersPerLayer = Math.floor(flowersLeft / (currentLayer - 1));
        const remainder = flowersLeft % (currentLayer - 1);
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

    let countBefore = 1;
    for (let layer = 0; layer < layers.length; layer++) {
      if (index < countBefore + layers[layer]) {
        return layer + 1;
      }
      countBefore += layers[layer];
    }

    return layers.length;
  };

  const calculatePosition = (cell) => {
    if (cell.id === 0) return { x: 0, y: 0 };

    const layer = calculateLayer(cell.id, totalFlowers);
    let baseRadius = 42;

    if (totalFlowers >= 11 && totalFlowers <= 14) {
      baseRadius = 48;
    }

    let flowersInPreviousLayers = 1;
    let currentLayerSize = 0;

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

    for (let i = 0; i < layer - 1; i++) {
      flowersInPreviousLayers += layerSizes[i] || 0;
    }
    currentLayerSize = layerSizes[layer - 1] || 0;

    const positionInLayer = cell.id - flowersInPreviousLayers;
    const angleStep = (2 * Math.PI) / currentLayerSize;
    const baseRotation = Math.PI / 18;
    const layerRotation = layer * baseRotation * (layer % 2 === 0 ? 1 : -1);
    const angle = positionInLayer * angleStep + layerRotation;

    let radiusMultiplier = 1;

    if (wasRedistributed && layer < layerSizes.length) {
      radiusMultiplier = 1.1;
    } else if (lastLayerIncomplete) {
      radiusMultiplier = 0.95;
    }

    if (totalFlowers >= 11 && totalFlowers <= 14 && layer === 2) {
      radiusMultiplier = 1.5;
    }

    const radius = baseRadius * layer * radiusMultiplier;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return { x, y };
  };

  const calculateZIndex = (cell) => {
    const { x, y } = calculatePosition(cell);
    const distanceFromCenter = Math.sqrt(x * x + y * y);
    const baseZIndex = Math.floor(distanceFromCenter / 10);
    return cell.flower ? baseZIndex : 1000;
  };

  const cellStyle = (cell) => {
    const { x, y } = calculatePosition(cell);
    const zIndex = calculateZIndex(cell);

    const colors = ['#FFD6E0', '#FFE8D6', '#D4F0F0', '#E2F0CB', '#F7D1BA', '#D8D6FF'];
    const backgroundColorIndex = (cell.id % colors.length);

    return {
      width: '45px',
      height: '45px',
      backgroundColor: cell.flower ? 'transparent' : colors[backgroundColorIndex],
      border: cell.flower ? 'none' : `2px solid ${cell.isSelected ? '#4CAF50' : '#ddd'}`,
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'absolute',
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: cell.flower ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
      zIndex: zIndex,
      overflow: 'hidden',
      ':hover': {
        transform: 'translate(-50%, -50%) scale(1.1)',
        boxShadow: '0 0 10px rgba(255, 0, 100, 0.3)'
      }
    };
  };

  const handleCellClick = (cellId) => {
    setCells(prevCells =>
      prevCells.map(cell => {
        if (cell.id === cellId) {
          if (cell.flower) {
            return {
              ...cell,
              flower: null,
              isSelected: false
            };
          } else if (selectedFlower) {
            return {
              ...cell,
              flower: selectedFlower,
              isSelected: false
            };
          }
        }
        return {
          ...cell,
          isSelected: false
        };
      })
    );
  };

  const calculatePriceDetails = () => {
    const details = {};
    let totalPrice = 0;

    cells.forEach(cell => {
      if (cell.flower) {
        const flowerName = cell.flower.name;
        if (!details[flowerName]) {
          details[flowerName] = {
            count: 1,
            pricePerFlower: cell.flower.price,
            totalPrice: cell.flower.price
          };
        } else {
          details[flowerName].count++;
          details[flowerName].totalPrice = details[flowerName].count * details[flowerName].pricePerFlower;
        }
        totalPrice += cell.flower.price;
      }
    });

    return { details, totalPrice };
  };

  const { details, totalPrice } = calculatePriceDetails();

  // Функция для добавления букета в корзину
  const addToCart = async () => {
    if (!cells.some(cell => cell.flower)) {
      alert('Пожалуйста, добавьте хотя бы один цветок в букет');
      return;
    }

    if (!prompt.trim()) {
      if (!window.confirm('Хотите добавить букет без названия?')) {
        return;
      }
    }

    try {
      setSaving(true);

      // Собираем данные о букете
      const bouquetData = {
        name: prompt.trim() || 'Букет без названия',
        description: `Букет из ${Object.values(details).map(d => `${d.name} (${d.count} шт.)`).join(', ')}`,
        price: totalPrice,
        image_url: '/assets/custom-bouquet.jpg', // Заглушка для изображения
        flowers: cells.filter(cell => cell.flower).map(cell => ({
          flower_id: cell.flower.id,
          position: cell.position,
          layer: cell.layer
        }))
      };

      console.log('Данные букета для корзины:', bouquetData);

      // Получаем текущую корзину из localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Добавляем новый букет с уникальным id
      const newBouquet = {
        ...bouquetData,
        id: `custom_${Date.now()}`,
        quantity: 1,
        isCustom: true
      };

      cart.push(newBouquet);

      // Сохраняем обновленную корзину
      localStorage.setItem('cart', JSON.stringify(cart));

      // Показываем сообщение об успехе
      alert(`Букет "${bouquetData.name}" успешно добавлен в корзину!`);

      // Перенаправляем на страницу корзины
      if (window.confirm('Перейти в корзину?')) {
        navigate('/cart');
      }
    } catch (err) {
      console.error('Ошибка при добавлении букета в корзину:', err);
      alert('Не удалось добавить букет в корзину. Пожалуйста, попробуйте снова.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <h2 style={{
          fontFamily: 'var(--heading-font)',
          fontSize: '36px',
          fontWeight: '700',
          color: 'var(--text-color)',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Конструктор букета
        </h2>

        <div className="card fade-in" style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontFamily: 'var(--heading-font)',
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            Выберите размер букета
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '600px',
              gap: '15px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '500', minWidth: '30px', textAlign: 'center' }}>1</span>
              <input
                type="range"
                min="1"
                max="101"
                value={totalFlowers}
                onChange={(e) => setTotalFlowers(parseInt(e.target.value))}
                className="flower-range-slider"
                style={{
                  width: '100%'
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: '500', minWidth: '40px', textAlign: 'center' }}>101</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-color)',
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>Выбрано цветков:</span>
                <input
                  type="number"
                  min="1"
                  max="101"
                  value={totalFlowers}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 101) {
                      setTotalFlowers(value);
                    }
                  }}
                  style={{
                    width: '60px',
                    border: '2px solid var(--accent-color)',
                    borderRadius: '5px',
                    padding: '5px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '5px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setTotalFlowers(19)}
                  style={{
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    margin: '2px'
                  }}
                >
                  Маленький (19)
                </button>
                <button
                  onClick={() => setTotalFlowers(37)}
                  style={{
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    margin: '2px'
                  }}
                >
                  Средний (37)
                </button>
                <button
                  onClick={() => setTotalFlowers(61)}
                  style={{
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    margin: '2px'
                  }}
                >
                  Большой (61)
                </button>
                <button
                  onClick={() => setTotalFlowers(101)}
                  style={{
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '2px'
                  }}
                >
                  Максимальный (101)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '40px'
        }}>
          <div className="card fade-in">
            <h3 style={{
              fontFamily: 'var(--heading-font)',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              Выберите цветы
            </h3>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                color: '#d32f2f',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                Загрузка цветов...
              </div>
            ) : (
              <>
                {selectedFlower && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '15px',
                    border: '1px solid var(--accent-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>
                        Выбран: {selectedFlower.name}
                      </span>
                      <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
                        Нажмите на любую ячейку справа, чтобы добавить цветок
                      </p>
                    </div>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--accent-color)',
                      fontSize: '18px'
                    }}>
                      {selectedFlower.price} ₽
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '15px'
                }}>
                  {flowers.map((flower) => (
                    <button
                      key={flower.id}
                      className="flower-button"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        background: selectedFlower?.id === flower.id ? '#FFB6C1' : 'var(--primary-color)',
                        color: selectedFlower?.id === flower.id ? '#000' : 'white',
                        fontFamily: 'var(--main-font)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        transform: selectedFlower?.id === flower.id ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: selectedFlower?.id === flower.id ? '0 0 15px rgba(255, 94, 126, 0.5)' : 'none',
                        fontWeight: selectedFlower?.id === flower.id ? '600' : 'normal'
                      }}
                      onClick={() => setSelectedFlower(flower)}
                    >
                      {flower.name} - {flower.price} ₽
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card fade-in">
            <h3 style={{
              fontFamily: 'var(--heading-font)',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              Ваш букет
            </h3>

            <div style={{
              position: 'relative',
              height: '400px',
              marginBottom: '20px'
            }}>
              {cells.map(cell => (
                <div
                  key={cell.id}
                  style={cellStyle(cell)}
                  onClick={() => handleCellClick(cell.id)}
                >
                  {cell.flower && (
                    <img
                      src={cell.flower.image_url
                        ? formatImageUrl(cell.flower.image_url)
                        : flowerImages[cell.flower.name] || `/assets/flowers/${cell.flower.id}.png`}
                      alt={cell.flower.name}
                      title=""
                      style={{
                        width: '110%',
                        height: '110%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: '-5%',
                        left: '-5%'
                      }}
                      onError={(e) => {
                        console.error(`Ошибка загрузки изображения для цветка ${cell.flower.name}:`, e.target.src);
                        // Если не удалось загрузить изображение из БД, пробуем из объекта flowerImages
                        if (e.target.src.includes('image_url') || e.target.src.includes('http://localhost:5000')) {
                          e.target.src = flowerImages[cell.flower.name] || `/assets/flowers/${cell.flower.id}.png`;
                        }
                        // Если не удалось загрузить из объекта flowerImages, пробуем по шаблону
                        else if (e.target.src.includes('/assets/flowers/') && !e.target.src.includes(`${cell.flower.id}.png`)) {
                          e.target.src = `/assets/flowers/${cell.flower.id}.png`;
                        }
                        // Если всё равно не удалось загрузить, скрываем изображение
                        else if (e.target.src.includes(`${cell.flower.id}.png`)) {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>
                Детализация стоимости:
              </h4>
              {Object.entries(details).map(([key, info]) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div>
                    {info.name} × {info.count} шт.
                  </div>
                  <div>
                    {info.totalPrice} ₽ ({info.pricePerFlower} ₽/шт.)
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '2px solid #f0f0f0',
                fontWeight: 'bold',
                textAlign: 'right'
              }}>
                Общая стоимость: {totalPrice} ₽
              </div>
            </div>
          </div>
        </div>

        <div className="card fade-in">
          <h3 style={{
            fontFamily: 'var(--heading-font)',
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            Название букета
          </h3>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Введите название вашего букета..."
            style={{
              width: '100%',
              height: '60px',
              background: 'rgba(255, 255, 255, 0.7)',
              border: '2px solid var(--accent-color)',
              borderRadius: '10px',
              padding: '15px',
              color: 'var(--text-color)',
              fontSize: '16px',
              resize: 'none',
              marginBottom: '20px',
              fontFamily: 'var(--main-font)',
              fontWeight: '500'
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <button
              className="btn-save"
              disabled={!cells.some(cell => cell.flower) || saving}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onClick={addToCart}
            >
              {saving ? 'Добавление...' : 'Добавить в корзину'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Constructor; 