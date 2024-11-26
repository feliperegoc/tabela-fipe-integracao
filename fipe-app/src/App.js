import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X } from 'lucide-react';

// Tradução dos meses
const mesesEmPortugues = {
  'January': 'Janeiro',
  'February': 'Fevereiro',
  'March': 'Março',
  'April': 'Abril',
  'May': 'Maio',
  'June': 'Junho',
  'July': 'Julho',
  'August': 'Agosto',
  'September': 'Setembro',
  'October': 'Outubro',
  'November': 'Novembro',
  'December': 'Dezembro'
};

// Componente de AutoComplete
const AutocompleteInput = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (search && options) {
      const filtered = options.filter(option => 
        option.toString().toLowerCase().includes(search.toString().toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options || []);
    }
  }, [search, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        className="w-full p-2 border rounded"
        value={search || ''}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => handleSelectOption(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente Card
const Card = ({ 
  index, 
  onRemove, 
  canAdd, 
  onAdd, 
  values, 
  onChange, 
  marcas, 
  modelos, 
  anos, 
  combustiveis
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg relative">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Veículo {index + 1}</h3>
        
        <div className="space-y-3">
          <AutocompleteInput
            value={values.marca}
            onChange={(value) => onChange(index, 'marca', value)}
            options={marcas}
            placeholder="Digite a marca"
          />

          <AutocompleteInput
            value={values.modelo}
            onChange={(value) => onChange(index, 'modelo', value)}
            options={modelos}
            placeholder="Digite o modelo"
            disabled={!values.marca}
          />

          <AutocompleteInput
            value={values.ano}
            onChange={(value) => onChange(index, 'ano', value)}
            options={anos}
            placeholder="Digite o ano"
            disabled={!values.marca}
          />

          <AutocompleteInput
            value={values.combustivel}
            onChange={(value) => onChange(index, 'combustivel', value)}
            options={combustiveis}
            placeholder="Digite o combustível"
            disabled={!values.marca || !values.modelo || !values.ano}
          />
        </div>
      </div>

      {index > 0 && (
        <button
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          ×
        </button>
      )}

      {canAdd && (
        <button
          onClick={onAdd}
          className="absolute top-1/2 -right-6 transform -translate-y-1/2 bg-blue-500 rounded-full p-1 text-white hover:bg-blue-600"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};

// Componente para histórico de preços
const PriceHistory = ({ precos, index }) => {
  if (!precos || precos.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h4 className="font-semibold mb-2">Histórico de Preços - Veículo {index + 1}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Mês/Ano</th>
              <th className="px-4 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {precos.map((preco, idx) => (
              <tr key={idx} className={idx === 0 ? "font-bold bg-blue-50" : ""}>
                <td className="px-4 py-2">{preco.label}</td>
                <td className="px-4 py-2 text-right">
                  {preco.valor.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para sugestões
const Suggestions = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Sugestões de veículos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Marca</th>
              <th className="px-4 py-2 text-left">Modelo</th>
              <th className="px-4 py-2 text-center">Ano</th>
              <th className="px-4 py-2 text-left">Combustível</th>
              <th className="px-4 py-2 text-right">Preço</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((sugestao, idx) => (
              <tr 
                key={idx} 
                className={idx % 2 === 0 ? "bg-gray-50" : ""}
              >
                <td className="px-4 py-2">{sugestao.marca}</td>
                <td className="px-4 py-2">{sugestao.modelo}</td>
                <td className="px-4 py-2 text-center">{sugestao.ano}</td>
                <td className="px-4 py-2">{sugestao.combustivel}</td>
                <td className="px-4 py-2 text-right">
                  {sugestao.preco.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente principal App
const App = () => {
  const [cards, setCards] = useState([{ marca: '', modelo: '', ano: '', combustivel: '' }]);
  const [marcas, setMarcas] = useState([]);
  const [modelosByCard, setModelosByCard] = useState([]);
  const [anosByCard, setAnosByCard] = useState([]);
  const [combustiveisByCard, setCombustiveisByCard] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/marcas')
      .then(res => res.json())
      .then(data => setMarcas(data))
      .catch(err => console.error('Erro ao carregar marcas:', err));
  }, []);

  const handleChange = async (index, field, value) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };

    if (field === 'marca') {
      newCards[index].modelo = '';
      newCards[index].ano = '';
      newCards[index].combustivel = '';
      
      try {
        const response = await fetch(`http://localhost:3001/api/anos/${value}`);
        const anos = await response.json();
        const newAnosByCard = [...anosByCard];
        newAnosByCard[index] = anos;
        setAnosByCard(newAnosByCard);

        const modelosResponse = await fetch(`http://localhost:3001/api/modelos/${value}`);
        const modelos = await modelosResponse.json();
        const newModelosByCard = [...modelosByCard];
        newModelosByCard[index] = modelos;
        setModelosByCard(newModelosByCard);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    }
    else if (field === 'modelo' && newCards[index].marca) {
      newCards[index].combustivel = '';
      newCards[index].ano = ''; // Limpa o ano quando seleciona um novo modelo
      
      try {
        // Busca os anos disponíveis para esta combinação de marca e modelo
        const response = await fetch(
          `http://localhost:3001/api/anos-por-modelo/${newCards[index].marca}/${value}`
        );
        const anos = await response.json();
        const newAnosByCard = [...anosByCard];
        newAnosByCard[index] = anos;
        setAnosByCard(newAnosByCard);
      } catch (error) {
        console.error('Erro ao buscar anos:', error);
      }
    }
    else if (field === 'ano' && newCards[index].marca) {
      newCards[index].combustivel = '';
      if (!newCards[index].modelo) {
        try {
          const response = await fetch(
            `http://localhost:3001/api/modelos/${newCards[index].marca}/${value}`
          );
          const modelos = await response.json();
          const newModelosByCard = [...modelosByCard];
          newModelosByCard[index] = modelos;
          setModelosByCard(newModelosByCard);
        } catch (error) {
          console.error('Erro ao buscar modelos:', error);
        }
      } else {
        try {
          const response = await fetch(
            `http://localhost:3001/api/combustiveis/${newCards[index].marca}/${newCards[index].modelo}/${value}`
          );
          const combustiveis = await response.json();
          const newCombustiveisByCard = [...combustiveisByCard];
          newCombustiveisByCard[index] = combustiveis;
          setCombustiveisByCard(newCombustiveisByCard);
        } catch (error) {
          console.error('Erro ao buscar combustíveis:', error);
        }
      }
    }

    setCards(newCards);
  };

  const addCard = () => {
    if (cards.length < 3) {
      setCards([...cards, { marca: '', modelo: '', ano: '', combustivel: '' }]);
    }
  };

  const removeCard = (index) => {
    setCards(cards.filter((_, idx) => idx !== index));
    setResults(results.filter((_, idx) => idx !== index));
    setSuggestions([]); // Limpa as sugestões ao remover um card
  };

  const handleSubmit = async () => {
    setLoading(true);
    const newResults = [];

    for (const card of cards) {
      if (card.marca && card.modelo && card.ano && card.combustivel) {
        try {
          const params = new URLSearchParams(card);
          const response = await fetch(`http://localhost:3001/api/precos?${params}`);
          const data = await response.json();
          
          const dataComMesesTraduzidos = data.map(preco => {
            if (preco.label === "Valor Atual") return preco;
            
            const [mes, ano] = preco.label.split('/');
            const mesEmPortugues = mesesEmPortugues[mes] || mes;
            return {
              ...preco,
              label: `${mesEmPortugues}/${ano}`
            };
          });
          
          newResults.push(dataComMesesTraduzidos);
        } catch (error) {
          console.error('Erro ao buscar preços:', error);
        }
      }
    }

    setResults(newResults);

    // Buscar sugestões baseadas nos valores atuais
    if (newResults.length > 0) {
      try {
        const valoresAtuais = newResults.map(result => 
          result[0].valor // Pega o "Valor Atual" de cada resultado
        );

        const suggestionsParams = new URLSearchParams();
        valoresAtuais.forEach(valor => suggestionsParams.append('valores[]', valor));

        const suggestionsResponse = await fetch(`http://localhost:3001/api/sugestoes?${suggestionsParams}`);
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      }
    }

    setLoading(false);
  };

  const handleClear = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <h1 className="text-3xl font-bold text-center">Consulta FIPE</h1>

        {/* Seção de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <Card
              key={index}
              index={index}
              values={card}
              onChange={handleChange}
              onRemove={removeCard}
              canAdd={index === cards.length - 1 && cards.length < 3}
              onAdd={addCard}
              marcas={marcas}
              modelos={modelosByCard[index] || []}
              anos={anosByCard[index] || []}
              combustiveis={combustiveisByCard[index] || []}
            />
          ))}
        </div>

        {/* Botões de Consulta e Limpar */}
        <div className="text-center py-4 border-t border-b border-gray-200">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                "Consultando..."
              ) : (
                <>
                  <Search size={20} className="mr-2" />
                  Consultar
                </>
              )}
            </button>
            
            <button
              onClick={handleClear}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 flex items-center"
            >
              <X size={20} className="mr-2" />
              Limpar
            </button>
          </div>
        </div>

        {/* Seção de Resultados */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((precos, index) => (
              <PriceHistory key={index} precos={precos} index={index} />
            ))}
          </div>
        )}

        {/* Seção de Sugestões */}
        {suggestions.length > 0 && (
          <div className="mt-8">
            <Suggestions suggestions={suggestions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;