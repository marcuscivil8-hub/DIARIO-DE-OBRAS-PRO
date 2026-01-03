import React from 'react';

const PageLoader: React.FC = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-blue"></div>
        <p className="mt-4 text-brand-gray font-semibold">Carregando...</p>
    </div>
);

export default PageLoader;
