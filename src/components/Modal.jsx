import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  AlertCircle
} from 'lucide-react';

// Hook para gerenciar modais
export const useModal = () => {
  const [modal, setModal] = useState(null);

  const showAlert = (message, type = 'info', title = null) => {
    setModal({
      type: 'alert',
      alertType: type,
      title: title || getDefaultTitle(type),
      message,
      onClose: () => setModal(null)
    });
  };

  const showConfirm = (message, title = 'Confirmar', onConfirm, onCancel = null) => {
    setModal({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setModal(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setModal(null);
        if (onCancel) onCancel();
      }
    });
  };

  const showPrompt = (message, title = 'Entrada', defaultValue = '', onConfirm, onCancel = null) => {
    setModal({
      type: 'prompt',
      title,
      message,
      defaultValue,
      onConfirm: (value) => {
        setModal(null);
        if (onConfirm) onConfirm(value);
      },
      onCancel: () => {
        setModal(null);
        if (onCancel) onCancel();
      }
    });
  };

  const hideModal = () => setModal(null);

  return {
    modal,
    showAlert,
    showConfirm,
    showPrompt,
    hideModal
  };
};

const getDefaultTitle = (type) => {
  switch (type) {
    case 'success': return 'Sucesso';
    case 'error': return 'Erro';
    case 'warning': return 'Atenção';
    default: return 'Informação';
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return AlertCircle;
    case 'warning': return AlertTriangle;
    default: return Info;
  }
};

const getColors = (type) => {
  switch (type) {
    case 'success': 
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      };
    case 'error': 
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      };
    case 'warning': 
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      };
    default: 
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      };
  }
};

// Componente de Modal de Alerta
const AlertModal = ({ title, message, alertType, onClose }) => {
  const Icon = getIcon(alertType);
  const colors = getColors(alertType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-full ${colors.bg} ${colors.border} border`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-white rounded-lg transition-colors ${colors.button}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Modal de Confirmação
const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Modal de Prompt
const PromptModal = ({ title, message, defaultValue, onConfirm, onCancel }) => {
  const [value, setValue] = useState(defaultValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-blue-50 border border-blue-200">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="text-gray-700 mb-3 leading-relaxed">
                {message}
              </p>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente principal do Modal
const Modal = ({ modal }) => {
  useEffect(() => {
    if (modal) {
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [modal]);

  if (!modal) return null;

  switch (modal.type) {
    case 'alert':
      return (
        <AlertModal
          title={modal.title}
          message={modal.message}
          alertType={modal.alertType}
          onClose={modal.onClose}
        />
      );
    case 'confirm':
      return (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      );
    case 'prompt':
      return (
        <PromptModal
          title={modal.title}
          message={modal.message}
          defaultValue={modal.defaultValue}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      );
    default:
      return null;
  }
};

export default Modal;
