
import React from 'react';
import { ICONS } from '../../constants';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-brand-blue">{title}</h2>
                    <button onClick={onClose} className="text-brand-gray hover:text-brand-blue">
                        {ICONS.close}
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;


// --- Confirmation Modal ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar' }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className="text-brand-gray">{message}</div>
                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} size="sm">
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={onConfirm} className="flex items-center space-x-2" size="sm">
                        {React.cloneElement(ICONS.delete, { className: "h-5 w-5" })}
                        <span>{confirmText}</span>
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
