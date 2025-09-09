import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
  };

  const formatDisplay = (value: string) => {
    if (value.length > 9) {
      const num = parseFloat(value);
      if (num > 999999999) {
        return num.toExponential(3);
      }
      return num.toFixed(9 - Math.floor(Math.log10(Math.abs(num))) - 1);
    }
    return value;
  };

  const Button: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    wide?: boolean;
  }> = ({ onClick, className = '', children, wide = false }) => (
    <button
      className={`
        h-20 rounded-full font-medium text-3xl transition-all duration-150 active:scale-95 select-none
        ${wide ? 'col-span-2 px-8 flex items-center justify-start pl-8' : 'w-20'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-black rounded-3xl p-6 shadow-2xl">
        {/* Display */}
        <div className="mb-4 p-4 text-right">
          <div className="text-6xl font-light text-white min-h-[90px] flex items-end justify-end overflow-hidden">
            {formatDisplay(display)}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <Button
            onClick={clear}
            className="bg-gray-400 text-black hover:bg-gray-300"
          >
            AC
          </Button>
          <Button
            onClick={toggleSign}
            className="bg-gray-400 text-black hover:bg-gray-300"
          >
            +/−
          </Button>
          <Button
            onClick={percentage}
            className="bg-gray-400 text-black hover:bg-gray-300"
          >
            %
          </Button>
          <Button
            onClick={() => performOperation('÷')}
            className={`bg-orange-500 text-white hover:bg-orange-400 ${
              operation === '÷' ? 'bg-white text-orange-500' : ''
            }`}
          >
            ÷
          </Button>

          {/* Row 2 */}
          <Button
            onClick={() => inputNumber('7')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            7
          </Button>
          <Button
            onClick={() => inputNumber('8')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            8
          </Button>
          <Button
            onClick={() => inputNumber('9')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            9
          </Button>
          <Button
            onClick={() => performOperation('×')}
            className={`bg-orange-500 text-white hover:bg-orange-400 ${
              operation === '×' ? 'bg-white text-orange-500' : ''
            }`}
          >
            ×
          </Button>

          {/* Row 3 */}
          <Button
            onClick={() => inputNumber('4')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            4
          </Button>
          <Button
            onClick={() => inputNumber('5')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            5
          </Button>
          <Button
            onClick={() => inputNumber('6')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            6
          </Button>
          <Button
            onClick={() => performOperation('-')}
            className={`bg-orange-500 text-white hover:bg-orange-400 ${
              operation === '-' ? 'bg-white text-orange-500' : ''
            }`}
          >
            −
          </Button>

          {/* Row 4 */}
          <Button
            onClick={() => inputNumber('1')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            1
          </Button>
          <Button
            onClick={() => inputNumber('2')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            2
          </Button>
          <Button
            onClick={() => inputNumber('3')}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            3
          </Button>
          <Button
            onClick={() => performOperation('+')}
            className={`bg-orange-500 text-white hover:bg-orange-400 ${
              operation === '+' ? 'bg-white text-orange-500' : ''
            }`}
          >
            +
          </Button>

          {/* Row 5 */}
          <Button
            onClick={() => inputNumber('0')}
            className="bg-gray-700 text-white hover:bg-gray-600"
            wide={true}
          >
            0
          </Button>
          <Button
            onClick={inputDecimal}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            ,
          </Button>
          <Button
            onClick={() => performOperation('=')}
            className="bg-orange-500 text-white hover:bg-orange-400"
          >
            =
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;